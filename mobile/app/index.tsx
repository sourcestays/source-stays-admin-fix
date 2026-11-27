import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { useAppTheme, ThemeMode } from "@/src/theme/ThemeProvider";
import { SectionIcon } from "@/src/components/SectionIcon";

const divisions = [
  { title: "Shortlets", subtitle: "Beautiful spaces for your next stay", category: "shortlet", icon: "shortlets" },
  { title: "Hotels", subtitle: "Comfort, service and great locations", category: "hotel", icon: "hotels" },
  { title: "Real Estate", subtitle: "Find a place to call your own", category: "realestate", icon: "realestate" },
  { title: "Rewards", subtitle: "Enjoy more with Source Stays", category: "rewards", icon: "rewards" },
];

export default function HomeScreen() {
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("Discover stays and property opportunities across Nigeria.");
  const { mode, setMode, isDark, colors } = useAppTheme();

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) { setStatus("Connect to Source Stays to explore live listings."); return; }
      const { count, error } = await supabase.from("properties").select("id", { count: "exact", head: true }).eq("published", true);
      if (!active) return;
      if (error) setStatus("Explore stays and property opportunities across Nigeria.");
      else { setListingCount(count ?? 0); setStatus("Discover stays and property opportunities across Nigeria."); }
    }
    load();
    return () => { active = false; };
  }, []);

  const cycleTheme = (next: ThemeMode) => setMode(next);
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.topline}>
          <Image source={{ uri: "https://raw.githubusercontent.com/sourcestays/source-stays-admin-fix/mobile-app-foundation/source-stays-logo-green-gold.png" }} style={s.logo} resizeMode="contain" accessibilityLabel="Source Stays logo" />
          <View style={s.topActions}>
            <Pressable onPress={() => cycleTheme(mode === "system" ? "dark" : mode === "dark" ? "light" : "system")} style={[s.themeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <SectionIcon name={isDark ? "moon" : "sun"} size={16} color={colors.gold} background="transparent" />
            </Pressable>
            <Link href="/account" asChild><Pressable style={[s.account, { backgroundColor: colors.primary }]}><Text style={[s.accountText, { color: colors.primaryText }]}>My Account</Text></Pressable></Link>
          </View>
        </View>

        <View style={[s.hero, { backgroundColor: colors.hero }]}>
          <View pointerEvents="none" style={s.heroGlow} />
          <Text style={s.eyebrow}>LAGOS  ·  NIGERIA</Text>
          <Text style={s.headline}>Find a place to stay.{"\n"}Find a place to own.</Text>
          <Text style={s.heroCopy}>Shortlet apartments, hotel stays and real-estate opportunities — brought together by Source Stays.</Text>
          <View style={[s.searchPill, { backgroundColor: colors.input }]}>
            <SectionIcon name="search" size={18} color={colors.gold} background="transparent" />
            <TextInput value={searchTerm} onChangeText={setSearchTerm} onSubmitEditing={() => {}} returnKeyType="search" placeholder="Location e.g. Lekki, Ikeja, Magodo" placeholderTextColor={colors.muted} style={[s.searchInput, { color: colors.text }]} />
          </View>
          <Link href={{ pathname: "/division/[type]", params: { type: "shortlet", q: searchTerm.trim() } }} asChild>
            <Pressable style={s.searchButton}><Text style={s.searchButtonText}>Explore stays  ↗</Text></Pressable>
          </Link>
          <View style={s.heroFoot}><Text style={s.heroFootText}>STAY • DISCOVER • OWN</Text><Text style={s.heroFootText}>SOURCE STAYS</Text></View>
        </View>

        <View style={s.sectionHeader}>
          <View><Text style={[s.sectionTitle, { color: colors.text }]}>Explore our world</Text><Text style={[s.sectionCopy, { color: colors.muted }]}>Everything you need, in one place.</Text></View>
          {listingCount !== null && <Text style={[s.count, { color: colors.gold }]}>{listingCount} listings</Text>}
        </View>
        <View style={s.grid}>
          {divisions.map(item => (
            <Link key={item.category} href={item.category === "rewards" ? "/rewards" : { pathname: "/division/[type]", params: { type: item.category } }} asChild>
              <Pressable style={[s.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={s.tileTop}><SectionIcon name={item.icon} size={24} color={colors.gold} background={isDark ? "#294638" : "#F5F0E4"} /><Text style={[s.tileArrow, { color: colors.gold }]}>↗</Text></View>
                <Text style={[s.tileTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[s.tileCopy, { color: colors.muted }]}>{item.subtitle}</Text>
                <Text style={[s.explore, { color: colors.gold }]}>Explore section</Text>
              </Pressable>
            </Link>
          ))}
        </View>

        <Link href="/recb" asChild><Pressable style={[s.recbCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[s.recbEyebrow, { color: colors.gold }]}>SOURCE STAYS × ZYLUS GROUP INTERNATIONAL</Text>
          <Text style={[s.recbTitle, { color: colors.text }]}>Real Estate Cashback Programme</Text>
          <Text style={[s.recbCopy, { color: colors.muted }]}>Explore the programme and official registration guidance.  ↗</Text>
        </Pressable></Link>
        <View style={s.infoLinks}>
          <Link href="/about" asChild><Pressable style={[s.infoLink, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[s.infoLinkTitle, { color: colors.text }]}>About Source Stays</Text><Text style={[s.infoLinkCopy, { color: colors.gold }]}>Our story  ↗</Text></Pressable></Link>
          <Link href="/reviews" asChild><Pressable style={[s.infoLink, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[s.infoLinkTitle, { color: colors.text }]}>Guest experiences</Text><Text style={[s.infoLinkCopy, { color: colors.gold }]}>Read reviews  ↗</Text></Pressable></Link>
        </View>

        <View style={[s.appearance, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}><Text style={[s.appearanceTitle, { color: colors.text }]}>Appearance</Text><Text style={[s.appearanceCopy, { color: colors.muted }]}>Choose how Source Stays looks.</Text></View>
          {(["light", "dark", "system"] as ThemeMode[]).map(option => <Pressable key={option} onPress={() => setMode(option)} style={[s.modeChip, { backgroundColor: mode === option ? colors.primary : colors.surfaceAlt }]}><Text style={[s.modeText, { color: mode === option ? colors.primaryText : colors.muted }]}>{option === "light" ? "☼" : option === "dark" ? "☾" : "◐"}</Text></Pressable>)}
        </View>
        <Text style={[s.noteText, { color: colors.muted }]}>{status}{!isSupabaseConfigured ? " Add the test project's public settings to the local build environment to load listings." : ""}</Text>
        <Text style={[s.footer, { color: colors.muted }]}>SOURCE STAYS  ·  LAGOS, NIGERIA</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: 20, paddingBottom: 42 },
  topline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  logo: { width: 112, height: 72 }, topActions: { flexDirection: "row", alignItems: "center", gap: 9 },
  themeButton: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  account: { borderRadius: 15, paddingHorizontal: 16, paddingVertical: 13 }, accountText: { fontWeight: "900", fontSize: 11 },
  hero: { borderRadius: 25, padding: 23, marginBottom: 30, overflow: "hidden" },
  heroGlow: { position: "absolute", width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: "rgba(214,182,110,0.18)", right: -95, top: -95 },
  eyebrow: { color: "#D6B66E", fontSize: 10, fontWeight: "900", letterSpacing: 2, marginBottom: 15 },
  headline: { color: "#FFFFFF", fontSize: 34, lineHeight: 39, fontWeight: "900", letterSpacing: -1.2 },
  heroCopy: { color: "#E0E8E1", fontSize: 13, lineHeight: 21, marginTop: 14, maxWidth: 300 },
  searchPill: { borderRadius: 15, paddingHorizontal: 12, paddingVertical: 5, marginTop: 23, flexDirection: "row", alignItems: "center", minHeight: 54 },
  searchInput: { fontSize: 12, flex: 1, paddingVertical: 8, marginLeft: 5 },
  searchButton: { alignSelf: "flex-start", backgroundColor: "#D6B66E", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13, marginTop: 11 },
  searchButtonText: { color: "#123D2B", fontSize: 12, fontWeight: "900" },
  heroFoot: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.17)", marginTop: 23, paddingTop: 13, flexDirection: "row", justifyContent: "space-between" },
  heroFootText: { color: "#D6B66E", fontSize: 8, fontWeight: "900", letterSpacing: 1.4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 15 },
  sectionTitle: { fontSize: 21, fontWeight: "900", letterSpacing: -0.4 }, sectionCopy: { fontSize: 11, marginTop: 5 },
  count: { fontSize: 10, fontWeight: "800" }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "48%", flexGrow: 1, borderRadius: 19, borderWidth: 1, padding: 15, minHeight: 180 },
  tileTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 17 },
  tileArrow: { fontSize: 18, fontWeight: "700" }, tileTitle: { fontSize: 16, fontWeight: "900" },
  tileCopy: { fontSize: 10, lineHeight: 15, marginTop: 5 }, explore: { fontSize: 10, fontWeight: "900", marginTop: "auto", paddingTop: 15 },
  recbCard: { borderWidth: 1, borderRadius: 18, padding: 18, marginTop: 20 },
  recbEyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 }, recbTitle: { fontSize: 17, fontWeight: "900", marginTop: 8 },
  recbCopy: { fontSize: 11, lineHeight: 17, marginTop: 6 },
  infoLinks: { flexDirection: "row", gap: 10, marginTop: 13 },
  infoLink: { flex: 1, borderWidth: 1, borderRadius: 15, padding: 14 },
  infoLinkTitle: { fontSize: 11, fontWeight: "900" }, infoLinkCopy: { fontSize: 10, marginTop: 7, fontWeight: "800" },
  appearance: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 16, padding: 13, marginTop: 20 },
  appearanceTitle: { fontSize: 12, fontWeight: "900" }, appearanceCopy: { fontSize: 9, marginTop: 3 },
  modeChip: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" }, modeText: { fontSize: 17, fontWeight: "900" },
  noteText: { fontSize: 10, lineHeight: 16, marginTop: 17 }, footer: { textAlign: "center", fontSize: 9, letterSpacing: 1.5, marginTop: 24 },
});
