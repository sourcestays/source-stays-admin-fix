import { useEffect, useState } from "react";
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { SectionIcon } from "@/src/components/SectionIcon";

type FeaturedStay = { id: number; title: string; public_title: string | null; image_url: string | null; public_location: string | null; location: string | null; price: number | null; price_period: string | null; hide_partner_identity: boolean | null };

const categories = [
  { title: "Shortlets", subtitle: "Find your stay", category: "shortlet", icon: "shortlets" },
  { title: "Hotels", subtitle: "Rooms & comfort", category: "hotel", icon: "hotels" },
  { title: "Real Estate", subtitle: "Buy or rent", category: "realestate", icon: "realestate" },
  { title: "Rewards", subtitle: "Your stay benefits", category: "rewards", icon: "rewards" },
];

export default function HomeScreen() {
  const { isDark, colors } = useAppTheme();
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

  const featuredName = featured?.hide_partner_identity ? featured.public_title || "A beautiful place to stay" : featured?.title || "Discover your next stay";
  const featuredPlace = featured?.hide_partner_identity ? featured.public_location : featured?.location;
  const featuredPrice = Number(featured?.price) > 0 ? "₦" + Number(featured?.price).toLocaleString("en-NG") + " / " + (featured?.price_period || "night") : "Explore available stays";

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.topbar}>
          <Image source={require("../assets/source-stays-logo.png")} style={s.logo} resizeMode="contain" accessibilityLabel="Source Stays" />
          <Link href="/account" asChild>
            <Pressable style={[s.profileButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <SectionIcon name="account" size={19} color={colors.gold} background="transparent" />
            </Pressable>
          </Link>
        </View>

        <Text style={[s.greeting, { color: colors.muted }]}>LAGOS, NIGERIA</Text>
        <Text style={[s.heading, { color: colors.text }]}>Where to next?</Text>
        <Text style={[s.subheading, { color: colors.muted }]}>Find a stay you'll love, or your next property.</Text>

        <View style={[s.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SectionIcon name="search" size={18} color={colors.gold} background="transparent" />
          <TextInput value={searchTerm} onChangeText={setSearchTerm} placeholder="Search location or property"
            placeholderTextColor={colors.muted} returnKeyType="search" style={[s.searchInput, { color: colors.text }]} />
          <Link href={{ pathname: "/division/[type]", params: { type: "shortlet", q: searchTerm.trim() } }} asChild>
            <Pressable style={[s.searchGo, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryText, fontSize: 11, fontWeight: "900" }}>Go</Text></Pressable>
          </Link>
        </View>

        <View style={s.sectionRow}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Explore</Text>
        </View>
        <View style={s.categoryGrid}>
          {categories.map(item => (
            <Link key={item.category} href={item.category === "rewards" ? "/rewards" : { pathname: "/division/[type]", params: { type: item.category } }} asChild>
              <Pressable style={[s.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[s.categoryIcon, { backgroundColor: isDark ? "#294638" : "#F5F0E4" }]}>
                  <SectionIcon name={item.icon} size={22} color={colors.gold} background="transparent" />
                </View>
                <Text style={[s.categoryTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[s.categorySubtitle, { color: colors.muted }]}>{item.subtitle}</Text>
                <View style={s.arrow}><SectionIcon name="arrow" size={12} color={colors.gold} background="transparent" /></View>
              </Pressable>
            </Link>
          ))}
        </View>

        <View style={s.sectionRow}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Featured stay</Text>
          <Link href={{ pathname: "/division/[type]", params: { type: "shortlet" } }}><Text style={[s.seeAll, { color: colors.gold }]}>See all</Text></Link>
        </View>
        <Link href={featured ? { pathname: "/property/[id]", params: { id: String(featured.id) } } : { pathname: "/division/[type]", params: { type: "shortlet" } }} asChild>
          <Pressable style={[s.featuredCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {featured?.image_url ? (
              <ImageBackground source={{ uri: featured.image_url }} style={s.featuredImage} imageStyle={s.featuredImageStyle}>
                <View style={s.imagePill}><Text style={s.imagePillText}>SOURCE STAYS PICK</Text></View>
              </ImageBackground>
            ) : (
              <View style={[s.featuredImage, s.featuredFallback, { backgroundColor: colors.hero }]}>
                <SectionIcon name="bed" size={35} color="#D6B66E" background="rgba(255,255,255,0.08)" />
                <Text style={s.fallbackTitle}>Thoughtful stays. Better experiences.</Text>
              </View>
            )}
            <View style={s.featuredBody}>
              <Text style={[s.featuredTitle, { color: colors.text }]} numberOfLines={1}>{featuredName}</Text>
              <Text style={[s.featuredLocation, { color: colors.muted }]} numberOfLines={1}>{featuredPlace || "Explore our handpicked stays"}</Text>
              <Text style={[s.featuredPrice, { color: colors.gold }]}>{featuredPrice}</Text>
            </View>
          </Pressable>
        </Link>

        <View style={[s.bottomNote, { borderTopColor: colors.border }]}>
          <Text style={[s.bottomNoteText, { color: colors.muted }]}>STAY  ·  DISCOVER  ·  OWN</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 19, paddingTop: 7, paddingBottom: 28 },
  topbar: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  logo: { width: 88, height: 52 },
  profileButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  greeting: { fontSize: 9, fontWeight: "900", letterSpacing: 1.8, marginBottom: 7 },
  heading: { fontSize: 28, lineHeight: 34, fontWeight: "900", letterSpacing: -0.8 },
  subheading: { fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 17 },
  search: { minHeight: 54, borderRadius: 15, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, marginBottom: 25 },
  searchInput: { flex: 1, fontSize: 11, paddingHorizontal: 8, paddingVertical: 12 },
  searchGo: { borderRadius: 11, paddingHorizontal: 15, paddingVertical: 10 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "900", letterSpacing: -0.3 },
  seeAll: { fontSize: 10, fontWeight: "900" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 26 },
  categoryCard: { width: "48.3%", minHeight: 120, borderRadius: 17, borderWidth: 1, padding: 13, position: "relative" },
  categoryIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  categoryTitle: { fontSize: 13, fontWeight: "900" },
  categorySubtitle: { fontSize: 9, marginTop: 3 },
  arrow: { position: "absolute", right: 9, top: 12 },
  featuredCard: { borderRadius: 19, borderWidth: 1, overflow: "hidden" },
  featuredImage: { height: 166, justifyContent: "flex-start", padding: 12 },
  featuredImageStyle: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  imagePill: { alignSelf: "flex-start", borderRadius: 20, backgroundColor: "rgba(9,26,20,0.78)", paddingHorizontal: 10, paddingVertical: 6 },
  imagePillText: { color: "#E2C47D", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  featuredFallback: { alignItems: "center", justifyContent: "center", gap: 9 },
  fallbackTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  featuredBody: { padding: 14 },
  featuredTitle: { fontSize: 14, fontWeight: "900" },
  featuredLocation: { fontSize: 10, marginTop: 5 },
  featuredPrice: { fontSize: 11, fontWeight: "900", marginTop: 10 },
  bottomNote: { borderTopWidth: 1, marginTop: 22, paddingTop: 16 },
  bottomNoteText: { textAlign: "center", fontSize: 8, letterSpacing: 2, fontWeight: "800" },
});
