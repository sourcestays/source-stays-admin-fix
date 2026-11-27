import React from "react";
import { Text, View } from "react-native";

const symbols: Record<string, string> = {
  shortlets: "⌂", hotels: "▦", realestate: "⌑", rewards: "✧",
  search: "⌕", account: "◉", arrow: "↗", bed: "▤", location: "⌖",
  calendar: "▦", shield: "✓", sun: "☼", moon: "☾", system: "◐",
  building: "▥", key: "⚿", gift: "♧",
};
export function SectionIcon({ name, size = 26, color = "#D6B66E", background = "rgba(214,182,110,0.14)" }: {
  name: string; size?: number; color?: string; background?: string;
}) {
  return <View style={{ width: size + 20, height: size + 20, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: background }}>
    <Text style={{ color, fontSize: size, fontWeight: "700", lineHeight: size + 4 }}>{symbols[name] || "•"}</Text>
  </View>;
}
