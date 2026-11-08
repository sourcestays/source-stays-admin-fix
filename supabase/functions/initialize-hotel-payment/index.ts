import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getServiceKey = () => {
  const direct = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("ZYLUS_SUPABASE_SECRET_KEY");
  if (direct) return direct;
  const packed = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (packed) {
    try {
      const parsed = JSON.parse(packed);
      if (typeof parsed.default === "string") return parsed.default;
    } catch { /* ignore malformed optional secret bundle */ }
  }
  return "";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const serviceKey = getServiceKey();
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY")?.trim();

    if (!supabaseUrl || !publishableKey || !serviceKey || !paystackSecret) {
      console.error("Hotel payment initializer is missing server configuration.");
      return json({ error: "Payment service is temporarily unavailable." }, 503);
    }

    const authorization = req.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) {
      return json({ error: "Please sign in before making payment." }, 401);
    }

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = authorization.slice(7);
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Your login session is invalid." }, 401);
    const user = authData.user;

    const body = await req.json().catch(() => ({}));
    const requestRef = String(body.request_ref || "").trim();
    if (!/^SSR-[A-F0-9]{10}$/i.test(requestRef)) {
      return json({ error: "A valid hotel request reference is required." }, 400);
    }

    const { data: request, error: requestError } = await admin
      .from("hotel_availability_requests")
      .select("id,request_ref,customer_user_id,customer_name,customer_email,customer_phone,property_id,room_category_id,room_category,check_in,check_out,rooms_requested,status,availability_expires_at,payment_status")
      .eq("request_ref", requestRef)
      .eq("customer_user_id", user.id)
      .maybeSingle();

    if (requestError) throw requestError;
    if (!request) return json({ error: "Hotel availability request was not found." }, 404);

    const expiresAt = request.availability_expires_at
      ? new Date(request.availability_expires_at).getTime()
      : 0;
    if (
      !["available", "awaiting_payment"].includes(String(request.status)) ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      return json({ error: "The hotel's availability confirmation has expired. Please request availability again." }, 409);
    }
    if (request.payment_status === "paid") {
      return json({ error: "This hotel request has already been paid." }, 409);
    }

    const { data: existing, error: existingError } = await admin
      .from("hotel_payment_transactions")
      .select("reference,status,authorization_url,total_amount")
      .eq("request_id", request.id)
      .in("status", ["pending", "paid"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing?.status === "paid") {
      return json({ error: "Payment has already been received for this request." }, 409);
    }
    if (existing?.status === "pending" && existing.authorization_url) {
      return json({
        success: true,
        authorization_url: existing.authorization_url,
        reference: existing.reference,
        amount: Number(existing.total_amount),
        reused: true,
      });
    }

    const { data: room, error: roomError } = await admin
      .from("hotel_room_categories_public")
      .select("id,property_id,customer_rate")
      .eq("id", request.room_category_id)
      .eq("property_id", request.property_id)
      .maybeSingle();

    if (roomError) throw roomError;
    if (!room || !Number.isFinite(Number(room.customer_rate)) || Number(room.customer_rate) <= 0) {
      return json({ error: "The selected room rate is unavailable. Please contact Source Stays." }, 409);
    }

    const checkIn = new Date(request.check_in + "T00:00:00Z");
    const checkOut = new Date(request.check_out + "T00:00:00Z");
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
    const rooms = Number(request.rooms_requested);
    if (!Number.isInteger(nights) || nights < 1 || nights > 365 ||
        !Number.isInteger(rooms) || rooms < 1 || rooms > 20) {
      return json({ error: "The room count or stay dates are invalid." }, 400);
    }

    const accommodation = Math.round(Number(room.customer_rate) * nights * rooms * 100) / 100;
    const cautionFee = 20000 * rooms;
    const grossTotal = Math.round((accommodation + cautionFee) * 100) / 100;
    const { data: approvedCredit, error: creditError } = await admin
      .from("hotel_source_stays_credit_redemptions")
      .select("id,amount,status")
      .eq("request_id", request.id)
      .eq("customer_user_id", user.id)
      .eq("status", "approved")
      .maybeSingle();
    if (creditError) throw creditError;
    const creditAmount = approvedCredit ? Number(approvedCredit.amount) : 0;
    if (!Number.isFinite(creditAmount) || creditAmount < 0 || creditAmount > grossTotal) {
      return json({ error: "The approved Source Stays Credit amount is invalid. Please contact support." }, 409);
    }
    const total = Math.round((grossTotal - creditAmount) * 100) / 100;
    const amountKobo = Math.round(total * 100);
    if (!Number.isSafeInteger(amountKobo) || amountKobo <= 0) {
      return json({ error: "The calculated payment amount is invalid." }, 400);
    }

    const email = String(request.customer_email || user.email || "").trim();
    if (!email || !email.includes("@")) {
      return json({ error: "A valid customer email address is required for Paystack." }, 400);
    }

    // Re-check the request's state and expiry immediately before creating a charge.
    const { data: current, error: currentError } = await admin
      .from("hotel_availability_requests")
      .select("status,availability_expires_at,payment_status")
      .eq("id", request.id)
      .maybeSingle();
    if (currentError) throw currentError;
    const currentExpiry = current?.availability_expires_at
      ? new Date(current.availability_expires_at).getTime()
      : 0;
    if (!current || !["available", "awaiting_payment"].includes(current.status) ||
        currentExpiry <= Date.now() || current.payment_status === "paid") {
      return json({ error: "The availability confirmation is no longer valid. Please request availability again." }, 409);
    }

    const reference = "SSHTL-" + crypto.randomUUID().replaceAll("-", "").toUpperCase();
    const { data: transaction, error: insertError } = await admin
      .from("hotel_payment_transactions")
      .insert({
        request_id: request.id,
        reference,
        gateway: "paystack",
        currency: "NGN",
        accommodation_amount: accommodation,
        caution_fee_amount: cautionFee,
        total_amount: total,
        credit_amount: creditAmount,
        rooms_requested: rooms,
        nights,
        room_category_id: room.id,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    const callbackUrl = String(body.callback_url || "https://sourcestays.com.ng/hotel-booking.html")
      .trim();
    if (!/^https:\/\/([a-z0-9-]+\.)?sourcestays\.com\.ng(\/|$)/i.test(callbackUrl)) {
      await admin.from("hotel_payment_transactions").update({ status: "failed" }).eq("id", transaction.id);
      return json({ error: "Invalid payment return URL." }, 400);
    }

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + paystackSecret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: "NGN",
        reference,
        callback_url: callbackUrl,
        metadata: {
          payment_type: "hotel_booking",
          hotel_request_id: request.id,
          request_ref: request.request_ref,
          rooms_requested: rooms,
          nights,
          accommodation_amount: accommodation,
          refundable_caution_fee: cautionFee,
        },
      }),
    });

    const paystack = await paystackResponse.json().catch(() => null);
    if (!paystackResponse.ok || !paystack?.status || !paystack?.data?.authorization_url) {
      console.error("Paystack hotel initialization failed:", paystack?.message || paystackResponse.status);
      await admin.from("hotel_payment_transactions")
        .update({ status: "failed", gateway_response: paystack || { http_status: paystackResponse.status } })
        .eq("id", transaction.id);
      return json({ error: "Paystack could not initialize this payment. Please try again while availability is still valid." }, 502);
    }

    const { error: saveError } = await admin
      .from("hotel_payment_transactions")
      .update({
        authorization_url: paystack.data.authorization_url,
        access_code: paystack.data.access_code || null,
      })
      .eq("id", transaction.id)
      .eq("status", "pending");
    if (saveError) {
      console.error("Could not save Paystack hotel authorization details:", saveError);
      return json({ error: "Payment was initialized but could not be saved. Contact Source Stays before retrying." }, 500);
    }

    const { data: updatedRequest, error: requestUpdateError } = await admin
      .from("hotel_availability_requests")
      .update({
        status: "awaiting_payment",
        payment_status: "pending",
        payment_reference: reference,
        payment_url: paystack.data.authorization_url,
      })
      .eq("id", request.id)
      .eq("status", current.status)
      .gt("availability_expires_at", new Date().toISOString())
      .select("id")
      .maybeSingle();

    if (requestUpdateError || !updatedRequest) {
      console.error(
        "Could not safely update hotel request after Paystack initialization:",
        requestUpdateError || "Request status or availability window changed."
      );
      return json({
        error: "Availability expired or changed while payment was being prepared. Do not pay using this link. Contact Source Stays for a fresh confirmation."
      }, 409);
    }

    return json({
      success: true,
      authorization_url: paystack.data.authorization_url,
      reference,
      amount: total,
      currency: "NGN",
      accommodation_amount: accommodation,
      caution_fee_amount: cautionFee,
      rooms,
      nights,
    });
  } catch (error) {
    console.error("Hotel payment initialization error:", error);
    return json({
      error: error instanceof Error ? error.message : "Could not initialize hotel payment.",
    }, 500);
  }
});
