import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useAppTheme, ThemeMode } from "@/src/theme/ThemeProvider";
import { SectionIcon } from "@/src/components/SectionIcon";

const divisions = [
  { title: "Shortlets", subtitle: "Apartments & private stays", category: "shortlet", icon: "shortlets" },
  { title: "Hotels", subtitle: "Comfortable hotel rooms", category: "hotel", icon: "hotels" },
  { title: "Real Estate", subtitle: "Buy, rent & invest", category: "realestate", icon: "realestate" },
  { title: "Rewards", subtitle: "Get more from every stay", category: "rewards", icon: "rewards" },
];

export default function HomeScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const { mode, setMode, isDark, colors } = useAppTheme();

  const cycleTheme = () => setMode(mode === "system" ? "dark" : mode === "dark" ? "light" : "system");

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.topbar}>
          <Image source={require("../assets/source-stays-logo.png")} style={s.logo} resizeMode="contain" accessibilityLabel="Source Stays logo" />
          <View style={s.actions}>
            <Pressable onPress={cycleTheme} style={[s.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel="Change appearance">
              <SectionIcon name={isDark ? "moon" : "sun"} size={17} color={colors.gold} background="transparent" />
            </Pressable>
            <Link href="/account" asChild>
              <Pressable style={[s.accountButton, { backgroundColor: colors.primary }]}>
                <Text style={[s.accountText, { color: colors.primaryText }]}>My account</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={[s.hero, { backgroundColor: colors.hero }]}>
          <Text style={s.eyebrow}>STAY  ·  DISCOVER  ·  OWN</Text>
          <Text style={s.headline}>Your next stay{ "\n" }starts here.</Text>
          <Text style={s.heroCopy}>Discover thoughtfully selected shortlets, hotels and real estate opportunities.</Text>
          <View style={[s.searchBox, { backgroundColor: colors.input }]}>
            <SectionIcon name="search" size={18} color={colors.gold} background="transparent" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Where would you like to go?"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              style={[s.searchInput, { color: colors.text }]}
            />
            <Link href={{ pathname: "/division/[type]", params: { type: "shortlet", q: searchTerm.trim() } }} asChild>
              <Pressable style={s.searchAction}><Text style={s.searchActionText}>Go</Text></Pressable>
            </Link>
          </View>
        </View>

        <View style={s.sectionHeading}>
          <View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Explore Source Stays</Text>
            <Text style={[s.sectionSubtitle, { color: colors.muted }]}>Choose what you're looking for</Text>
          </View>
        </View>

        <View style={s.grid}>
          {divisions.map(item => (
            <Link key={item.category} href={item.category === "rewards" ? "/rewards" : { pathname: "/division/[type]", params: { type: item.category } }} asChild>
              <Pressable style={[s.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[s.categoryIcon, { backgroundColor: isDark ? "#294638" : "#F5F0E4" }]}>
                  <SectionIcon name={item.icon} size={23} color={colors.gold} background="transparent" />
                </View>
                <View style={s.categoryCopy}>
                  <Text style={[s.categoryTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[s.categorySubtitle, { color: colors.muted }]}>{item.subtitle}</Text>
                </View>
                <SectionIcon name="arrow" size={15} color={colors.gold} background="transparent" />
              </Pressable>
            </Link>
          ))}
        </View>

        <Link href="/recb" asChild>
          <Pressable style={[s.recb, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Text style={[s.recbEyebrow, { color: colors.gold }]}>SOURCE STAYS × ZYLUS GROUP</Text>
            <Text style={[s.recbTitle, { color: colors.text }]}>Real Estate Cashback Programme</Text>
            <Text style={[s.recbCopy, { color: colors.muted }]}>Discover the programme and how to participate.</Text>
            <Text style={[s.recbLink, { color: colors.gold }]}>Explore programme  ↗</Text>
          </Pressable>
        </Link>

        <View style={s.secondaryLinks}>
          <Link href="/about" asChild><Pressable style={[s.secondaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[s.secondaryTitle, { color: colors.text }]}>About us</Text><Text style={[s.secondarySubtitle, { color: colors.muted }]}>Our story</Text></Pressable></Link>
          <Link href="/reviews" asChild><Pressable style={[s.secondaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[s.secondaryTitle, { color: colors.text }]}>Guest reviews</Text><Text style={[s.secondarySubtitle, { color: colors.muted }]}>Guest experiences</Text></Pressable></Link>
        </View>

        <View style={[s.appearance, { borderTopColor: colors.border }]}>
          <Text style={[s.appearanceLabel, { color: colors.muted }]}>APPEARANCE</Text>
          {(["light", "dark", "system"] as ThemeMode[]).map(option => (
            <Pressable key={option} onPress={() => setMode(option)} style={[s.modeChip, { backgroundColor: mode === option ? colors.primary : colors.surface, borderColor: colors.border }]} accessibilityRole="button" accessibilityState={{ selected: mode === option }}>
              <Text style={{ color: mode === option ? colors.primaryText : colors.muted, fontSize: 10, fontWeight: "800" }}>{option[0].toUpperCase() + option.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[s.footer, { color: colors.muted }]}>SOURCE STAYS  ·  LAGOS, NIGERIA</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 19, paddingTop: 8, paddingBottom: 34 },
  topbar: { minHeight: 58, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  logo: { width: 94, height: 55 },
  actions: { flexDirection: "row", alignItems: "center", gap: 9 },
  iconButton: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  accountButton: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 13 },
  accountText: { fontSize: 11, fontWeight: "900" },
  hero: { borderRadius: 23, padding: 21, marginBottom: 27, overflow: "hidden" },
  eyebrow: { color: "#D6B66E", fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  headline: { color: "#FFFFFF", fontSize: 33, lineHeight: 38, fontWeight: "900", letterSpacing: -1, marginTop: 14 },
  heroCopy: { color: "#E0E8E1", fontSize: 12, lineHeight: 19, marginTop: 10, maxWidth: 290 },
  searchBox: { minHeight: 53, borderRadius: 14, paddingLeft: 12, paddingRight: 5, marginTop: 19, flexDirection: "row", alignItems: "center" },
  searchInput: { flex: 1, fontSize: 11, paddingHorizontal: 9, paddingVertical: 10 },
  searchAction: { backgroundColor: "#D6B66E", borderRadius: 11, paddingHorizontal: 16, paddingVertical: 11 },
  searchActionText: { color: "#123D2B", fontSize: 11, fontWeight: "900" },
  sectionHeading: { marginBottom: 13 },
  sectionTitle: { fontSize: 19, fontWeight: "900", letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 11, marginTop: 4 },
  grid: { gap: 10 },
  categoryCard: { minHeight: 76, borderRadius: 17, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 12 },
  categoryIcon: { width: 45, height: 45, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  categoryCopy: { flex: 1 },
  categoryTitle: { fontSize: 14, fontWeight: "900" },
  categorySubtitle: { fontSize: 10, marginTop: 4 },
  recb: { borderWidth: 1, borderRadius: 18, padding: 17, marginTop: 19 },
  recbEyebrow: { fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  recbTitle: { fontSize: 16, fontWeight: "900", marginTop: 7 },
  recbCopy: { fontSize: 10, lineHeight: 16, marginTop: 5 },
  recbLink: { fontSize: 10, fontWeight: "900", marginTop: 12 },
  secondaryLinks: { flexDirection: "row", gap: 10, marginTop: 11 },
  secondaryCard: { flex: 1, borderWidth: 1, borderRadius: 15, padding: 13 },
  secondaryTitle: { fontSize: 11, fontWeight: "900" },
  secondarySubtitle: { fontSize: 9, marginTop: 5 },
  appearance: { borderTopWidth: 1, marginTop: 22, paddingTop: 15, flexDirection: "row", alignItems: "center", gap: 7 },
  appearanceLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 1, flex: 1 },
  modeChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  footer: { textAlign: "center", fontSize: 8, letterSpacing: 1.3, marginTop: 22 },
});
