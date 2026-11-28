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
  category: string;
  image_url: string | null;
  public_location: string | null;
  location: string | null;
  price: number | null;
  price_period: string | null;
  hide_partner_identity: boolean | null;
};

const featuredGroups = [
  { key: "villa", title: "Villas", caption: "Private escapes", categories: ["villa"], fallback: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=85" },
  { key: "shortlet", title: "Shortlets", caption: "Feel at home", categories: ["shortlet"], fallback: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900&q=85" },
  { key: "hotel", title: "Hotels", caption: "Rest in comfort", categories: ["hotel"], fallback: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&q=85" },
  { key: "realestate", title: "Real estate", caption: "Find your next property", categories: ["sale", "land", "rent"], fallback: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=85" },
];

const primaryServices = [
  { title: "Shortlets", caption: "Apartments & villas", type: "shortlet", icon: "shortlets" },
  { title: "Hotels", caption: "Rooms & getaways", type: "hotel", icon: "hotels" },
  { title: "Real estate", caption: "Buy, rent or invest", type: "realestate", icon: "realestate" },
  { title: "Rewards", caption: "Earn stay benefits", type: "rewards", icon: "rewards" },
];

export default function HomeScreen() {
  const { isDark, colors, mode, setMode } = useAppTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [featured, setFeatured] = useState<FeaturedStay[]>([]);

  useEffect(() => {
    let active = true;
    async function loadFeatured() {
      if (!supabase) return;
      const { data, error } = await supabase.from("properties")
        .select("id,title,public_title,category,image_url,public_location,location,price,price_period,hide_partner_identity")
        .eq("published", true)
        .in("category", ["villa", "shortlet", "hotel", "sale", "land", "rent"])
        .order("featured", { ascending: false })
        .order("id", { ascending: false })
        .limit(60);
      if (error) console.warn("[Source Stays] Featured properties could not be loaded:", error.message);
      if (active && data) setFeatured(data as FeaturedStay[]);
    }
    loadFeatured();
    return () => { active = false; };
  }, []);

  const getFeaturedProperty = (group: typeof featuredGroups[number]) =>
    featured.find(item => group.categories.includes(item.category) && !!item.image_url)
    || featured.find(item => group.categories.includes(item.category))
    || null;

  const displayProperty = (item: FeaturedStay | null, group: typeof featuredGroups[number]) => ({
    name: item?.hide_partner_identity ? item.public_title || group.title : item?.title || group.title,
    place: item?.hide_partner_identity ? item.public_location : item?.location,
    price: Number(item?.price) > 0
      ? "₦" + Number(item?.price).toLocaleString("en-NG") + " / " + (item?.price_period || "night")
      : group.caption,
    image: item?.image_url || group.fallback,
  });

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
            <Text style={[s.sectionTitle, { color: colors.text }]}>Featured stays</Text>
            <Text style={[s.sectionHint, { color: colors.muted }]}>A little inspiration from every corner of Source Stays</Text>
          </View>
          <Link href={{ pathname: "/division/[type]", params: { type: "shortlet" } }}>
            <Text style={[s.seeAll, { color: colors.gold }]}>Explore</Text>
          </Link>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featureList}>
          {featuredGroups.map(group => {
            const item = getFeaturedProperty(group);
            const card = displayProperty(item, group);
            const href = group.key === "realestate"
              ? { pathname: "/division/[type]" as const, params: { type: "realestate" } }
              : item
                ? { pathname: "/property/[id]" as const, params: { id: String(item.id) } }
                : { pathname: "/division/[type]" as const, params: { type: group.key } };
            return (
              <Link key={group.key} href={href} asChild>
                <Pressable style={[s.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ImageBackground source={{ uri: card.image }} style={s.featureImage} imageStyle={s.featureImageStyle}>
                    <View style={s.featurePill}><Text style={s.featurePillText}>{group.title.toUpperCase()}</Text></View>
                    <View style={s.featureShade} />
                    <View style={s.featureOverlay}>
                      <Text style={s.featureTitle} numberOfLines={1}>{card.name}</Text>
                      <Text style={s.featureLocation} numberOfLines={1}>{card.place || group.caption}</Text>
                      <Text style={s.featurePrice}>{card.price}</Text>
                    </View>
                  </ImageBackground>
                </Pressable>
              </Link>
            );
          })}
        </ScrollView>
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
  logoBadge: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#123D2B", alignItems: "center", justifyContent: "center", shadowColor: "#123D2B", shadowOpacity: 0.18, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  logo: { width: 39, height: 39 },
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
  featureList: { gap: 12, paddingRight: 4, paddingBottom: 8 },
  featureCard: { width: 258, borderRadius: 18, borderWidth: 1, overflow: "hidden", shadowColor: "#123D2B", shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  featureImage: { height: 190, justifyContent: "space-between", padding: 11 },
  featureImageStyle: { borderRadius: 17 },
  featurePill: { alignSelf: "flex-start", borderRadius: 20, backgroundColor: "rgba(9,26,20,0.78)", paddingHorizontal: 10, paddingVertical: 6, zIndex: 2 },
  featurePillText: { color: "#E2C47D", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  featureShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.30)" },
  featureOverlay: { zIndex: 2, marginTop: "auto" },
  featureTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  featureLocation: { color: "rgba(255,255,255,0.88)", fontSize: 10, marginTop: 4 },
  featurePrice: { color: "#F0D58F", fontSize: 11, fontWeight: "900", marginTop: 7 },
});
