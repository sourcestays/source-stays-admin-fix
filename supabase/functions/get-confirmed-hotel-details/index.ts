import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL") || "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("ZYLUS_SUPABASE_SECRET_KEY") || "";
    const publishable = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    if (!url || !service || !publishable) return json({ error: "Booking details service is not configured." }, 503);
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return json({ error: "Sign in to view your booking details." }, 401);
    const userClient = createClient(url, publishable, { global: { headers: { Authorization: auth } }, auth: { persistSession: false, autoRefreshToken: false } });
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await userClient.auth.getUser(auth.slice(7));
    if (authError || !authData.user) return json({ error: "Your session is invalid. Please sign in again." }, 401);
    const body = await req.json().catch(() => ({}));
    const requestRef = String(body.request_ref || "").trim();
    if (!requestRef) return json({ error: "Booking reference is required." }, 400);
    const { data: request, error: requestError } = await admin.from("hotel_availability_requests")
      .select("id,property_id,request_ref,customer_user_id,payment_status,hotel_reservation_confirmed_at,hotel_identity_released_at")
      .eq("request_ref", requestRef).eq("customer_user_id", authData.user.id).maybeSingle();
    if (requestError) throw requestError;
    if (!request) return json({ error: "Booking not found." }, 404);
    if (request.payment_status !== "paid" || !request.hotel_reservation_confirmed_at || !request.hotel_identity_released_at) {
      return json({ confirmed: false, message: "Your hotel details will appear here after the hotel confirms your paid reservation." });
    }
    const { data: property, error: propertyError } = await admin.from("properties")
      .select("title,exact_address,location,partner_id").eq("id", request.property_id).maybeSingle();
    if (propertyError) throw propertyError;
    const { data: partner, error: partnerError } = await admin.from("property_partners")
      .select("partner_name,address,phone").eq("id", property?.partner_id).maybeSingle();
    if (partnerError) throw partnerError;
    return json({
      confirmed: true,
      hotel_name: partner?.partner_name || property?.title || "Hotel",
      hotel_address: property?.exact_address || partner?.address || property?.location || "",
      hotel_phone: partner?.phone || ""
    });
  } catch (error) {
    console.error("Customer hotel detail lookup error:", error);
    return json({ error: error instanceof Error ? error.message : "Could not load hotel details." }, 500);
  }
});
