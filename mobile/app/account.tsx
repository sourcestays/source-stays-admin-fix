import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { SectionIcon } from "@/src/components/SectionIcon";

type Booking = {
  id: number | string;
  property_id?: number | null;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  status: string | null;
  payment_status: string | null;
  payment_request_status?: string | null;
  amount_due: number | null;
  currency: string | null;
  created_at: string;
};
type HotelRequest = {
  id: string;
  request_ref: string;
  room_category: string | null;
  check_in: string | null;
  check_out: string | null;
  rooms_requested: number | null;
  guests: number | null;
  status: string | null;
  payment_status: string | null;
  hotel_reservation_confirmed_at: string | null;
  hotel_identity_released_at: string | null;
  created_at: string;
};
type HotelDetails = { hotel_name?: string; hotel_address?: string; hotel_phone?: string };
type EligibleRedemption = { value: string; label: string };
type RedemptionRequest = { id: string | number; booking_id?: number | null; request_id?: string | null; amount: number; status: string; customer_note: string | null; created_at: string; kind: "shortlet" | "hotel" };

const pretty = (value: string | null | undefined) => (value || "Pending").replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
const money = (value: number | null, currency: string | null) => value == null ? "Amount to be confirmed" : `${currency || "NGN"} ${Number(value).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

export default function AccountScreen() {
  const { colors, isDark } = useAppTheme();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotels, setHotels] = useState<HotelRequest[]>([]);
  const [propertyNames, setPropertyNames] = useState<Record<string, string>>({});
  const [hotelDetails, setHotelDetails] = useState<Record<string, HotelDetails>>({});
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [paymentBusyId, setPaymentBusyId] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [eligibleRedemptions, setEligibleRedemptions] = useState<EligibleRedemption[]>([]);
  const [redemptionRequests, setRedemptionRequests] = useState<RedemptionRequest[]>([]);
  const [selectedRedemption, setSelectedRedemption] = useState("");
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [redemptionNote, setRedemptionNote] = useState("");
  const [redemptionBusy, setRedemptionBusy] = useState(false);
  const [redemptionMessage, setRedemptionMessage] = useState("");

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage("Unable to restore your session. Please sign in again.");
      setUser(data.session?.user ?? null);
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const loadDashboard = useCallback(async (userId: string) => {
    if (!supabase) return;
    setDashboardLoading(true);
    setDashboardError("");
    try {
    const [bookingResult, hotelResult] = await Promise.all([
      supabase.from("bookings")
        .select("id, property_id, check_in, check_out, guests, status, payment_status, payment_request_status, amount_due, currency, created_at")
        .eq("customer_user_id", userId).order("created_at", { ascending: false }),
      supabase.from("hotel_availability_requests")
        .select("id, request_ref, room_category, check_in, check_out, rooms_requested, guests, status, payment_status, hotel_reservation_confirmed_at, hotel_identity_released_at, created_at")
        .eq("customer_user_id", userId).order("created_at", { ascending: false })
    ]);
    if (bookingResult.error) setDashboardError("Some shortlet booking details could not be loaded.");
    else setBookings((bookingResult.data || []) as Booking[]);
    if (hotelResult.error) setDashboardError(current => current ? current + " Hotel requests could not be loaded." : "Hotel requests could not be loaded.");
    else setHotels((hotelResult.data || []) as HotelRequest[]);

    const ids = [...new Set((bookingResult.data || []).map(row => row.property_id).filter((id): id is number => typeof id === "number"))];
    if (ids.length) {
      const { data } = await supabase.from("properties").select("id,title,public_title,hide_partner_identity").in("id", ids);
      if (data) {
        const names: Record<string, string> = {};
        data.forEach((property: any) => {
          names[String(property.id)] = property.hide_partner_identity ? (property.public_title || "Private stay") : property.title;
        });
        setPropertyNames(names);
      }
    }

    const confirmed = (hotelResult.data || []).filter((request: any) =>
      request.payment_status === "paid" && request.hotel_reservation_confirmed_at && request.hotel_identity_released_at
    );
    const detailPairs = await Promise.all(confirmed.map(async (request: any) => {
      const { data, error } = await supabase!.functions.invoke("get-confirmed-hotel-details", {
        body: { request_ref: request.request_ref }
      });
      if (error || !data?.confirmed) return [request.request_ref, {}] as const;
      return [request.request_ref, data as HotelDetails] as const;
    }));
    setHotelDetails(Object.fromEntries(detailPairs));
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Your account dashboard could not be refreshed.");
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const loadRedemptionData = useCallback(async (userId: string) => {
    if (!supabase) return;
    const [bookingResult, redemptionResult, hotelResult, hotelRedemptionResult] = await Promise.all([
      supabase.from("bookings").select("id,check_in,check_out,amount_due,status,payment_status,created_at")
        .eq("customer_user_id", userId).in("status", ["pending", "approved", "confirmed"])
        .eq("payment_status", "unpaid").gt("amount_due", 0).order("created_at", { ascending: false }),
      supabase.from("source_stays_credit_redemptions").select("id,booking_id,amount,status,customer_note,created_at")
        .eq("customer_user_id", userId).in("status", ["pending", "approved"]),
      supabase.from("hotel_availability_requests").select("id,request_ref,room_category,check_in,check_out,rooms_requested,status,payment_status,availability_expires_at,room_category_id,property_id")
        .eq("customer_user_id", userId).in("status", ["available", "awaiting_payment"])
        .in("payment_status", ["not_started", "failed"]).order("created_at", { ascending: false }),
      supabase.from("hotel_source_stays_credit_redemptions").select("id,request_id,amount,status,customer_note,created_at")
        .eq("customer_user_id", userId).in("status", ["pending", "approved"])
    ]);
    if ([bookingResult.error, redemptionResult.error, hotelResult.error, hotelRedemptionResult.error].some(Boolean)) {
      setRedemptionMessage("Eligible reservations or redemption history could not be loaded. Please refresh.");
      return;
    }
    const usedBookingIds = new Set((redemptionResult.data || []).map(row => String(row.booking_id)));
    const usedHotelIds = new Set((hotelRedemptionResult.data || []).map(row => String(row.request_id)));
    const options: EligibleRedemption[] = [];
    (bookingResult.data || []).filter(row => !usedBookingIds.has(String(row.id))).forEach(row => {
      options.push({ value: "booking:" + row.id, label: "Shortlet booking #" + row.id +
        (row.check_in && row.check_out ? " (" + row.check_in + " to " + row.check_out + ")" : "") +
        " — ₦" + Number(row.amount_due).toLocaleString("en-NG") });
    });
    (hotelResult.data || []).filter(row => !usedHotelIds.has(String(row.id)) &&
      row.availability_expires_at && new Date(row.availability_expires_at).getTime() > Date.now()
    ).forEach(row => {
      options.push({ value: "hotel:" + row.id, label: "Hotel " + row.request_ref + " — " +
        (row.room_category || "Room") + " (" + row.check_in + " to " + row.check_out + ")" });
    });
    setEligibleRedemptions(options);
    const shortletRows: RedemptionRequest[] = (redemptionResult.data || []).map((row: any) => ({ ...row, kind: "shortlet" }));
    const hotelRows: RedemptionRequest[] = (hotelRedemptionResult.data || []).map((row: any) => ({ ...row, kind: "hotel" }));
    setRedemptionRequests([...shortletRows, ...hotelRows].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  }, []);

  async function payShortletBooking(booking: Booking) {
    if (!supabase) return;
    setPaymentMessage("");
    setPaymentBusyId(String(booking.id));
    try {
      const { data, error } = await supabase.functions.invoke("initialize-shortlet-payment", {
        body: { booking_id: Number(booking.id), callback_url: "https://sourcestays.com.ng/confirmation.html" }
      });
      if (error) {
        let detail = data?.error || error.message;
        try { const response = (error as any).context; if (response?.json) { const body = await response.json(); detail = body?.error || detail; } } catch {}
        throw new Error(detail || "Could not start Paystack checkout.");
      }
      if (!data?.success || !data?.authorization_url) throw new Error(data?.error || "Paystack checkout is unavailable.");
      await Linking.openURL(data.authorization_url);
    } catch (e) {
      setPaymentMessage(e instanceof Error ? e.message : "Unable to open Paystack checkout.");
    } finally { setPaymentBusyId(null); }
  }

  async function verifyShortletPayment(booking: Booking) {
    if (!supabase) return;
    setPaymentMessage("");
    setPaymentBusyId(String(booking.id));
    try {
      const { data, error } = await supabase.functions.invoke("verify-shortlet-payment", {
        body: { booking_id: Number(booking.id) }
      });
      if (error) {
        let detail = data?.error || error.message;
        try { const response = (error as any).context; if (response?.json) { const body = await response.json(); detail = body?.error || detail; } } catch {}
        throw new Error(detail || "Could not verify payment.");
      }
      if (data?.paid) {
        setPaymentMessage("Payment confirmed successfully. Your booking payment status is now updated.");
        if (user?.id) await loadDashboard(user.id);
      } else {
        setPaymentMessage("Paystack has not confirmed a successful payment yet. If you have just paid, wait briefly and check again.");
      }
    } catch (e) {
      setPaymentMessage(e instanceof Error ? e.message : "Unable to verify payment right now.");
    } finally { setPaymentBusyId(null); }
  }

  async function submitRedemption() {
    setRedemptionMessage("");
    const amount = Number(redemptionAmount);
    if (!selectedRedemption) { setRedemptionMessage("Choose an eligible booking or hotel reservation."); return; }
    if (!Number.isFinite(amount) || amount < 2000 || Math.round(amount * 100) !== amount * 100) {
      setRedemptionMessage("The minimum credit redemption is ₦2,000. Enter a valid amount to two decimal places."); return;
    }
    if (!supabase) { setRedemptionMessage("Rewards services are unavailable right now."); return; }
    setRedemptionBusy(true);
    try {
      const result = selectedRedemption.startsWith("hotel:")
        ? await supabase.rpc("request_hotel_source_stays_credit_redemption", {
            p_request_id: selectedRedemption.slice(6), p_amount: amount, p_customer_note: redemptionNote.trim()
          })
        : await supabase.rpc("request_source_stays_credit_redemption", {
            p_booking_id: Number(selectedRedemption.slice(8)), p_amount: amount, p_customer_note: redemptionNote.trim()
          });
      if (result.error) throw result.error;
      setRedemptionMessage("Your redemption request has been submitted and is awaiting administrator review.");
      setSelectedRedemption(""); setRedemptionAmount(""); setRedemptionNote("");
      if (user?.id) await loadRedemptionData(user.id);
    } catch (error) {
      setRedemptionMessage(error instanceof Error ? error.message : "Could not submit your redemption request.");
    } finally { setRedemptionBusy(false); }
  }

  useEffect(() => {
    if (user?.id) { loadDashboard(user.id); loadRedemptionData(user.id); }
    else { setBookings([]); setHotels([]); setPropertyNames({}); setHotelDetails({}); setEligibleRedemptions([]); setRedemptionRequests([]); }
  }, [user?.id, loadDashboard, loadRedemptionData]);

  async function submit() {
    setMessage(""); setSuccess(false);
    if (!supabase) { setMessage("The app is not connected to Source Stays services yet."); return; }
    if (!email.trim() || !password) { setMessage("Enter your email address and password."); return; }
    if (mode === "signup" && (name.trim().length < 2 || phone.trim().length < 7)) { setMessage("Enter your full name and a valid mobile number."); return; }
    if (mode === "signup" && password.length < 8) { setMessage("Use a password with at least 8 characters."); return; }
    if (mode === "signup" && password !== confirm) { setMessage("Your passwords do not match."); return; }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setPassword("");
        return;
      }
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim(), phone: phone.trim() } } });
      if (error) throw error;
      if (data.session && data.user) {
        const { error: profileError } = await supabase.from("customer_profiles").upsert({ id: data.user.id, full_name: name.trim(), phone: phone.trim() });
        if (profileError) throw new Error("Your account was created, but the customer profile could not be saved. Please contact Source Stays support.");
      }
      setMessage(data.session ? "Your account and customer profile have been created." : "Registration received. Please confirm your email using the link we sent you.");
      setSuccess(true); setMode("login"); setPassword(""); setConfirm("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to complete your request. Please try again.");
    } finally { setBusy(false); }
  }

  async function reset() {
    if (!supabase || !email.trim()) { setMessage("Enter your email address first."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setMessage("If an account exists for this email, a password reset link has been sent."); setSuccess(true);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Unable to send the reset link."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) setMessage(error.message);
    else { setMessage("You have signed out."); router.replace("/"); }
  }

  return <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <ScrollView contentContainerStyle={s.content}>
      <Link href="/" style={s.back}>← Source Stays</Link>
      {checking ? <ActivityIndicator color="#123D2B" style={{ marginTop: 50 }} /> : user ? <>
        <View style={[s.hero, { backgroundColor: colors.hero }]}>
          <Text style={s.brand}>SOURCE <Text style={{ color: "#D6B66E" }}>STAYS</Text></Text>
          <Text style={s.head}>Welcome{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.</Text>
          <Text style={s.copy}>{user.email || "Your Source Stays account"}</Text>
          <View style={s.heroActions}>
            <Link href="/rewards" asChild><Pressable style={s.goldButton}><Text style={s.goldButtonText}>View my Credits</Text></Pressable></Link>
            <Link href="/verify" asChild><Pressable style={s.outlineButton}><Text style={s.outlineText}>Guest verification</Text></Pressable></Link>
            <Pressable onPress={signOut} disabled={busy} style={s.outlineButton}><Text style={s.outlineText}>{busy ? "Please wait…" : "Sign out"}</Text></Pressable>
          </View>
        </View>
        <View style={[s.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>My Profile</Text>
          <Text style={s.profileLabel}>FULL NAME</Text>
          <Text style={s.profileValue}>{user.user_metadata?.full_name || "Not provided"}</Text>
          <Text style={s.profileLabel}>EMAIL ADDRESS</Text>
          <Text style={s.profileValue}>{user.email || "Not available"}</Text>
          <Text style={s.profileLabel}>PHONE NUMBER</Text>
          <Text style={s.profileValue}>{user.user_metadata?.phone || "Not provided"}</Text>
        </View>
        <View style={s.sectionHead}><Text style={s.sectionTitle}>My bookings</Text><Pressable onPress={() => loadDashboard(user.id)}><Text style={s.refresh}>Refresh</Text></Pressable></View>
        {dashboardLoading ? <ActivityIndicator color="#123D2B" style={{ marginVertical: 24 }} /> : <>
          {!!dashboardError && <Text style={s.warning}>{dashboardError}</Text>}{!!paymentMessage && <Text style={s.message}>{paymentMessage}</Text>}
          <Text style={[s.subhead, { color: colors.text }]}>Shortlet bookings</Text>
          {bookings.length ? bookings.map((booking) => <View key={String(booking.id)} style={s.card}>
            <Text style={[s.cardTitle, { color: colors.text }]}>{propertyNames[String(booking.property_id)] || `Booking #${booking.id}`}</Text>
            <Text style={[s.meta, { color: colors.muted }]}>Reference: {booking.id}</Text>
            <Text style={s.meta}>Check-in: {booking.check_in || "—"}  ·  Check-out: {booking.check_out || "—"}</Text>
            <Text style={s.meta}>Guests: {booking.guests ?? "—"}</Text>
            <View style={s.statusRow}><Text style={s.meta}>Booking: {pretty(booking.status)}</Text><Text style={s.meta}>Payment: {pretty(booking.payment_status)}</Text></View>
            <Text style={s.amount}>{money(booking.amount_due, booking.currency)}</Text>
            {booking.payment_status !== "paid" && booking.payment_request_status === "requested" ? <>
              <Pressable disabled={paymentBusyId === String(booking.id)} onPress={() => payShortletBooking(booking)} style={[s.button, paymentBusyId === String(booking.id) && { opacity: .6 }]}>
                {paymentBusyId === String(booking.id) ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Pay securely with Paystack</Text>}
              </Pressable>
              <Pressable disabled={paymentBusyId === String(booking.id)} onPress={() => verifyShortletPayment(booking)} style={s.verifyPayButton}>
                <Text style={s.verifyPayText}>I have paid — verify payment</Text>
              </Pressable>
            </> : booking.payment_status !== "paid" ? <Text style={s.meta}>Payment will be available here once Source Stays confirms your booking and requests payment.</Text> : null}
          </View>) : <Text style={[s.empty, { color: colors.muted, backgroundColor: colors.surfaceAlt }]}>No shortlet bookings are linked to your account yet.</Text>}

          <Text style={[s.subhead, { marginTop: 22 }]}>Hotel reservations</Text>
          {hotels.length ? hotels.map((request) => {
            const confirmed = request.payment_status === "paid" && !!request.hotel_reservation_confirmed_at && !!request.hotel_identity_released_at;
            const details = hotelDetails[request.request_ref];
            return <View key={request.id} style={s.card}>
              <Text style={s.cardTitle}>Hotel request · {request.request_ref}</Text>
              <Text style={s.meta}>Room: {request.room_category || "Hotel room"}</Text>
              <Text style={s.meta}>Check-in: {request.check_in || "—"}  ·  Check-out: {request.check_out || "—"}</Text>
              <Text style={s.meta}>Rooms: {request.rooms_requested ?? 1}  ·  Guests: {request.guests ?? "—"}</Text>
              <View style={s.statusRow}><Text style={s.meta}>Request: {pretty(request.status)}</Text><Text style={s.meta}>Payment: {pretty(request.payment_status)}</Text></View>
              <Text style={[s.confirm, !confirmed && s.pending]}>{confirmed ? "Reservation confirmed" : "Awaiting final hotel confirmation"}</Text>
              {confirmed && details ? <View style={s.hotelDetails}>
                <Text style={s.detailTitle}>{details.hotel_name || "Confirmed hotel"}</Text>
                {!!details.hotel_address && <Text style={s.meta}>Address: {details.hotel_address}</Text>}
                {!!details.hotel_phone && <Text style={s.meta}>Phone: {details.hotel_phone}</Text>}
              </View> : confirmed ? <Text style={s.meta}>Your reservation is confirmed. Please refer to your confirmation email for the hotel details.</Text> : <Text style={s.meta}>Hotel identity is kept private until payment and reservation confirmation are complete.</Text>}
            </View>;
          }) : <Text style={s.empty}>No hotel requests are linked to your account yet.</Text>}
        </>}
        <View style={[s.redemptionPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={s.sectionTitle}>Redeem Source Stays Credits</Text>
          <Text style={s.redemptionHint}>Use eligible credits toward an unpaid shortlet booking or an available hotel reservation. Minimum request: ₦2,000. All requests require administrator approval.</Text>
          <Text style={[s.label, { color: colors.gold }]}>Eligible booking or hotel reservation</Text>
          {eligibleRedemptions.map(option => <Pressable key={option.value} onPress={() => setSelectedRedemption(option.value)} style={[s.eligibleOption, selectedRedemption === option.value && s.eligibleOptionActive]}>
            <Text style={[s.eligibleOptionText, selectedRedemption === option.value && s.eligibleOptionTextActive]}>{option.label}</Text>
          </Pressable>)}
          {!eligibleRedemptions.length && <Text style={s.empty}>No eligible unpaid reservations are currently available.</Text>}
          <Text style={s.label}>Amount to redeem (₦)</Text>
          <TextInput value={redemptionAmount} onChangeText={setRedemptionAmount} keyboardType="decimal-pad" placeholder="Minimum ₦2,000" style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]} />
          <Text style={s.label}>Note (optional)</Text>
          <TextInput value={redemptionNote} onChangeText={setRedemptionNote} maxLength={300} placeholder="Add a note for our team" style={s.input} />
          <Pressable disabled={redemptionBusy || !eligibleRedemptions.length} onPress={submitRedemption} style={[s.button, (redemptionBusy || !eligibleRedemptions.length) && { opacity: .6 }]}>
            {redemptionBusy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Submit redemption request</Text>}
          </Pressable>
          {!!redemptionMessage && <Text style={s.message}>{redemptionMessage}</Text>}
        </View>
        <View style={s.redemptionPanel}>
          <Text style={s.sectionTitle}>My Redemption Requests</Text>
          {redemptionRequests.length ? redemptionRequests.map(request => <View key={request.kind + "-" + request.id} style={s.redemptionRow}>
            <Text style={s.cardTitle}>{request.kind === "hotel" ? "Hotel reservation" : "Shortlet booking"} redemption</Text>
            <Text style={s.meta}>Amount: ₦{Number(request.amount).toLocaleString("en-NG")} · Status: {pretty(request.status)}</Text>
            {!!request.customer_note && <Text style={s.meta}>Note: {request.customer_note}</Text>}
            <Text style={s.meta}>{new Date(request.created_at).toLocaleDateString("en-NG")}</Text>
          </View>) : <Text style={s.empty}>You have not submitted any redemption requests yet.</Text>}
        </View>
        <Link href="/division/realestate" style={s.realEstate}>Explore real estate opportunities →</Link>
      </> : <>
        <View style={s.hero}>
          <Text style={s.brand}>SOURCE <Text style={{ color: "#D6B66E" }}>STAYS</Text></Text>
          <Text style={s.head}>Your stay. Your rewards.</Text>
          <Text style={s.copy}>Sign in or create an account to manage your bookings, hotel reservations and Source Stays Credits.</Text>
        </View>
        <View style={[s.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.tabs}>
            <Pressable onPress={() => { setMode("login"); setMessage(""); }} style={[s.tab, mode === "login" && s.tabActive]}><Text style={[s.tabText, mode === "login" && s.tabTextActive]}>Log in</Text></Pressable>
            <Pressable onPress={() => { setMode("signup"); setMessage(""); }} style={[s.tab, mode === "signup" && s.tabActive]}><Text style={[s.tabText, mode === "signup" && s.tabTextActive]}>Sign up</Text></Pressable>
          </View>
          <Text style={[s.title, { color: colors.text }]}>{mode === "login" ? "Welcome back" : "Create your account"}</Text>
          {mode === "signup" && <>
            <Text style={s.label}>Full name</Text><TextInput value={name} onChangeText={setName} autoComplete="name" style={s.input} placeholder="Your full name" />
            <Text style={s.label}>Mobile number</Text><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" style={s.input} placeholder="+234..." />
          </>}
          <Text style={s.label}>Email address</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={s.input} placeholder="you@example.com" />
          <Text style={s.label}>Password</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === "login" ? "current-password" : "new-password"} style={s.input} placeholder="At least 8 characters" />
          {mode === "signup" && <><Text style={s.label}>Confirm password</Text><TextInput value={confirm} onChangeText={setConfirm} secureTextEntry style={s.input} placeholder="Re-enter password" /></>}
          {mode === "login" && <Pressable onPress={reset} style={s.reset}><Text style={s.resetText}>Forgot password?</Text></Pressable>}
          <Pressable disabled={busy} onPress={submit} style={[s.button, busy && { opacity: .65 }]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>{mode === "login" ? "Log in" : "Create my account"}</Text>}</Pressable>
          {!!message && <Text style={[s.message, success && s.success]}>{message}</Text>}
        </View>
      </>}
      <Text style={s.foot}>SOURCE STAYS  ·  LAGOS, NIGERIA</Text>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: 20, paddingBottom: 42 },
  back: { color: "#123D2B", fontWeight: "700", marginBottom: 20 },
  hero: { backgroundColor: "#123D2B", borderRadius: 18, padding: 22, marginBottom: 18 },
  brand: { color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 1.2 },
  head: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 19 },
  copy: { color: "#E0E8E1", fontSize: 12, lineHeight: 19, marginTop: 7 },
  heroActions: { flexDirection: "row", gap: 9, marginTop: 18, flexWrap: "wrap" },
  goldButton: { backgroundColor: "#D6B66E", paddingHorizontal: 15, paddingVertical: 11, borderRadius: 9 },
  goldButtonText: { color: "#173E2D", fontSize: 11, fontWeight: "900" },
  outlineButton: { borderWidth: 1, borderColor: "#D6B66E", paddingHorizontal: 15, paddingVertical: 10, borderRadius: 9 },
  outlineText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  redemptionPanel: { backgroundColor: "#fff", borderRadius: 13, padding: 16, borderWidth: 1, borderColor: "#E9E8E0", marginTop: 18 },
  redemptionHint: { color: "#69736B", fontSize: 11, lineHeight: 18, marginTop: 7, marginBottom: 12 },
  eligibleOption: { borderWidth: 1, borderColor: "#E2E5DC", borderRadius: 9, padding: 11, marginBottom: 8 },
  eligibleOptionActive: { backgroundColor: "#123D2B", borderColor: "#123D2B" },
  eligibleOptionText: { color: "#173E2D", fontSize: 11, lineHeight: 17 },
  eligibleOptionTextActive: { color: "#fff" },
  redemptionRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E9E8E0", gap: 4 },
  profileCard: { backgroundColor: "#fff", borderRadius: 13, padding: 16, borderWidth: 1, borderColor: "#E9E8E0", marginBottom: 18 },
  profileLabel: { color: "#A77D31", fontSize: 9, fontWeight: "900", letterSpacing: 1, marginTop: 13 },
  profileValue: { color: "#173E2D", fontSize: 13, fontWeight: "700", marginTop: 4 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 9, marginBottom: 13 },
  sectionTitle: { color: "#173E2D", fontSize: 21, fontWeight: "900" },
  refresh: { color: "#A77D31", fontSize: 12, fontWeight: "900" },
  subhead: { color: "#173E2D", fontSize: 15, fontWeight: "900", marginBottom: 10 },
  card: { backgroundColor: "#fff", borderRadius: 13, padding: 15, borderWidth: 1, borderColor: "#E9E8E0", marginBottom: 10, gap: 5 },
  cardTitle: { color: "#173E2D", fontSize: 14, fontWeight: "900", marginBottom: 3 },
  meta: { color: "#69736B", fontSize: 11, lineHeight: 17 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 5, marginTop: 3 },
  amount: { color: "#173E2D", fontSize: 13, fontWeight: "900", marginTop: 5 },
  verifyPayButton: { alignItems: "center", padding: 11, marginTop: 6, borderRadius: 9, borderWidth: 1, borderColor: "#D6B66E" },
  verifyPayText: { color: "#8A6A2B", fontSize: 11, fontWeight: "900" },
  confirm: { color: "#237443", fontSize: 11, fontWeight: "900", marginTop: 5 },
  pending: { color: "#A77D31" },
  hotelDetails: { backgroundColor: "#F5F2E9", borderRadius: 9, padding: 11, marginTop: 6, gap: 3 },
  detailTitle: { color: "#173E2D", fontSize: 12, fontWeight: "900" },
  empty: { color: "#7B837B", fontSize: 11, lineHeight: 18, backgroundColor: "#fff", padding: 14, borderRadius: 10 },
  warning: { color: "#9A4A32", fontSize: 11, marginBottom: 12 },
  realEstate: { color: "#A77D31", fontSize: 12, fontWeight: "900", marginTop: 17 },
  panel: { backgroundColor: "#fff", padding: 18, borderRadius: 17, marginTop: 17, borderWidth: 1, borderColor: "#E9E8E0" },
  tabs: { flexDirection: "row", backgroundColor: "#F3F1E9", borderRadius: 10, padding: 4, marginBottom: 20 },
  tab: { flex: 1, padding: 11, alignItems: "center", borderRadius: 8 }, tabActive: { backgroundColor: "#123D2B" },
  tabText: { color: "#667168", fontWeight: "800", fontSize: 12 }, tabTextActive: { color: "#fff" },
  title: { fontSize: 21, color: "#173E2D", fontWeight: "900", marginBottom: 15 },
  label: { fontSize: 11, color: "#39483E", fontWeight: "800", marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#DDE1D8", borderRadius: 9, padding: 13, fontSize: 13, color: "#173E2D", backgroundColor: "#fff" },
  reset: { alignSelf: "flex-end", paddingVertical: 12 }, resetText: { fontSize: 11, color: "#A77D31", fontWeight: "800" },
  button: { backgroundColor: "#123D2B", borderRadius: 10, padding: 15, alignItems: "center", marginTop: 17, minHeight: 48, justifyContent: "center" },
  buttonText: { color: "#fff", fontSize: 13, fontWeight: "900" }, message: { fontSize: 11, lineHeight: 17, color: "#A33A2A", marginTop: 14 },
  success: { color: "#237443" }, foot: { fontSize: 10, color: "#858B84", textAlign: "center", marginTop: 20 }
});
