import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Source Stays mobile app is intentionally bound to the MAIN WEBSITE
// production Supabase project. Never point this app at source-stays-testing.
const MAIN_WEBSITE_PROJECT_REF = "mrvckkzwhuoylxycaim";
const MAIN_WEBSITE_SUPABASE_URL = `https://${MAIN_WEBSITE_PROJECT_REF}.supabase.co`;

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isMainWebsiteSupabaseConfigured =
  configuredUrl === MAIN_WEBSITE_SUPABASE_URL && Boolean(supabaseKey);

// Keep the legacy name for existing screens, but it now means the approved
// production project is configured—not merely that some Supabase URL exists.
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

if (__DEV__ && configuredUrl && configuredUrl !== MAIN_WEBSITE_SUPABASE_URL) {
  console.error(
    "Source Stays mobile app is restricted to the main website production Supabase project. The configured backend was not connected."
  );
}
