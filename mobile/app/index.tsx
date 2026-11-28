import { useEffect, useState } from "react";
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { SectionIcon } from "@/src/components/SectionIcon";

type FeaturedStay = {
  id: number;
  title: string;
  public_title: string | null;
  image_url: string | null;
  public_location: string | null;
  location: string | null;
  price: number | null;
  price_period: string | null;
  hide_partner_identity: boolean | null;
};

const primaryServices = [
  { title: "Shortlets", caption: "Apartments & villas", type: "shortlet", icon: "shortlets" },
  { title: "Hotels", caption: "Rooms & getaways", type: "hotel", icon: "hotels" },
  { title: "Real estate", caption: "Buy, rent or invest", type: "realestate", icon: "realestate" },
  { title: "Rewards", caption: "Earn stay benefits", type: "rewards", icon: "rewards" },
];

export default function HomeScreen() {
  const { isDark, colors, mode, setMode } = useAppTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [featured, setFeatured] = useState<FeaturedStay | null>(null);

  useEffect(() => {
    let active = true;
    async function loadFeatured() {
      if (!supabase) return;
      const { data } = await supabase.from("properties")
        .select("id,title,public_title,image_url,public_location,location,price,price_period,hide_partner_identity")
        .eq("published", true)
        .eq("featured", true)
        .in("category", ["shortlet", "hotel"])
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (active && data) setFeatured(data as FeaturedStay);
    }
    loadFeatured();
    return () => { active = false; };
  }, []);

  const featuredName = featured?.hide_partner_identity
    ? featured.public_title || "A beautiful place to stay"
    : featured?.title || "Find your next favourite stay";
  const featuredPlace = featured?.hide_partner_identity ? featured.public_location : featured?.location;
  const featuredPrice = Number(featured?.price) > 0
    ? "₦" + Number(featured?.price).toLocaleString("en-NG") + " / " + (featured?.price_period || "night")
    : "Explore handpicked stays";

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.topbar}>
          <View style={s.brandRow}>
            <View style={s.logoBadge}><Image source={require("../assets/source-stays-logo.png")} style={s.logo} resizeMode="contain" accessibilityLabel="Source Stays" /></View>
            <View>
              <Text style={[s.eyebrow, { color: colors.muted }]}>WELCOME TO</Text>
              <Text style={[s.brandName, { color: colors.text }]}>Source Stays</Text>
            </View>
          </View>
          <View style={s.topActions}>
            <Pressable onPress={() => setMode(mode === "dark" ? "light" : "dark")}
              style={[s.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="button" accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}>
              <SectionIcon name={isDark ? "sun" : "moon"} size={17} color={colors.gold} background="transparent" />
            </Pressable>
            <Link href="/account" asChild>
              <Pressable style={[s.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel="My account">
                <SectionIcon name="account" size={18} color={colors.gold} background="transparent" />
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={s.intro}>
          <Text style={[s.heading, { color: colors.text }]}>Where would you like to go?</Text>
          <Text style={[s.subheading, { color: colors.muted }]}>Find a stay, book a room or discover your next property.</Text>
        </View>

        <View style={[s.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionIcon name="search" size={18} color={colors.muted} background="transparent" />
          <TextInput value={searchTerm} onChangeText={setSearchTerm}
            placeholder="Search area, property or destination"
            placeholderTextColor={colors.muted} returnKeyType="search"
            style={[s.searchInput, { color: colors.text }]} />
          <Link href={{ pathname: "/division/[type]", params: { type: "shortlet", q: searchTerm.trim() } }} asChild>
            <Pressable style={[s.searchGo, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.primaryText, fontSize: 12, fontWeight: "800" }}>Search</Text>
            </Pressable>
          </Link>
        </View>

        <View style={s.sectionHeading}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Explore services</Text>
          <Text style={[s.sectionHint, { color: colors.muted }]}>Everything in one place</Text>
        </View>
        <View style={s.serviceGrid}>
          {primaryServices.map(item => (
            <Link key={item.type}
              href={item.type === "rewards" ? "/rewards" : { pathname: "/division/[type]", params: { type: item.type } }}
              asChild>
              <Pressable style={[s.serviceTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[s.serviceIcon, { backgroundColor: isDark ? "#1D3B2E" : "#DDECE1" }]}>
                  <SectionIcon name={item.icon} size={22} color={isDark ? "#8BD4A8" : "#126B46"} background="transparent" />
                </View>
                <Text style={[s.serviceTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[s.serviceCaption, { color: colors.muted }]}>{item.caption}</Text>
              </Pressable>
            </Link>
          ))}
        </View>

        <View style={s.sectionHeading}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Quick access</Text>
        </View>
        <View style={[s.quickPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Link href="/account" asChild>
            <Pressable style={s.quickItem}>
              <View style={[s.quickIcon, { backgroundColor: colors.surfaceAlt }]}>
                <SectionIcon name="account" size={19} color={colors.gold} background="transparent" />
              </View>
              <Text style={[s.quickLabel, { color: colors.text }]}>My account</Text>
            </Pressable>
          </Link>
          <Link href="/recb" asChild>
            <Pressable style={s.quickItem}>
              <View style={[s.quickIcon, { backgroundColor: colors.surfaceAlt }]}>
                <SectionIcon name="gift" size={19} color={colors.gold} background="transparent" />
              </View>
              <Text style={[s.quickLabel, { color: colors.text }]}>RECB</Text>
            </Pressable>
          </Link>
          <Link href="/reviews" asChild>
            <Pressable style={s.quickItem}>
              <View style={[s.quickIcon, { backgroundColor: colors.surfaceAlt }]}>
                <SectionIcon name="shield" size={19} color={colors.gold} background="transparent" />
              </View>
              <Text style={[s.quickLabel, { color: colors.text }]}>Guest reviews</Text>
            </Pressable>
          </Link>
        </View>

        <View style={s.sectionHeading}>
          <View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Featured stay</Text>
            <Text style={[s.sectionHint, { color: colors.muted }]}>A little inspiration for your next trip</Text>
          </View>
          <Link href={{ pathname: "/division/[type]", params: { type: "shortlet" } }}>
            <Text style={[s.seeAll, { color: colors.gold }]}>See all</Text>
          </Link>
        </View>
        <Link href={featured ? { pathname: "/property/[id]", params: { id: String(featured.id) } } : { pathname: "/division/[type]", params: { type: "shortlet" } }} asChild>
          <Pressable style={[s.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {featured?.image_url ? (
              <ImageBackground source={{ uri: featured.image_url }} style={s.featureImage} imageStyle={s.featureImageStyle}>
                <View style={s.featurePill}><Text style={s.featurePillText}>SOURCE STAYS PICK</Text></View>
              </ImageBackground>
            ) : (
              <View style={[s.featureImage, s.featureFallback, { backgroundColor: colors.hero }]}>
                <SectionIcon name="bed" size={34} color="#D6B66E" background="rgba(255,255,255,0.08)" />
                <Text style={s.fallbackTitle}>Thoughtful stays. Better experiences.</Text>
              </View>
            )}
            <View style={s.featureBody}>
              <Text style={[s.featureTitle, { color: colors.text }]} numberOfLines={1}>{featuredName}</Text>
              <Text style={[s.featureLocation, { color: colors.muted }]} numberOfLines={1}>{featuredPlace || "Explore our handpicked stays"}</Text>
              <Text style={[s.featurePrice, { color: colors.gold }]}>{featuredPrice}</Text>
            </View>
          </Pressable>
        </Link>
        <View style={{ height: 12 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 5, paddingBottom: 24 },
  topbar: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  logoBadge: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#123D2B", alignItems: "center", justifyContent: "center", shadowColor: "#123D2B", shadowOpacity: 0.18, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 3 },\n  logo: { width: 39, height: 39 },
  eyebrow: { fontSize: 8, fontWeight: "800", letterSpacing: 1.4 },
  brandName: { fontSize: 16, fontWeight: "900", marginTop: 2 },
  topActions: { flexDirection: "row", gap: 8 },
  iconButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  intro: { marginBottom: 15 },
  heading: { fontSize: 23, lineHeight: 29, fontWeight: "900", letterSpacing: -0.6 },
  subheading: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  search: { minHeight: 52, borderRadius: 15, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 9, marginBottom: 23 },
  searchInput: { flex: 1, fontSize: 11, paddingHorizontal: 7, paddingVertical: 11 },
  searchGo: { borderRadius: 11, paddingHorizontal: 13, paddingVertical: 9 },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 11, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "900", letterSpacing: -0.2 },
  sectionHint: { fontSize: 9, marginTop: 3 },
  serviceGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 9, marginBottom: 20 },
  serviceTile: { width: "48.7%", minHeight: 116, borderRadius: 17, borderWidth: 1, padding: 12, flexDirection: "column", justifyContent: "center", shadowColor: "#123D2B", shadowOpacity: 0.045, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  serviceIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  serviceTitle: { fontSize: 12, fontWeight: "900" },
  serviceCaption: { fontSize: 9, marginTop: 3 },
  quickPanel: { borderRadius: 17, borderWidth: 1, paddingVertical: 13, paddingHorizontal: 6, flexDirection: "row", justifyContent: "space-around", marginBottom: 21, shadowColor: "#123D2B", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  quickItem: { alignItems: "center", flex: 1, gap: 5 },
  quickIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 9, fontWeight: "700" },
  seeAll: { fontSize: 10, fontWeight: "900" },
  featureCard: { borderRadius: 17, borderWidth: 1, overflow: "hidden", shadowColor: "#123D2B", shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  featureImage: { height: 150, justifyContent: "flex-start", padding: 11 },
  featureImageStyle: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  featurePill: { alignSelf: "flex-start", borderRadius: 20, backgroundColor: "rgba(9,26,20,0.78)", paddingHorizontal: 10, paddingVertical: 6 },
  featurePillText: { color: "#E2C47D", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  featureFallback: { alignItems: "center", justifyContent: "center", gap: 8 },
  fallbackTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  featureBody: { padding: 12 },
  featureTitle: { fontSize: 13, fontWeight: "900" },
  featureLocation: { fontSize: 10, marginTop: 4 },
  featurePrice: { fontSize: 11, fontWeight: "900", marginTop: 8 },
});
