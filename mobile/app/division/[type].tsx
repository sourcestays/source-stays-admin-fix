import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { SectionIcon } from "@/src/components/SectionIcon";

type Listing = {
  id: number; title: string; public_title: string | null; category: string;
  price: number | null; price_period: string | null; location: string | null;
  public_location: string | null; bedrooms: number | null; guests: number | null;
  amenities: string | null; image_url: string | null; featured: boolean | null;
  owner_identity_verified: boolean | null; physical_inspection_verified: boolean | null;
  hide_partner_identity: boolean | null;
};

const labels: Record<string, string> = { shortlet: "Shortlets", hotel: "Hotels", realestate: "Real Estate" };
const filters = [
  { value: "all", label: "All" },
  { value: "sale", label: "For sale" },
  { value: "land", label: "Land" },
  { value: "rent", label: "For rent" },
];

export default function DivisionScreen() {
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams<{ type: string; q?: string }>();
  const type = String(params.type || "shortlet");
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(String(params.q || ""));
  const [filter, setFilter] = useState("all");
  const [startingPrices, setStartingPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      if (!supabase) {
        setError("Connect the Source Stays Supabase environment to load live listings.");
        setLoading(false);
        return;
      }
      let query = supabase.from("properties")
        .select("id,title,public_title,category,price,price_period,location,public_location,bedrooms,guests,amenities,image_url,featured,published,owner_identity_verified,physical_inspection_verified,hide_partner_identity")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("id", { ascending: false });
      if (type === "realestate") {
        if (filter !== "all") query = query.eq("category", filter);
        else query = query.in("category", ["sale", "land", "rent"]);
      } else query = query.eq("category", type);
      const { data, error: queryError } = await query;
      if (!active) return;
      if (queryError) {
        setError("Unable to load listings right now. Please try again later.");
      } else {
        const rows = (data || []) as Listing[];
        setItems(rows);
        const hotelIds = rows.filter(p => p.category === "hotel").map(p => p.id);
        const packageIds = rows.filter(p => p.category !== "hotel" && Number(p.price) <= 0).map(p => p.id);
        const [hotelRates, packageRates] = await Promise.all([
          hotelIds.length ? supabase.from("hotel_room_categories_public").select("property_id,customer_rate").in("property_id", hotelIds) : Promise.resolve({ data: [], error: null }),
          packageIds.length ? supabase.from("villa_packages_public").select("property_id,customer_rate").in("property_id", packageIds) : Promise.resolve({ data: [], error: null })
        ]);
        if (!active) return;
        const prices: Record<string, number> = {};
        (hotelRates.data || []).forEach((row: any) => {
          const key = String(row.property_id), value = Number(row.customer_rate);
          if (Number.isFinite(value) && value > 0) prices[key] = prices[key] ? Math.min(prices[key], value) : value;
        });
        (packageRates.data || []).forEach((row: any) => {
          const key = String(row.property_id), value = Number(row.customer_rate);
          if (Number.isFinite(value) && value > 0) prices[key] = prices[key] ? Math.min(prices[key], value) : value;
        });
        setStartingPrices(prices);
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [type, filter]);

  const visible = useMemo(() => {
    const term = location.trim().toLowerCase();
    if (!term) return items;
    return items.filter(p => [p.title, p.public_title, p.location, p.public_location]
      .some(value => String(value || "").toLowerCase().includes(term)));
  }, [items, location]);

  const title = labels[type] || "Source Stays";
  const iconName = type === "hotel" ? "hotels" : type === "realestate" ? "realestate" : "shortlets";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title, headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Link href="/" style={[styles.back, { color: colors.gold }]}>←  Source Stays</Link>
        <View style={styles.headingRow}>
          <SectionIcon name={iconName} size={21} color={colors.gold} background={isDark ? "#294638" : "#F5F0E4"} />
          <View style={styles.headingCopy}>
            <Text style={[styles.eyebrow, { color: colors.gold }]}>DISCOVER WITH SOURCE STAYS</Text>
            <Text style={[styles.heading, { color: colors.text }]}>{title}</Text>
          </View>
        </View>
        <Text style={[styles.sub, { color: colors.muted }]}>Explore available opportunities from our published listings.</Text>

        {type === "realestate" && (
          <Link href="/recb" asChild>
            <Pressable style={[styles.recbBanner, { backgroundColor: colors.hero, borderColor: colors.border }]}>
              <Text style={[styles.recbEyebrow, { color: colors.gold }]}>SOURCE STAYS × ZYLUS GROUP</Text>
              <Text style={[styles.recbTitle, { color: colors.heroText }]}>Real Estate Cashback (RECB)</Text>
              <Text style={[styles.recbCopy, { color: isDark ? colors.muted : "#E0E8E1" }]}>Explore the programme, consultant details and official registration guidance →</Text>
            </Pressable>
          </Link>
        )}

        {type === "realestate" && (
          <View style={styles.filters}>
            {filters.map(option => {
              const selected = filter === option.value;
              return (
                <Pressable key={option.value} onPress={() => setFilter(option.value)} accessibilityRole="button" accessibilityState={{ selected }}
                  style={[styles.filter, { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border }]}>
                  <Text style={[styles.filterText, { color: selected ? colors.primaryText : colors.muted }]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={[styles.searchWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <SectionIcon name="search" size={16} color={colors.gold} background="transparent" />
          <TextInput value={location} onChangeText={setLocation} placeholder="Filter by location (e.g. Lekki, Ikeja)"
            placeholderTextColor={colors.muted} accessibilityLabel="Filter listings by location" returnKeyType="search"
            style={[styles.search, { color: colors.text }]} />
        </View>

        {!loading && !error && <Text style={[styles.resultCount, { color: colors.muted }]}>
          {visible.length} {visible.length === 1 ? "listing" : "listings"} found
        </Text>}

        {loading ? <ActivityIndicator color={colors.gold} size="large" style={{ marginTop: 40 }} /> :
          error ? <Text style={[styles.message, { color: colors.muted }]}>{error}</Text> :
          visible.length === 0 ? <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SectionIcon name="search" size={24} color={colors.gold} background={colors.surfaceAlt} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No matching listings</Text>
            <Text style={[styles.message, { color: colors.muted }]}>Try another location or check back as new properties are added.</Text>
          </View> :
          <View style={styles.list}>
            {visible.map(item => {
              const hidden = Boolean(item.hide_partner_identity);
              const name = hidden ? (item.public_title || "Luxury Private Getaway") : item.title;
              const place = hidden ? (item.public_location || "Lagos") : (item.location || "Location on request");
              return (
                <Link key={item.id} href={{ pathname: "/property/[id]", params: { id: String(item.id) } }} asChild>
                  <Pressable style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {item.image_url
                      ? <Image source={{ uri: item.image_url }} style={styles.photo} resizeMode="cover" />
                      : <View style={[styles.photo, styles.placeholder, { backgroundColor: colors.surfaceAlt }]}>
                        <Text style={[styles.placeholderText, { color: colors.gold }]}>SOURCE STAYS</Text>
                      </View>}
                    <View style={styles.cardBody}>
                      <View style={styles.cardTop}>
                        <SectionIcon name={iconName} size={17} color={colors.gold} background={isDark ? "#294638" : "#F5F0E4"} />
                        <Text style={[styles.category, { color: colors.gold }]}>{item.category.toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{name}</Text>
                      <Text style={[styles.location, { color: colors.muted }]}>{place}{!hidden && item.bedrooms ? " · " + item.bedrooms + " bedroom(s)" : ""}</Text>
                      {!!item.owner_identity_verified && <Text style={[styles.verified, { color: colors.success }]}>✓ Source Verified</Text>}
                      {!!item.physical_inspection_verified && <Text style={[styles.verified, { color: colors.success }]}>✓ Physical inspection completed</Text>}
                      <Text style={[styles.price, { color: colors.text }]}>
                        {type === "hotel"
                          ? (startingPrices[String(item.id)] ? "From ₦" + startingPrices[String(item.id)].toLocaleString("en-NG") + " / night" : "View room rates")
                          : Number(item.price) > 0
                            ? "₦" + Number(item.price).toLocaleString("en-NG") + " / " + (item.price_period || "night")
                            : startingPrices[String(item.id)]
                              ? "From ₦" + startingPrices[String(item.id)].toLocaleString("en-NG") + " / night"
                              : "Enquire for rates"}
                      </Text>
                      <Text style={[styles.open, { color: colors.gold }]}>View details  ↗</Text>
                    </View>
                  </Pressable>
                </Link>
              );
            })}
          </View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  back: { fontWeight: "800", marginBottom: 23 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headingCopy: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.6 },
  heading: { fontSize: 30, fontWeight: "900", marginTop: 5, letterSpacing: -0.6 },
  sub: { fontSize: 13, lineHeight: 20, marginTop: 9, marginBottom: 18 },
  recbBanner: { borderRadius: 17, borderWidth: 1, padding: 17, marginBottom: 16 },
  recbEyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  recbTitle: { fontSize: 17, fontWeight: "900", marginTop: 7 },
  recbCopy: { fontSize: 11, lineHeight: 17, marginTop: 6 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  filter: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  filterText: { fontSize: 11, fontWeight: "800" },
  searchWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, marginBottom: 12 },
  search: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, fontSize: 12 },
  resultCount: { fontSize: 10, fontWeight: "700", marginBottom: 12 },
  list: { gap: 15 },
  card: { borderRadius: 18, overflow: "hidden", borderWidth: 1 },
  photo: { width: "100%", height: 190, backgroundColor: "#E9ECE5" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  placeholderText: { fontWeight: "900", letterSpacing: 2 },
  cardBody: { padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 },
  category: { fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  cardTitle: { fontSize: 17, fontWeight: "900", marginTop: 5 },
  location: { fontSize: 11, marginTop: 5 },
  verified: { fontSize: 10, marginTop: 5, fontWeight: "800" },
  price: { fontSize: 14, fontWeight: "900", marginTop: 12 },
  open: { fontSize: 11, fontWeight: "900", marginTop: 9 },
  emptyState: { alignItems: "center", borderWidth: 1, borderRadius: 18, padding: 22, marginTop: 12 },
  emptyTitle: { fontSize: 15, fontWeight: "900", marginTop: 12 },
  message: { textAlign: "center", padding: 18, lineHeight: 21, fontSize: 12 },
});
