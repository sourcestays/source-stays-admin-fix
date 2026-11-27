import { useMemo } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/src/theme/ThemeProvider";

const WEBSITE_ABOUT = "https://sourcestays.com.ng/about.html";
const WHATSAPP = "https://wa.me/2347085404814";

export default function AboutScreen() {
  const { colors, isDark } = useAppTheme();
  const s = useMemo(() => StyleSheet.create({
    safe: { flex: 1 }, content: { padding: 20, paddingBottom: 42 },
    back: { color: colors.primary, fontWeight: "800", marginBottom: 18 },
    hero: { backgroundColor: colors.hero, borderRadius: 20, padding: 23, marginBottom: 14 },
    eyebrow: { color: colors.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
    heading: { color: colors.heroText, fontSize: 27, fontWeight: "900", lineHeight: 34, marginTop: 13 },
    heroCopy: { color: isDark ? colors.muted : "#E0E8E1", fontSize: 12, lineHeight: 20, marginTop: 10 },
    goldButton: { backgroundColor: colors.gold, borderRadius: 9, paddingHorizontal: 16, paddingVertical: 13, alignSelf: "flex-start", marginTop: 17 },
    goldText: { color: colors.goldText, fontSize: 12, fontWeight: "900" },
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 11 },
    title: { color: colors.text, fontSize: 19, fontWeight: "900" },
    body: { color: colors.muted, fontSize: 12, lineHeight: 20, marginTop: 8 },
    founder: { backgroundColor: colors.surfaceAlt, borderRadius: 15, padding: 18, marginTop: 8 },
    outlineButton: { borderWidth: 1, borderColor: colors.gold, borderRadius: 9, padding: 12, alignSelf: "flex-start", marginTop: 14 },
    outlineText: { color: colors.text, fontSize: 11, fontWeight: "900" },
    cta: { backgroundColor: colors.surface, borderRadius: 15, padding: 18, marginTop: 14, borderWidth: 1, borderColor: colors.border },
    reviewLink: { color: colors.gold, fontSize: 12, fontWeight: "900", marginTop: 20 },
    footer: { color: colors.muted, fontSize: 9, textAlign: "center", marginTop: 24, letterSpacing: 1 }
  }), [colors, isDark]);
  async function open(url: string) {
    try { await Linking.openURL(url); } catch { /* The user can retry from the website. */ }
  }

  return <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <ScrollView contentContainerStyle={s.content}>
      <Link href="/" style={s.back}>← Source Stays</Link>
      <View style={s.hero}>
        <Text style={s.eyebrow}>WELCOME TO SOURCE STAYS</Text>
        <Text style={s.heading}>Hospitality with a touch of class.</Text>
        <Text style={s.heroCopy}>We bring shortlet apartments, hotel stays and real estate opportunities together, with a focus on helpful service, clear information and a better customer experience.</Text>
        <Link href="/division/shortlet" asChild><Pressable style={s.goldButton}><Text style={s.goldText}>Explore our listings</Text></Pressable></Link>
      </View>
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.title, { color: colors.text }]}>Our Story</Text>
        <Text style={[s.body, { color: colors.muted }]}>Source Stays was created to make finding accommodation and exploring property opportunities easier. Whether someone is planning a short getaway, a business trip or looking for real estate, we want the experience to feel welcoming, clear and convenient.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Our Mission</Text>
        <Text style={s.body}>Our mission is to connect people with suitable stays and property opportunities through clear listing information, responsive communication and thoughtful hospitality.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Our Vision</Text>
        <Text style={s.body}>Our vision is to become a trusted destination for stays and property opportunities in Nigeria, recognised for transparency, quality service and continuous improvement.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Our Commitment</Text>
        <Text style={s.body}>We are building a service that values people, honest communication and better property information. We aim to keep improving how customers discover, understand and enquire about our listings.</Text>
      </View>
      <View style={s.founder}>
        <Text style={s.eyebrow}>FROM THE FOUNDER</Text>
        <Text style={s.title}>A personal message about the Source Stays vision</Text>
        <Text style={s.body}>Hear directly from our founder about the story behind Source Stays, the values guiding our work and the vision we are building towards.</Text>
        <Pressable style={s.outlineButton} onPress={() => open(WEBSITE_ABOUT)}><Text style={s.outlineText}>Watch founder's message on our website ↗</Text></Pressable>
      </View>
      <View style={s.cta}>
        <Text style={s.title}>Let us help you find your next stay.</Text>
        <Text style={s.body}>Explore our listings or speak with us about your needs.</Text>
        <Pressable style={s.goldButton} onPress={() => open(WHATSAPP)}><Text style={s.goldText}>Chat with Source Stays</Text></Pressable>
      </View>
      <Link href="/reviews" style={s.reviewLink}>Read guest experiences and share a review →</Link>
      <Text style={s.footer}>SOURCE STAYS · SHORTLETS · HOTELS · REAL ESTATE</Text>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: 20, paddingBottom: 42 },
  back: { color: "#123D2B", fontWeight: "800", marginBottom: 18 },
  hero: { backgroundColor: "#123D2B", borderRadius: 20, padding: 23, marginBottom: 14 },
  eyebrow: { color: "#D6B66E", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  heading: { color: "#fff", fontSize: 27, fontWeight: "900", lineHeight: 34, marginTop: 13 },
  heroCopy: { color: "#E0E8E1", fontSize: 12, lineHeight: 20, marginTop: 10 },
  goldButton: { backgroundColor: "#D6B66E", borderRadius: 9, paddingHorizontal: 16, paddingVertical: 13, alignSelf: "flex-start", marginTop: 17 },
  goldText: { color: "#173E2D", fontSize: 12, fontWeight: "900" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#E8E6DD", marginBottom: 11 },
  title: { color: "#173E2D", fontSize: 19, fontWeight: "900" },
  body: { color: "#657067", fontSize: 12, lineHeight: 20, marginTop: 8 },
  founder: { backgroundColor: "#F0EEE5", borderRadius: 15, padding: 18, marginTop: 8 },
  outlineButton: { borderWidth: 1, borderColor: "#123D2B", borderRadius: 9, padding: 12, alignSelf: "flex-start", marginTop: 14 },
  outlineText: { color: "#123D2B", fontSize: 11, fontWeight: "900" },
  cta: { backgroundColor: "#fff", borderRadius: 15, padding: 18, marginTop: 14, borderWidth: 1, borderColor: "#E8E6DD" },
  reviewLink: { color: "#A77D31", fontSize: 12, fontWeight: "900", marginTop: 20 },
  footer: { color: "#858B84", fontSize: 9, textAlign: "center", marginTop: 24, letterSpacing: 1 }
});
