import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/src/theme/ThemeProvider";

const VERIFICATION_PAGE = "https://sourcestays.com.ng/verify.html";

export default function GuestVerificationScreen() {
  const { colors } = useAppTheme();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function continueToVerification() {
    const secureToken = token.trim();
    setMessage("");
    if (!secureToken) {
      setMessage("Enter the secure verification reference sent to you by Source Stays.");
      return;
    }
    if (secureToken.length > 512 || /\\s/.test(secureToken)) {
      setMessage("Please check the verification reference and try again.");
      return;
    }
    setBusy(true);
    try {
      const url = VERIFICATION_PAGE + "?token=" + encodeURIComponent(secureToken);
      await Linking.openURL(url);
    } catch {
      setMessage("The secure verification page could not be opened. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Link href="/account" style={s.back}>← My Account</Link>
      <View style={s.hero}>
        <Text style={s.brand}>SOURCE <Text style={{ color: "#D6B66E" }}>STAYS</Text></Text>
        <Text style={s.heading}>Guest verification</Text>
        <Text style={s.copy}>Complete the identity verification linked to your booking using the secure reference sent to you by our team.</Text>
      </View>
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={s.title}>Open your secure verification form</Text>
        <Text style={s.body}>Enter the verification reference from your Source Stays message. Your details and ID document will be submitted through the existing secure website form.</Text>
        <Text style={s.label}>SECURE VERIFICATION REFERENCE</Text>
        <TextInput
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Paste your verification reference"
          placeholderTextColor="#899188"
          style={s.input}
          editable={!busy}
        />
        <Pressable onPress={continueToVerification} disabled={busy} style={[s.button, busy && { opacity: 0.65 }]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Continue to secure form</Text>}
        </Pressable>
        {!!message && <Text style={s.error}>{message}</Text>}
      </View>
      <View style={s.notice}>
        <Text style={s.noticeTitle}>Your information stays protected</Text>
        <Text style={s.body}>The verification form accepts JPG, PNG, WEBP or PDF files up to 8 MB. Your ID document is uploaded using a secure, booking-specific upload process to private storage. The mobile app does not store or expose your ID document.</Text>
      </View>
      <Text style={s.footer}>SOURCE STAYS · LAGOS, NIGERIA</Text>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  back: { color: "#123D2B", fontWeight: "800", marginBottom: 18 },
  hero: { backgroundColor: "#123D2B", borderRadius: 18, padding: 22, marginBottom: 16 },
  brand: { color: "#fff", fontSize: 17, fontWeight: "900", letterSpacing: 1.2 },
  heading: { color: "#fff", fontSize: 25, fontWeight: "900", marginTop: 18 },
  copy: { color: "#E0E8E1", fontSize: 12, lineHeight: 19, marginTop: 8 },
  card: { backgroundColor: "#fff", borderRadius: 15, padding: 18, borderWidth: 1, borderColor: "#E6E7DF" },
  title: { color: "#173E2D", fontSize: 19, fontWeight: "900" },
  body: { color: "#69736B", fontSize: 12, lineHeight: 19, marginTop: 9 },
  label: { color: "#A77D31", fontSize: 10, fontWeight: "900", letterSpacing: 0.8, marginTop: 20, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: "#DDE1D8", borderRadius: 9, padding: 13, color: "#173E2D", fontSize: 13 },
  button: { backgroundColor: "#123D2B", borderRadius: 10, padding: 15, alignItems: "center", justifyContent: "center", minHeight: 49, marginTop: 15 },
  buttonText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  error: { color: "#A33A2A", fontSize: 12, lineHeight: 18, marginTop: 12 },
  notice: { backgroundColor: "#FFF8E8", borderColor: "#EAD9A0", borderWidth: 1, borderRadius: 12, padding: 15, marginTop: 16 },
  noticeTitle: { color: "#674E1F", fontSize: 13, fontWeight: "900" },
  footer: { color: "#858B84", fontSize: 10, textAlign: "center", marginTop: 22 }
});
