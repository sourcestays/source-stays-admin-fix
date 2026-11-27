import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const iconNames = {
  shortlets: "home-city-outline",
  hotels: "bed-king-outline",
  realestate: "office-building-outline",
  rewards: "gift-outline",
  search: "magnify",
  account: "account-circle-outline",
  arrow: "arrow-top-right",
  bed: "bed-outline",
  location: "map-marker-outline",
  calendar: "calendar-month-outline",
  shield: "shield-check-outline",
  sun: "white-balance-sunny",
  moon: "moon-waning-crescent",
  system: "theme-light-dark",
  building: "office-building-outline",
  key: "key-outline",
  gift: "gift-outline",
} as const;

type IconName = keyof typeof iconNames;

export function SectionIcon({
  name,
  size = 26,
  color = "#D6B66E",
  background = "rgba(214,182,110,0.14)",
}: {
  name: string;
  size?: number;
  color?: string;
  background?: string;
}) {
  const iconName = iconNames[name as IconName] || "shape-outline";
  return (
    <View
      accessible={false}
      style={{
        width: size + 20,
        height: size + 20,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: background,
      }}
    >
      <MaterialCommunityIcons name={iconName} size={size} color={color} />
    </View>
  );
}
