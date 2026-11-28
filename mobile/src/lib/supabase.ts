import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// The mobile app must use the MAIN WEBSITE production Supabase project only.
const MAIN_WEBSITE_PROJECT_REF = "mrvckkzwhuoylxycaim";
const MAIN_WEBSITE_SUPABASE_URL = `https://${MAIN_WEBSITE_PROJECT_REF}.supabase.co`;

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export type SupabaseConfigurationStatus =
  | "ready"
  | "missing_url"
  | "wrong_project"
  | "missing_publishable_key";

export const supabaseConfigurationStatus: SupabaseConfigurationStatus =
  !configuredUrl
    ? "missing_url"
    : configuredUrl !== MAIN_WEBSITE_SUPABASE_URL
      ? "wrong_project"
      : !supabaseKey
        ? "missing_publishable_key"
        : "ready";

export const supabaseConfigurationMessage: Record<SupabaseConfigurationStatus, string> = {
  ready: "Connected to Source Stays production services.",
  missing_url: "The app cannot find EXPO_PUBLIC_SUPABASE_URL. Check mobile/.env and restart Expo.",
  wrong_project: "The configured Supabase URL is not the approved Source Stays production project. The connection was blocked.",
  missing_publishable_key: "The production URL is set, but EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing. Check mobile/.env and restart Expo.",
};

export const isMainWebsiteSupabaseConfigured = supabaseConfigurationStatus === "ready";
export const isSupabaseConfigured = isMainWebsiteSupabaseConfigured;

export const supabase = isMainWebsiteSupabaseConfigured
  ? createClient(MAIN_WEBSITE_SUPABASE_URL, supabaseKey!, {
      auth: {
        storage: secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

if (__DEV__ && supabaseConfigurationStatus !== "ready") {
  console.warn("[Source Stays] Supabase is not connected:", supabaseConfigurationMessage[supabaseConfigurationStatus]);
}
