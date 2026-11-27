import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useAppTheme } from "@/src/theme/ThemeProvider";

function AppNavigator() {
  const { isDark, colors } = useAppTheme();
  return <>
    <StatusBar style={isDark ? "light" : "dark"} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
  </>;
}
export default function RootLayout() {
  return <ThemeProvider><AppNavigator /></ThemeProvider>;
}
