-- Secure customer booking creation: calculate prices from the locked property row.
-- Apply manually only after reviewing and testing in a non-production Supabase environment.
-- This migration intentionally does not alter production by itself.

CREATE OR REPLACE FUNCTION public.create_customer_booking(p_payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_booking_id bigint;
  v_property_id bigint;
  v_name text;
  v_phone text;
  v_email text;
  v_check_in date;
  v_check_out date;
  v_guests integer;
  v_message text;
  v_booking_option text;
  v_booking_option_label text;
  v_nights integer;
  v_base_price numeric;
  v_caution_fee numeric;
  v_extra_guest_amount numeric := 0;
  v_cleaning_fee numeric := 0;
  v_service_fee numeric := 0;
  v_other_fee numeric := 0;
  v_amount numeric;
  v_available boolean;
  v_property record;
  v_account_email text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Please sign in before booking.';
  END IF;

  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid booking details.';
  END IF;

  BEGIN
    v_property_id := (p_payload->>'property_id')::bigint;
    v_check_in := (p_payload->>'check_in')::date;
    v_check_out := (p_payload->>'check_out')::date;
    v_guests := coalesce(nullif(p_payload->>'guests', '')::integer, 1);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid property, date, or guest value.';
  END;

  v_name := nullif(trim(p_payload->>'customer_name'), '');
  v_phone := nullif(trim(p_payload->>'customer_phone'), '');
  v_email := nullif(trim(p_payload->>'customer_email'), '');
  v_message := p_payload->>'message';
  v_booking_option := lower(coalesce(nullif(trim(p_payload->>'booking_option'), ''), 'accommodation'));

  IF v_property_id IS NULL
     OR v_name IS NULL
     OR v_phone IS NULL
     OR v_email IS NULL
     OR v_check_in IS NULL
     OR v_check_out IS NULL
     OR v_check_out <= v_check_in
     OR v_check_in < CURRENT_DATE
     OR v_guests < 1
     OR v_booking_option NOT IN ('accommodation', 'event') THEN
    RAISE EXCEPTION 'Please provide valid booking details.';
  END IF;

  SELECT u.email
    INTO v_account_email
  FROM auth.users u
  WHERE u.id = v_user_id;

  IF v_account_email IS NULL OR lower(v_email) <> lower(v_account_email) THEN
    RAISE EXCEPTION 'Booking email must match your signed-in account.';
  END IF;

  -- Lock the property row so pricing and availability are read consistently
  -- against the same property record during this booking transaction.
  SELECT p.*
    INTO v_property
  FROM public.properties p
  WHERE p.id = v_property_id
    AND p.published = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This property is not available for booking.';
  END IF;

  v_nights := v_check_out - v_check_in;

  IF v_booking_option = 'event' THEN
    IF coalesce(v_property.event_enabled, false) IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Private events are not enabled for this property.';
    END IF;

    v_base_price := coalesce(v_property.event_price, 0);
    v_caution_fee := coalesce(v_property.event_caution_fee, 0);
    v_booking_option_label := 'Private Indoor Event';

    IF v_base_price <= 0 OR v_caution_fee < 0 THEN
      RAISE EXCEPTION 'This property has invalid private event pricing. Please contact Source Stays.';
    END IF;

    -- Event rate is charged per night; event caution is charged once.
    v_amount := (v_base_price * v_nights) + v_caution_fee;
  ELSE
    v_base_price := coalesce(v_property.price, 0);
    v_caution_fee := coalesce(v_property.caution_fee, 0);
    v_booking_option_label := coalesce(
      nullif(trim(v_property.public_title), ''),
      nullif(trim(v_property.title), ''),
      'Accommodation'
    );

    v_extra_guest_amount :=
      greatest(v_guests - 1, 0) * coalesce(v_property.extra_guest_fee, 0);
    v_cleaning_fee := coalesce(v_property.cleaning_fee, 0);
    v_service_fee := coalesce(v_property.service_fee, 0);
    v_other_fee := coalesce(v_property.other_fee, 0);

    IF v_base_price <= 0
       OR v_caution_fee < 0
       OR coalesce(v_property.extra_guest_fee, 0) < 0
       OR v_cleaning_fee < 0
       OR v_service_fee < 0
       OR v_other_fee < 0 THEN
      RAISE EXCEPTION 'This property has invalid accommodation pricing. Please contact Source Stays.';
    END IF;

    -- Match the existing website estimate: nightly rate plus guest/one-off fees.
    v_amount :=
      (v_base_price * v_nights)
      + v_extra_guest_amount
      + v_cleaning_fee
      + v_service_fee
      + v_other_fee
      + v_caution_fee;
  END IF;

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'The calculated booking amount is invalid.';
  END IF;

  SELECT public.check_property_availability(
    v_property_id,
    v_check_in,
    v_check_out
  )
  INTO v_available;

  IF v_available IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'These dates are unavailable. Please choose different dates.';
  END IF;

  INSERT INTO public.bookings (
    property_id,
    customer_name,
    customer_phone,
    customer_email,
    check_in,
    check_out,
    guests,
    message,
    amount_due,
    currency,
    payment_status,
    status,
    customer_user_id,
    booking_option,
    booking_option_label,
    booking_base_price,
    booking_caution_fee
  )
  VALUES (
    v_property_id,
    v_name,
    v_phone,
    v_email,
    v_check_in,
    v_check_out,
    v_guests,
    v_message,
    v_amount,
    'NGN',
    'unpaid',
    'pending',
    v_user_id,
    v_booking_option,
    v_booking_option_label,
    v_base_price,
    v_caution_fee
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$function$;
