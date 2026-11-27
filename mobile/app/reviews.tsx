import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type Review = { reviewer_name: string; reviewer_type: string; rating: number; comment: string; created_at: string };

export default function ReviewsScreen() {
  const { colors, isDark } = useAppTheme();
  const gold = colors.gold;
  const s = useMemo(() => StyleSheet.create({
    safe: { flex: 1 }, content: { padding: 20, paddingBottom: 42 },
    back: { color: colors.primary, fontWeight: "800", marginBottom: 18 },
    eyebrow: { color: colors.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
    heading: { color: colors.text, fontSize: 27, fontWeight: "900", marginTop: 8 },
    intro: { color: colors.muted, fontSize: 12, lineHeight: 20, marginTop: 8 },
    sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 25, marginBottom: 12 },
    sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
    refresh: { color: colors.gold, fontSize: 11, fontWeight: "900" },
    review: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 15, marginBottom: 10 },
    stars: { color: colors.gold, fontSize: 19, letterSpacing: 2 },
    comment: { color: colors.text, fontSize: 12, lineHeight: 20, marginTop: 9 },
    name: { color: colors.text, fontSize: 12, fontWeight: "900", marginTop: 12 },
    kind: { color: colors.muted, fontSize: 10, marginTop: 3 },
    empty: { backgroundColor: colors.surface, borderRadius: 11, padding: 15, color: colors.muted, fontSize: 12, lineHeight: 19 },
    form: { backgroundColor: colors.surface, borderRadius: 15, padding: 17, marginTop: 19, borderWidth: 1, borderColor: colors.border },
    helper: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
    label: { color: colors.gold, fontSize: 10, fontWeight: "900", letterSpacing: .8, marginTop: 17, marginBottom: 7 },
    input: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 9, padding: 12, color: colors.text, fontSize: 12 },
    textarea: { minHeight: 125, paddingTop: 12 },
    choiceRow: { flexDirection: "row", gap: 8 },
    choice: { borderWidth: 1, borderColor: colors.border, borderRadius: 9, padding: 11, flex: 1, alignItems: "center", backgroundColor: colors.surface },
    choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    choiceText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
    choiceTextActive: { color: colors.primaryText },
    ratingRow: { flexDirection: "row", gap: 10 },
    ratingStar: { fontSize: 31 },
    ratingCaption: { color: colors.muted, fontSize: 10, marginTop: 2 },
    counter: { color: colors.muted, fontSize: 10, textAlign: "right", marginTop: 5 },
    button: { backgroundColor: colors.primary, borderRadius: 10, minHeight: 48, padding: 14, alignItems: "center", justifyContent: "center", marginTop: 16 },
    buttonText: { color: colors.primaryText, fontSize: 12, fontWeight: "900" },
    message: { color: isDark ? "#F2A198" : "#A33A2A", fontSize: 11, lineHeight: 18, marginTop: 12 },
    success: { color: colors.success }
  }), [colors, isDark]);
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"guest" | "property_owner">("guest");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!supabase) { setLoadError("Reviews are unavailable because the app is not connected to Source Stays services."); setLoading(false); return; }
    setLoading(true); setLoadError("");
    const { data, error } = await supabase.from("reviews")
      .select("reviewer_name,reviewer_type,rating,comment,created_at")
      .eq("status", "approved").order("created_at", { ascending: false }).limit(20);
    if (error) setLoadError("Reviews are temporarily unavailable. Please try again later.");
    else setRows((data || []) as Review[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  async function submitReview() {
    setMessage(""); setSuccess(false);
    const cleanName = name.trim(), cleanComment = comment.trim();
    if (cleanName.length < 2 || cleanName.length > 100 || cleanComment.length < 10 || cleanComment.length > 2000 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      setMessage("Please check your name, rating and review. Your review must be between 10 and 2,000 characters."); return;
    }
    if (!supabase) { setMessage("Reviews are unavailable right now. Please try again later."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        reviewer_name: cleanName, reviewer_type: type, rating, comment: cleanComment,
        status: "pending", source: "customer"
      });
      if (error) throw error;
      setName(""); setComment(""); setRating(5); setType("guest");
      setMessage("Thank you! Your review has been submitted for approval.");
      setSuccess(true);
    } catch {
      setMessage("We could not submit your review right now. Please try again later.");
    } finally { setBusy(false); }
  }

  return <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Link href="/" style={s.back}>← Source Stays</Link>
      <Text style={s.eyebrow}>GUEST EXPERIENCES</Text>
      <Text style={s.heading}>Reviews from our community</Text>
      <Text style={s.intro}>We're building a trusted community of guests and property owners. Have you used Source Stays? Share your experience.</Text>
      <View style={s.sectionHead}><Text style={s.sectionTitle}>Published reviews</Text><Pressable onPress={loadReviews}><Text style={s.refresh}>Refresh</Text></Pressable></View>
      {loading ? <ActivityIndicator color="#123D2B" style={{ marginVertical: 25 }} /> : loadError ? <Text style={s.empty}>{loadError}</Text> : rows.length ? rows.map((review, i) => <View key={review.created_at + i} style={s.review}>
        <Text style={s.stars} accessibilityLabel={review.rating + " out of 5 stars"}>{"★".repeat(Math.max(0, Math.min(5, Number(review.rating)))) + "☆".repeat(5 - Math.max(0, Math.min(5, Number(review.rating))))}</Text>
        <Text style={s.comment}>{review.comment}</Text>
        <Text style={s.name}>{review.reviewer_name}</Text>
        <Text style={s.kind}>{review.reviewer_type === "property_owner" ? "Property owner" : "Guest"}</Text>
      </View>) : <Text style={s.empty}>No published reviews yet. Be among the first to share your genuine experience with Source Stays.</Text>}
      <View style={s.form}>
        <Text style={s.sectionTitle}>Share your experience</Text>
        <Text style={s.helper}>Your review will be checked by our team before it appears publicly.</Text>
        <Text style={s.label}>YOUR NAME</Text>
        <TextInput value={name} onChangeText={setName} maxLength={100} autoComplete="name" placeholder="Your name" style={s.input} />
        <Text style={s.label}>I AM A</Text>
        <View style={s.choiceRow}>
          <Pressable onPress={() => setType("guest")} style={[s.choice, type === "guest" && s.choiceActive]}><Text style={[s.choiceText, type === "guest" && s.choiceTextActive]}>Guest</Text></Pressable>
          <Pressable onPress={() => setType("property_owner")} style={[s.choice, type === "property_owner" && s.choiceActive]}><Text style={[s.choiceText, type === "property_owner" && s.choiceTextActive]}>Property owner</Text></Pressable>
        </View>
        <Text style={s.label}>YOUR RATING</Text>
        <View style={s.ratingRow}>{[1,2,3,4,5].map(n => <Pressable key={n} onPress={() => setRating(n)} accessibilityRole="button" accessibilityLabel={n + " stars"}><Text style={[s.ratingStar, { color: n <= rating ? gold : colors.border }]}>★</Text></Pressable>)}</View>
        <Text style={s.ratingCaption}>{["","Poor","Fair","Good","Very good","Excellent"][rating]}</Text>
        <Text style={s.label}>YOUR REVIEW</Text>
        <TextInput value={comment} onChangeText={setComment} multiline maxLength={2000} placeholder="Tell us about your genuine experience..." textAlignVertical="top" style={[s.input, s.textarea]} />
        <Text style={s.counter}>{comment.trim().length}/2000 characters (minimum 10)</Text>
        <Pressable onPress={submitReview} disabled={busy} style={[s.button, busy && { opacity: .65 }]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Submit review</Text>}</Pressable>
        {!!message && <Text style={[s.message, success && s.success]}>{message}</Text>}
      </View>
    </ScrollView>
  </SafeAreaView>;
}

