import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemeMode = "system" | "light" | "dark";
const palettes = {
  light: {
    background: "#F2F3EC", surface: "#FFFEFA", surfaceAlt: "#E7EEE7",
    text: "#123D2B", muted: "#617267", border: "#D8E1D8",
    primary: "#123D2B", primaryText: "#FFFFFF", gold: "#B58A3B",
    goldText: "#173B2B", hero: "#0C2D22", heroText: "#FFFFFF",
    input: "#FFFEFA", success: "#19764D", shadow: "#132B20",
  },
  dark: {
    background: "#091A14", surface: "#10271D", surfaceAlt: "#183629",
    text: "#F4F1E8", muted: "#B1BDB4", border: "#294638",
    primary: "#D6B66E", primaryText: "#10271D", gold: "#E2C47D",
    goldText: "#10271D", hero: "#071C14", heroText: "#F8F5EC",
    input: "#10271D", success: "#7DC69A", shadow: "#000000",
  },
};
type Palette = typeof palettes.light;
type ThemeContextValue = { mode: ThemeMode; setMode: (mode: ThemeMode) => void; isDark: boolean; colors: Palette };
const ThemeContext = createContext<ThemeContextValue>({
  mode: "system", setMode: () => undefined, isDark: false, colors: palettes.light,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  useEffect(() => {
    SecureStore.getItemAsync("source-stays-theme").then(value => {
      if (value === "light" || value === "dark" || value === "system") setModeState(value);
    }).catch(() => undefined);
  }, []);
  const setMode = (next: ThemeMode) => {
    setModeState(next);
    SecureStore.setItemAsync("source-stays-theme", next).catch(() => undefined);
  };
  const isDark = mode === "dark" || (mode === "system" && system === "dark");
  const value = useMemo(() => ({ mode, setMode, isDark, colors: isDark ? palettes.dark : palettes.light }), [mode, isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useAppTheme() { return useContext(ThemeContext); }
