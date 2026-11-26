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
  owner_identity_verified: boolean | null; physical_inspection_verified: boolean | null;
};
type Room = { id: string; room_name: string; description: string | null; customer_rate: number; max_guests: number | null; photo_urls: string[] | null };

export default function PropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
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
    }
    loadProfile();
    async function load() {
      if (!supabase) {
        setError("Connect the Source Stays backend to view this listing.");
        setLoading(false);
        return;
      }
      const { data, error: propertyError } = await supabase.from("properties")
        .select("id,title,public_title,category,price,price_period,location,public_location,bedrooms,guests,amenities,image_url,hide_partner_identity,owner_identity_verified,physical_inspection_verified")
        .eq("id", Number(id)).eq("published", true).maybeSingle();
      if (!active) return;
      if (propertyError || !data) {
        setError("This listing is unavailable.");
        setLoading(false);
        return;
      }
      setItem(data as Property);
      const [photoResult, roomResult] = await Promise.all([
        supabase.from("property_images").select("image_url").eq("property_id", Number(id)).order("id"),
        String(data.category).toLowerCase() === "hotel"
          ? supabase.from("hotel_room_categories_public").select("id,room_name,description,customer_rate,max_guests,photo_urls").eq("property_id", Number(id)).order("sort_order")
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (!active) return;
      setImages([data.image_url, ...(photoResult.data || []).map((x: any) => x.image_url)].filter(Boolean) as string[]);
      const loadedRooms = (roomResult.data || []) as Room[];
      setRooms(loadedRooms);
      if (loadedRooms.length) setSelectedRoomId(loadedRooms[0].id);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [id]);

  const hidden = Boolean(item?.hide_partner_identity);
  const title = hidden ? (item?.public_title || "Luxury Private Getaway") : (item?.title || "Property");
  const place = hidden ? (item?.public_location || "Lagos") : (item?.location || "Location on request");
  const isHotel = String(item?.category || "").toLowerCase() === "hotel";

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
      }).select("request_ref").single();
      if (insertError) throw insertError;
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
              <Text style={styles.notice}>Source Stays will contact the hotel first. Payment is only arranged after availability is confirmed.</Text>
            </> : <>
              {Number(item.price) > 0 && <Text style={styles.rate}>₦{Number(item.price).toLocaleString("en-NG")} / {item.price_period || "night"}</Text>}
              <Text style={styles.notice}>Contact our team to confirm details, availability and next steps.</Text>
              <Pressable onPress={whatsapp} style={styles.cta}><Text style={styles.ctaText}>Enquire with Source Stays  →</Text></Pressable>
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
  twoFields: { flexDirection: "row", gap: 12 }, half: { flex: 1 }, noteInput: { minHeight: 78, textAlignVertical: "top" },
  cta: { backgroundColor: "#123D2B", padding: 16, borderRadius: 12, marginTop: 18, alignItems: "center" }, ctaText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  disabled: { opacity: 0.6 }, requestMessage: { fontSize: 12, lineHeight: 19, marginTop: 12 }, success: { color: "#247343" },
  notice: { fontSize: 11, color: "#777D76", lineHeight: 17, marginTop: 18 }, error: { color: "#9B3025", textAlign: "center", marginTop: 40 },
});
