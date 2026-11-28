import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeProvider, useAppTheme } from "@/src/theme/ThemeProvider";

const ONBOARDING_KEY = "source-stays-onboarding-complete";

function FirstLaunchExperience({ onComplete }: { onComplete: () => void }) {
  return (
    <SafeAreaView style={styles.onboardingSafe}>
      <StatusBar style="light" backgroundColor="#123D2B" />
      <View style={styles.onboarding}>
        <View style={styles.brandMark}>
          <Image source={require("../assets/source-stays-logo.png")} style={styles.logo} resizeMode="contain" accessibilityLabel="Source Stays" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>WELCOME TO SOURCE STAYS</Text>
          <Text style={styles.heading}>A better way to{ "\n" }stay, discover & own.</Text>
          <Text style={styles.description}>
            Discover handpicked shortlets, hotels and real estate opportunities — all in one place.
          </Text>
        </View>
        <View style={styles.bottom}>
          <View style={styles.dots}><View style={styles.activeDot} /><View style={styles.dot} /><View style={styles.dot} /></View>
          <Pressable onPress={onComplete} accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>Get started</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </Pressable>
          <Text style={styles.footer}>STAY  •  DISCOVER  •  OWN</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function AppNavigator() {
  const { isDark, colors } = useAppTheme();
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(ONBOARDING_KEY)
      .then(value => {
        if (!active) return;
        setShowOnboarding(value !== "complete");
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        // If local storage is unavailable, allow the app to open rather than block customers.
        setShowOnboarding(false);
        setReady(true);
      });
    return () => { active = false; };
  }, []);

  const completeOnboarding = async () => {
    try {
      await SecureStore.setItemAsync(ONBOARDING_KEY, "complete");
    } finally {
      setShowOnboarding(false);
    }
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.splash}>
        <StatusBar style="light" backgroundColor="#123D2B" />
        <Image source={require("../assets/source-stays-logo.png")} style={styles.splashLogo} resizeMode="contain" accessibilityLabel="Source Stays" />
      </SafeAreaView>
    );
  }

  if (showOnboarding) return <FirstLaunchExperience onComplete={completeOnboarding} />;

  return <>
    <StatusBar style={isDark ? "light" : "dark"} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
  </>;
}

export default function RootLayout() {
  return <ThemeProvider><AppNavigator /></ThemeProvider>;
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: "#123D2B", alignItems: "center", justifyContent: "center" },
  splashLogo: { width: 190, height: 190 },
  onboardingSafe: { flex: 1, backgroundColor: "#123D2B" },
  onboarding: { flex: 1, paddingHorizontal: 30, paddingTop: 22, paddingBottom: 24, justifyContent: "space-between" },
  brandMark: { alignItems: "center", justifyContent: "center", paddingTop: 18 },
  logo: { width: 190, height: 190 },
  copy: { marginTop: 8, marginBottom: 34 },
  eyebrow: { color: "#D6B66E", fontSize: 10, fontWeight: "900", letterSpacing: 2.5, marginBottom: 18 },
  heading: { color: "#FFFFFF", fontSize: 36, lineHeight: 42, fontWeight: "900", letterSpacing: -1.2 },
  description: { color: "#E0E8E1", fontSize: 15, lineHeight: 24, marginTop: 17, maxWidth: 320 },
  bottom: { gap: 20 },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 },
  activeDot: { width: 24, height: 6, borderRadius: 4, backgroundColor: "#D6B66E" },
  dot: { width: 6, height: 6, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.35)" },
  button: { minHeight: 58, borderRadius: 17, backgroundColor: "#D6B66E", paddingHorizontal: 21, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  buttonPressed: { opacity: 0.82 },
  buttonText: { color: "#123D2B", fontSize: 15, fontWeight: "900" },
  buttonArrow: { color: "#123D2B", fontSize: 23, fontWeight: "700" },
  footer: { color: "#D6B66E", textAlign: "center", fontSize: 9, fontWeight: "800", letterSpacing: 2 },
});
