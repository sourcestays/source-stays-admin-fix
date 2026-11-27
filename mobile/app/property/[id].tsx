import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/src/lib/supabase";

type Property = {
  id: number; title: string; public_title: string | null; category: string;
  price: number | null; price_period: string | null; location: string | null;
  public_location: string | null; bedrooms: number | null; guests: number | null;
  amenities: string | null; image_url: string | null; hide_partner_identity: boolean | null;
  is_zylus_group?: boolean | null;
  owner_identity_verified: boolean | null; physical_inspection_verified: boolean | null;
  extra_guest_fee?: number | null; cleaning_fee?: number | null; service_fee?: number | null;
  other_fee?: number | null; caution_fee?: number | null;
  event_enabled?: boolean | null; event_price?: number | null; event_caution_fee?: number | null;
};
type Room = { id: string; room_name: string; description: string | null; customer_rate: number; max_guests: number | null; photo_urls: string[] | null };
type VillaPackage = { id: string | number; package_name: string; package_type: "day_getaway" | "overnight_getaway"; boat_included: boolean; description: string | null; boat_description: string | null; weekday_customer_rate: number; weekend_customer_rate: number; max_guests: number; start_time: string | null; end_time: string | null };

export default function PropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [villaPackages, setVillaPackages] = useState<VillaPackage[]>([]);
  const [selectedVillaPackageId, setSelectedVillaPackageId] = useState<string>("");
  const [villaStartDate, setVillaStartDate] = useState("");
  const [villaEndDate, setVillaEndDate] = useState("");
  const [villaGuests, setVillaGuests] = useState("2");
  const [villaName, setVillaName] = useState("");
  const [villaPhone, setVillaPhone] = useState("");
  const [villaEmail, setVillaEmail] = useState("");
  const [villaNote, setVillaNote] = useState("");
  const [villaBusy, setVillaBusy] = useState(false);
  const [villaMessage, setVillaMessage] = useState("");
  const [villaSuccess, setVillaSuccess] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [eventBusy, setEventBusy] = useState(false);
  const [eventMessage, setEventMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomCount, setRoomCount] = useState("1");
  const [guestCount, setGuestCount] = useState("1");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [hotelRequestRef, setHotelRequestRef] = useState("");
  const [hotelRequestStatus, setHotelRequestStatus] = useState("");
  const [hotelPaymentStatus, setHotelPaymentStatus] = useState("not_started");
  const [hotelAvailabilityExpiry, setHotelAvailabilityExpiry] = useState("");
  const [hotelPaymentBusy, setHotelPaymentBusy] = useState(false);
  const [bookingCheckIn, setBookingCheckIn] = useState("");
  const [bookingCheckOut, setBookingCheckOut] = useState("");
  const [bookingGuests, setBookingGuests] = useState("1");
  const [bookingOption, setBookingOption] = useState<"accommodation" | "event">("accommodation");
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [refundPolicyAccepted, setRefundPolicyAccepted] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [inspectionName, setInspectionName] = useState("");
  const [inspectionEmail, setInspectionEmail] = useState("");
  const [inspectionPhone, setInspectionPhone] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [inspectionTime, setInspectionTime] = useState("10:00 AM");
  const [inspectionNote, setInspectionNote] = useState("");
  const [inspectionBusy, setInspectionBusy] = useState(false);
  const [inspectionMessage, setInspectionMessage] = useState("");
  const [inspectionSuccess, setInspectionSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (!data.user || !active) return;
      const { data: profile } = await supabase.from("customer_profiles")
        .select("full_name,phone").eq("id", data.user.id).maybeSingle();
      if (!active) return;
      setCustomerName(current => current || String(profile?.full_name || data.user.user_metadata?.full_name || ""));
      setCustomerPhone(current => current || String(profile?.phone || data.user.user_metadata?.phone || ""));
      const { data: latestHotelRequest } = await supabase.from("hotel_availability_requests")
        .select("request_ref,status,payment_status,availability_expires_at")
        .eq("property_id", Number(id)).eq("customer_user_id", data.user.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!active) return;
      if (latestHotelRequest) {
        setHotelRequestRef(String(latestHotelRequest.request_ref || ""));
        setHotelRequestStatus(String(latestHotelRequest.status || ""));
        setHotelPaymentStatus(String(latestHotelRequest.payment_status || "not_started"));
        setHotelAvailabilityExpiry(String(latestHotelRequest.availability_expires_at || ""));
      }
    }
    loadProfile();
    async function load() {
      if (!supabase) {
        setError("Connect the Source Stays backend to view this listing.");
        setLoading(false);
        return;
      }
      const { data, error: propertyError } = await supabase.from("properties")
        .select("id,title,public_title,category,price,price_period,location,public_location,bedrooms,guests,amenities,image_url,hide_partner_identity,is_zylus_group,owner_identity_verified,physical_inspection_verified,extra_guest_fee,cleaning_fee,service_fee,other_fee,caution_fee,event_enabled,event_price,event_caution_fee")
        .eq("id", Number(id)).eq("published", true).maybeSingle();
      if (!active) return;
      if (propertyError || !data) {
        setError("This listing is unavailable.");
        setLoading(false);
        return;
      }
      setItem(data as Property);
      const [photoResult, roomResult, villaResult] = await Promise.all([
        supabase.from("property_images").select("image_url").eq("property_id", Number(id)).order("id"),
        String(data.category).toLowerCase() === "hotel"
          ? supabase.from("hotel_room_categories_public").select("id,room_name,description,customer_rate,max_guests,photo_urls").eq("property_id", Number(id)).order("sort_order")
          : Promise.resolve({ data: [], error: null }),
        String(data.category).toLowerCase() === "shortlet"
          ? supabase.from("villa_packages_public").select("id,property_id,package_name,package_type,boat_included,description,boat_description,weekday_customer_rate,weekend_customer_rate,max_guests,sort_order,start_time,end_time").eq("property_id", Number(id)).order("sort_order", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (!active) return;
      setImages([data.image_url, ...(photoResult.data || []).map((x: any) => x.image_url)].filter(Boolean) as string[]);
      const loadedRooms = (roomResult.data || []) as Room[];
      setRooms(loadedRooms);
      if (loadedRooms.length) setSelectedRoomId(loadedRooms[0].id);
      const loadedVillaPackages = (villaResult.data || []) as VillaPackage[];
      setVillaPackages(loadedVillaPackages);
      if (loadedVillaPackages.length) setSelectedVillaPackageId(String(loadedVillaPackages[0].id));
      if (villaResult.error) console.warn("Villa getaway packages could not be loaded:", villaResult.error);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [id]);

  const hidden = Boolean(item?.hide_partner_identity);
  const title = hidden ? (item?.public_title || "Luxury Private Getaway") : (item?.title || "Property");
  const place = hidden ? (item?.public_location || "Lagos") : (item?.location || "Location on request");
  const isHotel = String(item?.category || "").toLowerCase() === "hotel";
  const isShortlet = String(item?.category || "").toLowerCase() === "shortlet";
  const isRealEstate = ["sale", "land", "rent"].includes(String(item?.category || "").toLowerCase());
  const bookingNights = (() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingCheckIn) || !/^\d{4}-\d{2}-\d{2}$/.test(bookingCheckOut)) return 0;
    const start = Date.parse(bookingCheckIn + "T00:00:00Z");
    const end = Date.parse(bookingCheckOut + "T00:00:00Z");
    const count = Math.round((end - start) / 86400000);
    return Number.isFinite(count) && count > 0 ? count : 0;
  })();
  const bookingGuestNumber = Number(bookingGuests);
  const bookingPrice = Number(item?.price || 0);
  const isEventBooking = Boolean(item?.event_enabled) && bookingOption === "event";
  const bookingBaseRate = isEventBooking ? Number(item?.event_price || 0) : bookingPrice;
  const bookingDeposit = isEventBooking ? Number(item?.event_caution_fee || 0) : Number(item?.caution_fee || 0);
  const bookingAccommodation = bookingBaseRate * bookingNights;
  const bookingExtraGuest = Math.max(0, (Number.isInteger(bookingGuestNumber) ? bookingGuestNumber : 1) - 1) * Number(item?.extra_guest_fee || 0);
  const bookingCleaning = Number(item?.cleaning_fee || 0);
  const bookingService = Number(item?.service_fee || 0);
  const bookingOther = Number(item?.other_fee || 0);
  const bookingCaution = bookingDeposit;
  const bookingEstimate = bookingAccommodation + (isEventBooking ? 0 : bookingExtraGuest + bookingCleaning + bookingService + bookingOther) + bookingCaution;
  const money = (value: number) => "₦" + Math.round(value).toLocaleString("en-NG");
  const selectedVillaPackage = villaPackages.find(pkg => String(pkg.id) === selectedVillaPackageId) || null;
  const validVillaDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + "T00:00:00");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  const villaNights = (() => {
    if (!selectedVillaPackage || selectedVillaPackage.package_type !== "overnight_getaway" ||
        !validVillaDate(villaStartDate) || !validVillaDate(villaEndDate)) return 0;
    const days = Math.round((Date.parse(villaEndDate + "T00:00:00Z") - Date.parse(villaStartDate + "T00:00:00Z")) / 86400000);
    return days > 0 ? days : 0;
  })();
  const villaEstimate = (() => {
    if (!selectedVillaPackage || !validVillaDate(villaStartDate)) return 0;
    const rateFor = (date: Date) => date.getUTCDay() >= 5
      ? Number(selectedVillaPackage.weekend_customer_rate || 0)
      : Number(selectedVillaPackage.weekday_customer_rate || 0);
    if (selectedVillaPackage.package_type === "day_getaway") {
      const date = new Date(villaStartDate + "T00:00:00Z");
      return rateFor(date);
    }
    if (!villaNights) return 0;
    let total = 0;
    for (let i = 0; i < villaNights; i++) {
      const date = new Date(Date.parse(villaStartDate + "T00:00:00Z") + i * 86400000);
      total += rateFor(date);
    }
    return total;
  })();

  async function submitVillaRequest() {
    setVillaMessage("");
    setVillaSuccess(false);
    if (!supabase || !item || !selectedVillaPackage) return setVillaMessage("Please select an available getaway package.");
    if (!validVillaDate(villaStartDate)) return setVillaMessage("Enter a valid preferred date in YYYY-MM-DD format.");
    if (selectedVillaPackage.package_type === "overnight_getaway" && (!validVillaDate(villaEndDate) || villaNights < 1)) {
      return setVillaMessage("Choose a check-out date after your check-in date.");
    }
    const guests = Number(villaGuests);
    if (!Number.isInteger(guests) || guests < 1 || guests > Number(selectedVillaPackage.max_guests)) {
      return setVillaMessage("Guest count must be between 1 and " + selectedVillaPackage.max_guests + ".");
    }
    if (villaName.trim().length < 2 || villaPhone.trim().length < 7 || villaName.trim().length > 100 || villaPhone.trim().length > 30) {
      return setVillaMessage("Enter your name (2–100 characters) and phone number (7–30 characters).");
    }
    if (villaEmail.trim().length > 254 || (villaEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(villaEmail.trim()))) {
      return setVillaMessage("Enter a valid email address or leave it blank.");
    }
    if (villaNote.trim().length > 1000) return setVillaMessage("Your message must be 1,000 characters or fewer.");
    setVillaBusy(true);
    try {
      const { error } = await supabase.from("villa_booking_requests").insert({
        property_id: Number(id),
        package_id: selectedVillaPackage.id,
        customer_name: villaName.trim(),
        customer_phone: villaPhone.trim(),
        customer_email: villaEmail.trim() || null,
        preferred_start_date: villaStartDate,
        preferred_end_date: selectedVillaPackage.package_type === "overnight_getaway" ? villaEndDate : null,
        guest_count: guests,
        message: villaNote.trim() || null
      });
      if (error) throw error;
      setVillaSuccess(true);
      setVillaMessage("Your getaway request has been received. Source Stays will check availability with the partner and contact you. This is not yet a confirmed booking and no payment has been taken.");
      setVillaNote("");
    } catch (e) {
      setVillaMessage(e instanceof Error ? e.message : "We could not submit your request. Please try again.");
    } finally {
      setVillaBusy(false);
    }
  }

  async function submitVillaEventEnquiry() {
    setEventMessage("");
    if (!supabase || !item) return setEventMessage("The Source Stays service is not connected.");
    if (!villaName.trim() || villaName.trim().length > 100 || villaPhone.trim().length < 7 || villaPhone.trim().length > 30) {
      return setEventMessage("Please enter your name and phone number.");
    }
    if (!validVillaDate(eventDate)) return setEventMessage("Enter a valid event date in YYYY-MM-DD format.");
    if (eventDetails.trim().length > 1000) return setEventMessage("Event details must be 1,000 characters or fewer.");
    setEventBusy(true);
    try {
      const { error } = await supabase.from("enquiries").insert({
        property_id: Number(id),
        customer_name: villaName.trim(),
        customer_phone: villaPhone.trim(),
        customer_email: villaEmail.trim() || null,
        subject: "Special event quotation request: " + item.title,
        message: "Special Events enquiry for " + item.title + ". Preferred event date: " + eventDate + ". " + eventDetails.trim(),
        status: "new"
      });
      if (error) throw error;
      setEventMessage("Thank you. Your special-event enquiry has been received. Source Stays will contact you to discuss your requirements and quotation.");
      setEventDetails("");
    } catch (e) {
      setEventMessage(e instanceof Error ? e.message : "We could not submit your enquiry. Please try again.");
    } finally {
      setEventBusy(false);
    }
  }


  async function refreshHotelRequest(ref = hotelRequestRef) {
    if (!supabase || !ref) return;
    const { data, error } = await supabase.from("hotel_availability_requests")
      .select("request_ref,status,payment_status,availability_expires_at")
      .eq("request_ref", ref).maybeSingle();
    if (error) {
      console.warn("Could not refresh hotel request status:", error);
      return;
    }
    if (!data) return;
    setHotelRequestStatus(String(data.status || ""));
    setHotelPaymentStatus(String(data.payment_status || "not_started"));
    setHotelAvailabilityExpiry(String(data.availability_expires_at || ""));
  }

  async function startHotelPayment() {
    if (!supabase || !hotelRequestRef) return;
    setHotelPaymentBusy(true);
    setRequestMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("initialize-hotel-payment", {
        body: { request_ref: hotelRequestRef, callback_url: "https://sourcestays.com.ng/hotel-booking.html" }
      });
      if (error) throw error;
      if (!data?.success || !data?.authorization_url) throw new Error(data?.error || "Payment could not be initialized.");
      setHotelPaymentStatus("pending");
      await Linking.openURL(data.authorization_url);
    } catch (e) {
      setRequestMessage(e instanceof Error ? e.message : "Unable to start payment. Please try again.");
    } finally {
      setHotelPaymentBusy(false);
    }
  }

  async function submitHotelAvailability() {
    setRequestMessage("");
    setRequestSuccess(false);
    if (!supabase) return setRequestMessage("The Source Stays service is not connected.");
    if (!selectedRoomId) return setRequestMessage("Please select a room category.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
      return setRequestMessage("Enter dates in YYYY-MM-DD format.");
    }
    const start = Date.parse(checkIn + "T00:00:00Z");
    const end = Date.parse(checkOut + "T00:00:00Z");
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return setRequestMessage("Check-out must be after check-in. Please check your dates.");
    }
    const roomsRequested = Number(roomCount);
    const guests = Number(guestCount);
    if (!Number.isInteger(roomsRequested) || roomsRequested < 1 || roomsRequested > 20 ||
        !Number.isInteger(guests) || guests < 1 || guests > 50) {
      return setRequestMessage("Enter a valid number of rooms (1–20) and guests (1–50).");
    }
    if (customerName.trim().length < 2 || customerPhone.trim().length < 7) {
      return setRequestMessage("Please enter your full name and phone number.");
    }
    setRequestBusy(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setRequestMessage("Please sign in to request hotel availability.");
        return;
      }
      const { data, error: insertError } = await supabase.from("hotel_availability_requests").insert({
        property_id: Number(id),
        customer_user_id: authData.user.id,
        customer_name: customerName.trim(),
        customer_email: authData.user.email || null,
        customer_phone: customerPhone.trim(),
        room_category_id: selectedRoomId,
        room_category: rooms.find(room => room.id === selectedRoomId)?.room_name || "Selected room",
        check_in: checkIn,
        check_out: checkOut,
        rooms_requested: roomsRequested,
        guests,
        customer_note: customerNote.trim() || null,
      }).select("request_ref,status,payment_status,availability_expires_at").single();
      if (insertError) throw insertError;
      setHotelRequestRef(data.request_ref);
      setHotelRequestStatus(String(data.status || "pending_availability"));
      setHotelPaymentStatus(String(data.payment_status || "not_started"));
      setHotelAvailabilityExpiry(String(data.availability_expires_at || ""));
      let notificationWarning = "";
      try {
        const { error: notificationError } = await supabase.functions.invoke(
          "notify-hotel-availability-request",
          { body: { request_ref: data.request_ref } }
        );
        if (notificationError) {
          console.warn("Hotel request saved, but admin email notification failed:", notificationError);
          notificationWarning = " Your request is saved, but our email alert could not be sent. Our team can still review it in the admin dashboard.";
        }
      } catch (notificationError) {
        console.warn("Hotel request saved, but admin email notification failed:", notificationError);
        notificationWarning = " Your request is saved, but our email alert could not be sent. Our team can still review it in the admin dashboard.";
      }
      setRequestSuccess(true);
      setRequestMessage("Availability request submitted. Your reference is " + data.request_ref + ". Source Stays will confirm with the hotel before any payment is requested." + notificationWarning);
    } catch (e) {
      setRequestMessage(e instanceof Error ? e.message : "Unable to submit your request. Please try again.");
    } finally {
      setRequestBusy(false);
    }
  }

  async function submitShortletBooking() {
    setBookingMessage("");
    setBookingSuccess(false);
    if (!supabase || !item) return setBookingMessage("The Source Stays service is not connected.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingCheckIn) || !/^\d{4}-\d{2}-\d{2}$/.test(bookingCheckOut)) {
      return setBookingMessage("Enter check-in and check-out dates as YYYY-MM-DD.");
    }
    const start = Date.parse(bookingCheckIn + "T00:00:00Z");
    const end = Date.parse(bookingCheckOut + "T00:00:00Z");
    const nights = Math.round((end - start) / 86400000);
    if (!Number.isFinite(start) || !Number.isFinite(end) || nights < 1) return setBookingMessage("Check-out must be at least one day after check-in.");
    const guests = Number(bookingGuests);
    if (!Number.isInteger(guests) || guests < 1 || guests > 50) return setBookingMessage("Enter a valid number of guests.");
    if (bookingName.trim().length < 2 || bookingPhone.trim().length < 7) return setBookingMessage("Please enter your full name and phone number.");
    if (!refundPolicyAccepted) return setBookingMessage("Please accept the booking payment policy before submitting.");
    setBookingBusy(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error("Please sign in to your Source Stays account before booking.");
      if (!user.email) throw new Error("Your account needs a valid email address before booking.");
      const { data: available, error: availabilityError } = await supabase.rpc("check_property_availability", {
        p_property_id: Number(id), p_check_in: bookingCheckIn, p_check_out: bookingCheckOut
      });
      if (availabilityError) throw availabilityError;
      if (available !== true) throw new Error("These dates are not available. Please choose other dates.");
      const price = Number(item.price || 0);
      if (price <= 0 && !(item.event_enabled && bookingOption === "event" && Number(item.event_price || 0) > 0)) throw new Error("Please contact Source Stays for this property's current rate.");
      const extraGuest = Math.max(0, guests - 1) * Number(item.extra_guest_fee || 0);
      const cleaning = Number(item.cleaning_fee || 0);
      const service = Number(item.service_fee || 0);
      const other = Number(item.other_fee || 0);
      const caution = Number(item.caution_fee || 0);
      const isEvent = Boolean(item.event_enabled) && bookingOption === "event";
      const eventPrice = Number(item.event_price || 0);
      const eventCaution = Number(item.event_caution_fee || 0);
      const amountDue = isEvent ? eventPrice * nights + eventCaution : price * nights + extraGuest + cleaning + service + other + caution;
      const payload: Record<string, unknown> = {
        customer_user_id: user.id,
        property_id: Number(id),
        customer_name: bookingName.trim(),
        customer_phone: bookingPhone.trim(),
        customer_email: user.email,
        check_in: bookingCheckIn,
        check_out: bookingCheckOut,
        guests,
        message: bookingNote.trim(),
        amount_due: amountDue,
        booking_option: isEvent ? "event" : "accommodation",
        booking_option_label: isEvent ? "Private Indoor Event" : "Accommodation",
        booking_base_price: isEvent ? eventPrice : price,
        booking_caution_fee: isEvent ? eventCaution : caution,
        currency: "NGN",
        payment_status: "unpaid"
      };
      const { data: bookingId, error: bookingError } = await supabase.rpc("create_customer_booking", { p_payload: payload });
      if (bookingError) throw bookingError;
      if (!bookingId) throw new Error("The booking request was not confirmed. Please contact Source Stays.");
      try {
        await supabase.functions.invoke("notify-new-booking", { body: { booking_id: bookingId } });
      } catch (notificationError) {
        console.warn("Booking saved but admin notification could not be sent.", notificationError);
      }
      setBookingSuccess(true);
      setBookingMessage("Your booking request has been received. Reference: " + bookingId + ". Source Stays will confirm availability and the final amount. Once payment is requested, you can pay securely from your customer account. No payment has been taken yet.");
    } catch (e) {
      setBookingMessage(e instanceof Error ? e.message : "Unable to submit your booking request. Please try again.");
    } finally {
      setBookingBusy(false);
    }
  }

  async function submitInspectionRequest() {
    setInspectionMessage("");
    setInspectionSuccess(false);
    if (!supabase || !item) return setInspectionMessage("The Source Stays service is not connected.");
    if (inspectionName.trim().length < 2 || inspectionPhone.trim().length < 7 || !/^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(inspectionEmail.trim())) {
      return setInspectionMessage("Enter your full name, valid email address and phone number.");
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(inspectionDate);
    if (!match) return setInspectionMessage("Choose a valid inspection date in YYYY-MM-DD format.");
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    const selected = new Date(year, month - 1, day);
    if (selected.getFullYear() !== year || selected.getMonth() !== month - 1 || selected.getDate() !== day) return setInspectionMessage("Choose a valid inspection date.");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selected < today) return setInspectionMessage("Inspection date cannot be in the past.");
    if (item.is_zylus_group && selected.getDay() !== 2) return setInspectionMessage("Zylus Group properties are available for inspection on Tuesdays only.");
    setInspectionBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-inspection-request", {
        body: { property_id: Number(id), customer_name: inspectionName.trim(), customer_email: inspectionEmail.trim(), customer_phone: inspectionPhone.trim(), preferred_date: inspectionDate, preferred_time: inspectionTime, message: inspectionNote.trim() }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Could not submit your inspection request.");
      setInspectionSuccess(true);
      setInspectionMessage("Your inspection request has been submitted. Our team will contact you to confirm the preferred date and time.");
      setInspectionNote("");
    } catch (e) {
      setInspectionMessage(e instanceof Error ? e.message : "Unable to submit your inspection request. Please try again.");
    } finally { setInspectionBusy(false); }
  }

  const whatsapp = () => Linking.openURL("https://wa.me/2347085404814?text=" + encodeURIComponent("Hello Source Stays, I am interested in " + title + " (listing " + id + "). Please assist me."));

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Link href="/" style={styles.back}>← Source Stays</Link>
        {loading ? <ActivityIndicator size="large" color="#123D2B" style={{ marginTop: 50 }} /> :
          error ? <Text style={styles.error}>{error}</Text> : item ? <>
            <Text style={styles.category}>{item.category.toUpperCase()}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.location}>⌖  {place}</Text>
            {images.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
              {images.map((uri, i) => <Image key={i} source={{ uri }} style={styles.image} resizeMode="cover" />)}
            </ScrollView> : <View style={styles.noImage}><Text style={styles.noImageText}>SOURCE STAYS</Text></View>}
            {!!item.owner_identity_verified && <Text style={styles.verified}>✓ Source Verified</Text>}
            {!!item.physical_inspection_verified && <Text style={styles.verified}>✓ Physical inspection completed</Text>}
            <Text style={styles.section}>Property details</Text>
            <Text style={styles.details}>{item.amenities || "Contact Source Stays for more information about this property."}</Text>
            {isHotel ? <>
              <Text style={styles.section}>Room categories and rates</Text>
              {rooms.length ? rooms.map(room => <Pressable key={room.id} onPress={() => setSelectedRoomId(room.id)} style={[styles.room, selectedRoomId === room.id && styles.roomSelected]}>
                <View style={styles.roomHeading}><Text style={styles.roomName}>{room.room_name}</Text><Text style={styles.selectText}>{selectedRoomId === room.id ? "SELECTED ✓" : "SELECT"}</Text></View>
                {!!room.description && <Text style={styles.details}>{room.description}</Text>}
                <Text style={styles.rate}>₦{Number(room.customer_rate).toLocaleString("en-NG")} / night</Text>
                {!!room.max_guests && <Text style={styles.location}>Up to {room.max_guests} guests</Text>}
              </Pressable>) : <Text style={styles.details}>Room rates will be provided after availability is confirmed.</Text>}
              <Text style={styles.section}>Request availability</Text>
              <Text style={styles.formHint}>Choose your dates and room requirements. This is an availability request, not a payment.</Text>
              <Text style={styles.label}>Check-in date (YYYY-MM-DD)</Text>
              <TextInput value={checkIn} onChangeText={setCheckIn} placeholder="2026-12-20" style={styles.input} autoCapitalize="none" />
              <Text style={styles.label}>Check-out date (YYYY-MM-DD)</Text>
              <TextInput value={checkOut} onChangeText={setCheckOut} placeholder="2026-12-22" style={styles.input} autoCapitalize="none" />
              <View style={styles.twoFields}>
                <View style={styles.half}><Text style={styles.label}>Rooms</Text><TextInput value={roomCount} onChangeText={setRoomCount} keyboardType="number-pad" style={styles.input} /></View>
                <View style={styles.half}><Text style={styles.label}>Guests</Text><TextInput value={guestCount} onChangeText={setGuestCount} keyboardType="number-pad" style={styles.input} /></View>
              </View>
              <Text style={styles.label}>Your full name</Text>
              <TextInput value={customerName} onChangeText={setCustomerName} placeholder="Full name" style={styles.input} />
              <Text style={styles.label}>Phone number</Text>
              <TextInput value={customerPhone} onChangeText={setCustomerPhone} placeholder="e.g. 08012345678" keyboardType="phone-pad" style={styles.input} />
              <Text style={styles.label}>Additional note (optional)</Text>
              <TextInput value={customerNote} onChangeText={setCustomerNote} placeholder="Any special requirements?" style={[styles.input, styles.noteInput]} multiline />
              <Pressable disabled={requestBusy} onPress={submitHotelAvailability} style={[styles.cta, requestBusy && styles.disabled]}>
                <Text style={styles.ctaText}>{requestBusy ? "Submitting..." : "Request hotel availability"}</Text>
              </Pressable>
              {!!requestMessage && <Text style={[styles.requestMessage, requestSuccess ? styles.success : styles.error]}>{requestMessage}</Text>}
              {!!hotelRequestRef && <View style={styles.requestCard}>
                <Text style={styles.requestCardTitle}>Your hotel request</Text>
                <Text style={styles.requestCardRef}>Reference: {hotelRequestRef}</Text>
                <Text style={styles.requestCardStatus}>Availability: {hotelRequestStatus.replace(/_/g, " ") || "pending"}</Text>
                <Text style={styles.requestCardStatus}>Payment: {hotelPaymentStatus.replace(/_/g, " ")}</Text>
                {!!hotelAvailabilityExpiry && <Text style={styles.notice}>Availability valid until {new Date(hotelAvailabilityExpiry).toLocaleString()}</Text>}
                <Pressable onPress={() => refreshHotelRequest()} style={styles.refreshButton}><Text style={styles.refreshText}>Refresh request status</Text></Pressable>
                {(hotelRequestStatus === "available" || hotelRequestStatus === "awaiting_payment") && hotelPaymentStatus !== "paid" && !!hotelAvailabilityExpiry && new Date(hotelAvailabilityExpiry).getTime() > Date.now() &&
                  <Pressable disabled={hotelPaymentBusy} onPress={startHotelPayment} style={[styles.cta, hotelPaymentBusy && styles.disabled]}><Text style={styles.ctaText}>{hotelPaymentBusy ? "Preparing secure payment..." : "Pay securely with Paystack"}</Text></Pressable>}
                {hotelPaymentStatus === "paid" && <Text style={styles.success}>Payment received. Your hotel reservation is awaiting final confirmation.</Text>}
              </View>}
              <Text style={styles.notice}>Source Stays will contact the hotel first. Payment is only arranged after availability is confirmed. Hotel identity remains protected until reservation confirmation.</Text>
            </> : isShortlet ? <>
              {Number(item.price) > 0 && <Text style={styles.rate}>₦{Number(item.price).toLocaleString("en-NG")} / {item.price_period || "night"}</Text>}

              {villaPackages.length > 0 && <View style={styles.villaPanel}>
                <Text style={styles.section}>Choose Your Villa Getaway</Text>
                <Text style={styles.formHint}>These packages reserve the entire villa, including its bedrooms. Choose a package to view the weekday and weekend rates.</Text>
                {villaPackages.map(pkg => <Pressable key={String(pkg.id)} onPress={() => setSelectedVillaPackageId(String(pkg.id))} style={[styles.room, selectedVillaPackageId === String(pkg.id) && styles.roomSelected]}>
                  <View style={styles.roomHeading}>
                    <Text style={styles.roomName}>{pkg.package_name}</Text>
                    <Text style={styles.selectText}>{selectedVillaPackageId === String(pkg.id) ? "SELECTED ✓" : "SELECT"}</Text>
                  </View>
                  <Text style={styles.details}>{pkg.package_type === "day_getaway" ? "Day getaway" : "Overnight getaway"} · Up to {pkg.max_guests} guests</Text>
                  {!!pkg.description && <Text style={styles.details}>{pkg.description}</Text>}
                  <Text style={styles.rate}>Weekday {money(Number(pkg.weekday_customer_rate || 0))} · Weekend {money(Number(pkg.weekend_customer_rate || 0))}</Text>
                  <Text style={styles.details}>{pkg.boat_included ? (pkg.boat_description || "Includes one 15-seater boat for a round trip.") : (pkg.boat_description || "Boat not included.")}</Text>
                  {!!(pkg.start_time || pkg.end_time) && <Text style={styles.location}>Access: {pkg.start_time || "—"}{pkg.end_time ? " – " + pkg.end_time : ""}</Text>}
                </Pressable>)}
                {!!selectedVillaPackage && <>
                  <Text style={styles.label}>Preferred {selectedVillaPackage.package_type === "day_getaway" ? "date" : "check-in date"} (YYYY-MM-DD)</Text>
                  <TextInput value={villaStartDate} onChangeText={setVillaStartDate} placeholder="2026-12-20" style={styles.input} />
                  {selectedVillaPackage.package_type === "overnight_getaway" && <>
                    <Text style={styles.label}>Check-out date (YYYY-MM-DD)</Text>
                    <TextInput value={villaEndDate} onChangeText={setVillaEndDate} placeholder="2026-12-22" style={styles.input} />
                  </>}
                  <Text style={styles.label}>Number of guests (maximum {selectedVillaPackage.max_guests})</Text>
                  <TextInput value={villaGuests} onChangeText={setVillaGuests} keyboardType="number-pad" style={styles.input} />
                  {villaEstimate > 0 && <View style={styles.breakdownCard}>
                    <Text style={styles.breakdownTitle}>Indicative package estimate</Text>
                    <Text style={styles.breakdownValue}>{money(villaEstimate)}{selectedVillaPackage.package_type === "overnight_getaway" ? " for " + villaNights + " night(s)" : " for the selected day"}</Text>
                    <Text style={styles.breakdownNote}>Based on the package weekday/weekend rates. Final availability and quotation are subject to partner confirmation.</Text>
                  </View>}
                  <Text style={styles.label}>Full name</Text>
                  <TextInput value={villaName} onChangeText={setVillaName} placeholder="Your full name" style={styles.input} maxLength={100} />
                  <Text style={styles.label}>Phone number</Text>
                  <TextInput value={villaPhone} onChangeText={setVillaPhone} placeholder="e.g. 08012345678" keyboardType="phone-pad" style={styles.input} maxLength={30} />
                  <Text style={styles.label}>Email address (optional)</Text>
                  <TextInput value={villaEmail} onChangeText={setVillaEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" style={styles.input} maxLength={254} />
                  <Text style={styles.label}>Additional message (optional)</Text>
                  <TextInput value={villaNote} onChangeText={setVillaNote} placeholder="Tell us about any special requirements" style={[styles.input, styles.noteInput]} multiline maxLength={1000} />
                  <Pressable disabled={villaBusy} onPress={submitVillaRequest} style={[styles.cta, villaBusy && styles.disabled]}><Text style={styles.ctaText}>{villaBusy ? "Submitting..." : "Submit getaway availability request"}</Text></Pressable>
                  {!!villaMessage && <Text style={[styles.requestMessage, villaSuccess ? styles.success : styles.error]}>{villaMessage}</Text>}
                </>}
                <Text style={styles.section}>Special event enquiry</Text>
                <Text style={styles.formHint}>For parties or other special events, send a separate quotation enquiry. This does not create a getaway booking.</Text>
                <Text style={styles.label}>Preferred event date (YYYY-MM-DD)</Text>
                <TextInput value={eventDate} onChangeText={setEventDate} placeholder="2026-12-20" style={styles.input} />
                <Text style={styles.label}>Event requirements</Text>
                <TextInput value={eventDetails} onChangeText={setEventDetails} placeholder="Describe your event, expected guests and requirements" style={[styles.input, styles.noteInput]} multiline maxLength={1000} />
                <Pressable disabled={eventBusy} onPress={submitVillaEventEnquiry} style={[styles.secondaryCta, eventBusy && styles.disabled]}><Text style={styles.secondaryCtaText}>{eventBusy ? "Sending..." : "Send special-event enquiry"}</Text></Pressable>
                {!!eventMessage && <Text style={styles.requestMessage}>{eventMessage}</Text>}
              </View>}
              {item.event_enabled && <>
                <Text style={styles.label}>Booking option</Text>
                <View style={styles.timeOptions}>
                  <Pressable onPress={() => setBookingOption("accommodation")} style={[styles.timeOption, bookingOption === "accommodation" && styles.timeOptionActive]}><Text style={[styles.timeOptionText, bookingOption === "accommodation" && styles.timeOptionTextActive]}>Accommodation</Text></Pressable>
                  <Pressable onPress={() => setBookingOption("event")} style={[styles.timeOption, bookingOption === "event" && styles.timeOptionActive]}><Text style={[styles.timeOptionText, bookingOption === "event" && styles.timeOptionTextActive]}>Private indoor event</Text></Pressable>
                </View>
              </>}
              <Text style={styles.section}>Book this shortlet</Text>
              <Text style={styles.formHint}>Choose your dates and guest count. We will check availability before saving your booking request. Payment is not taken at this stage.</Text>
              <Text style={styles.label}>Check-in date (YYYY-MM-DD)</Text>
              <TextInput value={bookingCheckIn} onChangeText={setBookingCheckIn} placeholder="2026-12-20" style={styles.input} autoCapitalize="none" />
              <Text style={styles.label}>Check-out date (YYYY-MM-DD)</Text>
              <TextInput value={bookingCheckOut} onChangeText={setBookingCheckOut} placeholder="2026-12-22" style={styles.input} autoCapitalize="none" />
              <Text style={styles.label}>Number of guests</Text>
              <TextInput value={bookingGuests} onChangeText={setBookingGuests} keyboardType="number-pad" style={styles.input} />
              <Text style={styles.label}>Your full name</Text>
              <TextInput value={bookingName} onChangeText={setBookingName} placeholder="Full name" style={styles.input} />
              <Text style={styles.label}>Phone number</Text>
              <TextInput value={bookingPhone} onChangeText={setBookingPhone} placeholder="e.g. 08012345678" keyboardType="phone-pad" style={styles.input} />
              <Text style={styles.label}>Special request (optional)</Text>
              <TextInput value={bookingNote} onChangeText={setBookingNote} placeholder="Any special requirements?" style={[styles.input, styles.noteInput]} multiline />
              {bookingNights > 0 && (isEventBooking ? bookingBaseRate > 0 : bookingPrice > 0) && Number.isInteger(bookingGuestNumber) && bookingGuestNumber > 0 && <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>Estimated price breakdown</Text>
                {isEventBooking ? <><View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Private indoor event ({bookingNights} night{bookingNights === 1 ? "" : "s"})</Text><Text style={styles.breakdownValue}>{money(bookingBaseRate)}</Text></View></> : <>
                <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Accommodation ({bookingNights} night{bookingNights === 1 ? "" : "s"})</Text><Text style={styles.breakdownValue}>{money(bookingAccommodation)}</Text></View>
                {bookingCleaning > 0 && <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Cleaning fee</Text><Text style={styles.breakdownValue}>{money(bookingCleaning)}</Text></View>}
                {bookingService > 0 && <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Service fee</Text><Text style={styles.breakdownValue}>{money(bookingService)}</Text></View>}
                {bookingExtraGuest > 0 && <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Additional guest fee ({Math.max(0, bookingGuestNumber - 1)} extra)</Text><Text style={styles.breakdownValue}>{money(bookingExtraGuest)}</Text></View>}
                {bookingOther > 0 && <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Other charge</Text><Text style={styles.breakdownValue}>{money(bookingOther)}</Text></View>}
                </>}
                {bookingCaution > 0 && <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Refundable caution deposit</Text><Text style={styles.breakdownValue}>{money(bookingCaution)}</Text></View>}
                <View style={styles.breakdownTotal}><Text style={styles.breakdownTotalLabel}>Estimated amount due</Text><Text style={styles.breakdownTotalValue}>{money(bookingEstimate)}</Text></View>
                <Text style={styles.breakdownNote}>{isEventBooking ? "Event pricing is charged per night; the caution deposit is charged once. " : ""}This is an estimate based on the listing fees. Source Stays will confirm the final amount before payment.</Text>
              </View>}
              <Pressable onPress={() => setRefundPolicyAccepted(v => !v)} style={styles.policyRow}>
                <View style={[styles.policyCheck, refundPolicyAccepted && styles.policyCheckOn]}><Text style={styles.policyCheckText}>{refundPolicyAccepted ? "✓" : ""}</Text></View>
                <Text style={styles.policyText}>I have read and agree to the Source Stays booking payment policy. Payments are non-refundable once a booking is confirmed and payment has been received.</Text>
              </Pressable>
              <Pressable disabled={bookingBusy} onPress={submitShortletBooking} style={[styles.cta, bookingBusy && styles.disabled]}><Text style={styles.ctaText}>{bookingBusy ? "Submitting..." : "Check availability & book"}</Text></Pressable>
              {!!bookingMessage && <Text style={[styles.requestMessage, bookingSuccess ? styles.success : styles.error]}>{bookingMessage}</Text>}
              <Text style={styles.notice}>Your request will be linked to your customer account. Source Stays will confirm availability and the final amount. When payment is requested, return to your account to pay securely with Paystack.</Text>
            </> : <>
              {Number(item.price) > 0 && <Text style={styles.rate}>₦{Number(item.price).toLocaleString("en-NG")} / {item.price_period || "night"}</Text>}
              {isRealEstate ? <>
                <Text style={styles.section}>Request a property inspection</Text>
                <Text style={styles.formHint}>Choose your preferred inspection date and time. Our team will contact you to confirm the appointment.</Text>
                <Text style={styles.label}>Full name</Text>
                <TextInput value={inspectionName} onChangeText={setInspectionName} placeholder="Your full name" style={styles.input} />
                <Text style={styles.label}>Email address</Text>
                <TextInput value={inspectionEmail} onChangeText={setInspectionEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                <Text style={styles.label}>Phone number</Text>
                <TextInput value={inspectionPhone} onChangeText={setInspectionPhone} placeholder="e.g. 08012345678" keyboardType="phone-pad" style={styles.input} />
                <Text style={styles.label}>Preferred inspection date (YYYY-MM-DD)</Text>
                <TextInput value={inspectionDate} onChangeText={setInspectionDate} placeholder="2026-12-01" style={styles.input} />
                {item.is_zylus_group && <Text style={styles.notice}>Zylus Group properties are available for inspection on Tuesdays only.</Text>}
                <Text style={styles.label}>Preferred time</Text>
                <View style={styles.timeOptions}>{["9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"].map(time => <Pressable key={time} onPress={() => setInspectionTime(time)} style={[styles.timeOption, inspectionTime === time && styles.timeOptionActive]}><Text style={[styles.timeOptionText, inspectionTime === time && styles.timeOptionTextActive]}>{time}</Text></Pressable>)}</View>
                <Text style={styles.label}>Additional message (optional)</Text>
                <TextInput value={inspectionNote} onChangeText={setInspectionNote} placeholder="Any additional information?" style={[styles.input, styles.noteInput]} multiline maxLength={1000} />
                <Pressable disabled={inspectionBusy} onPress={submitInspectionRequest} style={[styles.cta, inspectionBusy && styles.disabled]}><Text style={styles.ctaText}>{inspectionBusy ? "Submitting..." : "Submit inspection request"}</Text></Pressable>
                {!!inspectionMessage && <Text style={[styles.requestMessage, inspectionSuccess ? styles.success : styles.error]}>{inspectionMessage}</Text>}
              </> : <>
                <Text style={styles.notice}>Contact our team to confirm details, availability and next steps.</Text>
                <Pressable onPress={whatsapp} style={styles.cta}><Text style={styles.ctaText}>Enquire with Source Stays  →</Text></Pressable>
              </>}
            </>}
          </> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F7F2" }, content: { padding: 20, paddingBottom: 45 },
  back: { color: "#123D2B", fontWeight: "700", marginBottom: 23 }, category: { fontSize: 10, color: "#A77D31", fontWeight: "900", letterSpacing: 1.5 },
  title: { fontSize: 27, lineHeight: 34, fontWeight: "900", color: "#123D2B", marginTop: 7 }, location: { fontSize: 12, color: "#747B73", marginTop: 8 },
  gallery: { marginTop: 20 }, image: { width: 300, height: 220, borderRadius: 15, marginRight: 10, backgroundColor: "#E9ECE5" },
  noImage: { height: 180, backgroundColor: "#E9ECE5", borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 20 },
  noImageText: { color: "#A77D31", fontWeight: "900", letterSpacing: 2 }, verified: { fontSize: 11, color: "#247343", fontWeight: "700", marginTop: 8 },
  section: { fontSize: 18, fontWeight: "900", color: "#173E2D", marginTop: 25, marginBottom: 10 }, details: { fontSize: 13, color: "#59645B", lineHeight: 21 },
  rate: { fontSize: 17, fontWeight: "900", color: "#173E2D", marginTop: 12 }, room: { backgroundColor: "#fff", padding: 15, borderRadius: 13, marginTop: 10, borderWidth: 1, borderColor: "#E7E8E0" },
  roomSelected: { borderColor: "#A77D31", borderWidth: 2 }, roomHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  roomName: { fontSize: 15, fontWeight: "800", color: "#173E2D" }, selectText: { fontSize: 9, color: "#A77D31", fontWeight: "900" },
  formHint: { fontSize: 12, color: "#687269", lineHeight: 19, marginBottom: 12 }, label: { color: "#173E2D", fontSize: 12, fontWeight: "700", marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E4DC", borderRadius: 11, padding: 13, color: "#173E2D", fontSize: 14 },
  twoFields: { flexDirection: "row", gap: 12 }, half: { flex: 1 },
  timeOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 5 },
  timeOption: { borderWidth: 1, borderColor: "#DADDD4", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff" },
  timeOptionActive: { backgroundColor: "#123D2B", borderColor: "#123D2B" },
  timeOptionText: { color: "#526057", fontSize: 11, fontWeight: "700" },
  timeOptionTextActive: { color: "#fff" }, noteInput: { minHeight: 78, textAlignVertical: "top" },
  cta: { backgroundColor: "#123D2B", padding: 16, borderRadius: 12, marginTop: 18, alignItems: "center" }, ctaText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  requestCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E4DC", borderRadius: 13, padding: 15, marginTop: 18 },
  requestCardTitle: { color: "#173E2D", fontSize: 15, fontWeight: "900" },
  requestCardRef: { color: "#A77D31", fontSize: 12, fontWeight: "800", marginTop: 8 },
  requestCardStatus: { color: "#566157", fontSize: 12, marginTop: 6, textTransform: "capitalize" },
  refreshButton: { alignSelf: "flex-start", paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#F1F3EE", marginTop: 10 },
  refreshText: { color: "#173E2D", fontWeight: "800", fontSize: 11 },
  policyRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 18 },
  policyCheck: { width: 22, height: 22, borderWidth: 1, borderColor: "#AEB8AE", borderRadius: 5, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  policyCheckOn: { backgroundColor: "#123D2B", borderColor: "#123D2B" },
  policyCheckText: { color: "#fff", fontWeight: "900" },
  policyText: { flex: 1, fontSize: 11, color: "#566157", lineHeight: 17 },
  breakdownCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E3E6DD", borderRadius: 13, padding: 15, marginTop: 18 },
  breakdownTitle: { color: "#173E2D", fontSize: 15, fontWeight: "900", marginBottom: 10 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 6 },
  breakdownLabel: { flex: 1, color: "#5D685F", fontSize: 12 },
  breakdownValue: { color: "#173E2D", fontSize: 12, fontWeight: "700" },
  breakdownTotal: { borderTopWidth: 1, borderTopColor: "#E5E8E0", marginTop: 8, paddingTop: 12, flexDirection: "row", justifyContent: "space-between", gap: 12 },
  breakdownTotalLabel: { color: "#173E2D", fontSize: 13, fontWeight: "900", flex: 1 },
  breakdownTotalValue: { color: "#123D2B", fontSize: 16, fontWeight: "900" },
  breakdownNote: { color: "#777F76", fontSize: 10, lineHeight: 15, marginTop: 9 },
  villaPanel: { marginTop: 8 }, secondaryCta: { borderWidth: 1, borderColor: "#A77D31", padding: 15, borderRadius: 12, marginTop: 12, alignItems: "center" }, secondaryCtaText: { color: "#173E2D", fontWeight: "800", fontSize: 13 },
  disabled: { opacity: 0.6 }, requestMessage: { fontSize: 12, lineHeight: 19, marginTop: 12 }, success: { color: "#247343" },
  notice: { fontSize: 11, color: "#777D76", lineHeight: 17, marginTop: 18 }, error: { color: "#9B3025", textAlign: "center", marginTop: 40 },
});
