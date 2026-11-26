import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

const divisions = [
  { title: "Shortlets", subtitle: "Apartments and private stays", category: "shortlet", icon: "⌂" },
  { title: "Hotels", subtitle: "Rooms for every kind of trip", category: "hotel", icon: "▦" },
  { title: "Real Estate", subtitle: "Buy, rent and explore property", category: "realestate", icon: "◇" },
  { title: "Rewards", subtitle: "Your Source Stays credits", category: "rewards", icon: "✧" },
];

export default function HomeScreen() {
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [status, setStatus] = useState("Connecting to Source Stays");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) {
        setStatus("Add your Supabase settings to mobile/.env to connect listings.");
        return;
      }
      const { count, error } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("published", true);
      if (!active) return;
      if (error) setStatus("Listings will appear here once the connection is ready.");
      else {
        setListingCount(count ?? 0);
        setStatus("Explore stays and property opportunities across Nigeria.");
      }
    }
    load();
    return () => { active = false; };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topline}>
          <Image source={{ uri: "https://raw.githubusercontent.com/sourcestays/source-stays-admin-fix/mobile-app-foundation/source-stays-logo-green-gold.png" }} style={styles.logo} resizeMode="contain" accessibilityLabel="Source Stays logo" />
          <Link href="/account" asChild><Pressable style={styles.account}><Text style={styles.accountText}>Sign in</Text></Pressable></Link>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>WELCOME TO SOURCE STAYS</Text>
          <Text style={styles.headline}>Find a place to stay.{"\n"}Find a place to own.</Text>
          <Text style={styles.heroCopy}>Discover handpicked shortlets, hotels and real estate opportunities — all in one place.</Text>
          <View style={styles.searchPill}><Text style={styles.searchIcon}>⌕</Text><Text style={styles.searchText}>Where would you like to go?</Text></View>
        </View>

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Explore Source Stays</Text><Text style={styles.sectionCopy}>Everything you need, in one place.</Text></View>
          {listingCount !== null && <Text style={styles.count}>{listingCount} listings</Text>}
        </View>

        <View style={styles.grid}>
          {divisions.map((item) => (
            <Link key={item.category} href={item.category === "rewards" ? "/rewards" : { pathname: "/division/[type]", params: { type: item.category } }} asChild><Pressable style={styles.tile}>
              <View style={styles.tileIcon}><Text style={styles.tileIconText}>{item.icon}</Text></View>
              <Text style={styles.tileTitle}>{item.title}</Text>
              <Text style={styles.tileCopy}>{item.subtitle}</Text>
              <Text style={styles.arrow}>Explore  →</Text>
            </Pressable></Link>
          ))}
        </View>

        <Link href="/recb" asChild><Pressable style={styles.recbCard}>
          <Text style={styles.recbEyebrow}>SOURCE STAYS × ZYLUS GROUP INTERNATIONAL</Text>
          <Text style={styles.recbTitle}>Real Estate Cashback Programme</Text>
          <Text style={styles.recbCopy}>Explore RECB information and official registration guidance. →</Text>
        </Pressable></Link>
        <View style={styles.note}>
          {!isSupabaseConfigured && <Text style={styles.noteTitle}>App foundation is ready</Text>}
          <Text style={styles.noteText}>{status}</Text>
          {!isSupabaseConfigured && <Text style={styles.noteHint}>The Supabase URL and publishable key are intentionally supplied through local environment variables, never committed to the repository.</Text>}
        </View>
        <Text style={styles.footer}>SOURCE STAYS  ·  LAGOS, NIGERIA</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F7F2" },
  content: { padding: 22, paddingBottom: 42 },
  topline: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
 logo: {
  width: 120,
  height: 90,
  alignSelf: "flex-start",
  marginLeft: 0,
},
  account: { borderWidth: 1, borderColor: "#D8D9CF", borderRadius: 24, paddingHorizontal: 17, paddingVertical: 9, marginTop: 10 },
  accountText: { color: "#123D2B", fontWeight: "700", fontSize: 12 },
  hero: { backgroundColor: "#123D2B", borderRadius: 24, padding: 23, marginBottom: 29 },
  eyebrow: { color: "#D6B66E", fontSize: 9, fontWeight: "800", letterSpacing: 1.6, marginBottom: 13 },
  headline: { color: "#FFFFFF", fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.8 },
  heroCopy: { color: "#E0E8E1", fontSize: 13, lineHeight: 20, marginTop: 12, maxWidth: 290 },
  searchPill: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginTop: 22, flexDirection: "row", alignItems: "center" },
  searchIcon: { color: "#B58A3A", fontSize: 23, marginRight: 10 },
  searchText: { color: "#777D76", fontSize: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 15 },
  sectionTitle: { color: "#173E2D", fontSize: 19, fontWeight: "800" },
  sectionCopy: { color: "#777D76", fontSize: 11, marginTop: 4 },
  count: { color: "#9B762F", fontSize: 10, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "48%", flexGrow: 1, backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E9E8E0", padding: 15, minHeight: 164 },
  tileIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: "#F5F0E4", alignItems: "center", justifyContent: "center", marginBottom: 13 },
  tileIconText: { color: "#A77D31", fontSize: 23, fontWeight: "700" },
  tileTitle: { color: "#183F2E", fontSize: 15, fontWeight: "800" },
  tileCopy: { color: "#777D76", fontSize: 10, lineHeight: 15, marginTop: 5 },
  arrow: { color: "#A77D31", fontSize: 10, fontWeight: "800", marginTop: "auto", paddingTop: 13 },
  recbCard: { backgroundColor: "#123D2B", borderRadius: 16, padding: 18, marginTop: 20 },
  recbEyebrow: { color: "#D6B66E", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  recbTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", marginTop: 7 },
  recbCopy: { color: "#E0E8E1", fontSize: 11, lineHeight: 17, marginTop: 5 },
  note: { backgroundColor: "#F0EEE5", borderRadius: 15, padding: 15, marginTop: 23 },
  noteTitle: { color: "#173E2D", fontSize: 12, fontWeight: "800", marginBottom: 5 },
  noteText: { color: "#626B62", fontSize: 11, lineHeight: 17 },
  noteHint: { color: "#82877F", fontSize: 10, lineHeight: 15, marginTop: 7 },
  footer: { textAlign: "center", color: "#9A9C92", fontSize: 9, letterSpacing: 1.5, marginTop: 27 },
});
