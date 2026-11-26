import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/src/lib/supabase";

type Entry = { amount: number; entry_type: string; note: string | null; created_at: string };

function creditEffect(type: string, amount: number) {
  if (type === "earn") return amount;
  if (type === "redeem") return -amount;
  if (type === "adjustment") return amount;
  return 0;
}

function entryLabel(type: string) {
  if (type === "earn") return "Credit earned";
  if (type === "redeem") return "Credit redeemed";
  if (type === "adjustment") return "Account adjustment";
  return "Other account activity";
}

function entryAmount(type: string, amount: number) {
  if (type === "earn") return `+${money(amount)}`;
  if (type === "redeem") return `−${money(amount)}`;
  if (type === "adjustment") return `${amount < 0 ? "−" : "+"}${money(Math.abs(amount))}`;
  return "—";
}

function money(value: number) {
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RewardsScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Sign in to view your Source Stays Credits.");

  const loadCredits = useCallback(async () => {
    if (!supabase) {
      setMessage("Connect the Source Stays backend to access rewards.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setEntries([]);
      setBalance(0);
      setMessage("Sign in to view your Source Stays Credits.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("source_stays_credit_ledger")
      .select("amount,entry_type,note,created_at")
      .eq("customer_user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      setMessage("Your rewards history is temporarily unavailable.");
    } else {
      const rows = (data || []) as Entry[];
      setEntries(rows);
      setBalance(rows.reduce((sum, row) => sum + creditEffect(row.entry_type, Number(row.amount)), 0));
      setMessage(rows.length ? "Your rewards activity" : "No rewards activity yet. Eligible completed stays can earn credits.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadCredits(); }, [loadCredits]);

  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.content}>
      <Link href="/" style={s.back}>← Source Stays</Link>
      <Text style={s.eyebrow}>SOURCE STAYS REWARDS</Text>
      <Text style={s.heading}>Your stays bring rewards.</Text>
      <View style={s.balance}>
        <Text style={s.balanceLabel}>AVAILABLE CREDIT</Text>
        <Text style={s.amount}>{money(balance)}</Text>
        <Text style={s.balanceHint}>Calculated using the same earn, redeem and adjustment rules as the Source Stays website.</Text>
      </View>
      <View style={s.sectionRow}>
        <Text style={s.section}>Credit history</Text>
        <Pressable onPress={loadCredits} disabled={loading} accessibilityRole="button">
          <Text style={s.refresh}>{loading ? "Loading…" : "Refresh"}</Text>
        </Pressable>
      </View>
      {loading ? <ActivityIndicator color="#123D2B" style={{ marginTop: 25 }} /> : entries.length ? entries.map((entry, index) =>
        <View key={`${entry.created_at}-${index}`} style={s.entry}>
          <View style={{ flex: 1 }}>
            <Text style={s.entryTitle}>{entryLabel(entry.entry_type)}</Text>
            <Text style={s.note}>{entry.note || "Source Stays Credits"}</Text>
            <Text style={s.note}>{new Date(entry.created_at).toLocaleDateString("en-NG")}</Text>
          </View>
          <Text style={[s.entryAmount, entry.entry_type === "redeem" && s.redeemed]}>
            {entryAmount(entry.entry_type, Number(entry.amount))}
          </Text>
        </View>
      ) : <Text style={s.message}>{message}</Text>}
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F7F2" },
  content: { padding: 20, paddingBottom: 40 },
  back: { color: "#123D2B", fontWeight: "700", marginBottom: 25 },
  eyebrow: { color: "#A77D31", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  heading: { color: "#123D2B", fontSize: 28, fontWeight: "900", marginTop: 8 },
  balance: { backgroundColor: "#123D2B", padding: 22, borderRadius: 18, marginTop: 23 },
  balanceLabel: { color: "#D6B66E", fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  amount: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 8 },
  balanceHint: { color: "#E0E8E1", fontSize: 10, marginTop: 8, lineHeight: 16 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 28, marginBottom: 12 },
  section: { fontSize: 18, color: "#173E2D", fontWeight: "900" },
  refresh: { color: "#247343", fontSize: 12, fontWeight: "800" },
  entry: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  entryTitle: { fontSize: 13, color: "#173E2D", fontWeight: "800" },
  note: { fontSize: 10, color: "#747B73", marginTop: 4 },
  entryAmount: { fontSize: 13, fontWeight: "900", color: "#247343" },
  redeemed: { color: "#8B4C32" },
  message: { fontSize: 12, color: "#747B73", lineHeight: 20, marginTop: 10 }
});
