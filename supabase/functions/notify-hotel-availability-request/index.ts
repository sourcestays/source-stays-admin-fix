import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch] as string));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("ZYLUS_SUPABASE_SECRET_KEY");
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceKey || !publishableKey) {
      throw new Error("Required Supabase server configuration is missing.");
    }
    if (!resendKey) {
      console.error("Hotel request email: RESEND_API_KEY is not configured.");
      return json({ success: false, email_sent: false, error: "Email service is not configured." }, 503);
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return json({ error: "Authentication required." }, 401);
    }

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = authorization.slice("Bearer ".length);
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) return json({ error: "Your login session is invalid." }, 401);

    const body = await req.json();
    const requestRef = String(body.request_ref || "").trim();
    if (!/^SSR-[A-F0-9]{10}$/i.test(requestRef)) {
      return json({ error: "Invalid hotel request reference." }, 400);
    }

    const { data: request, error: requestError } = await adminClient
      .from("hotel_availability_requests")
      .select("request_ref,property_id,room_category,check_in,check_out,rooms_requested,guests,customer_name,customer_email,customer_phone,customer_note,status,created_at,customer_user_id")
      .eq("request_ref", requestRef)
      .eq("customer_user_id", user.id)
      .maybeSingle();

    if (requestError) throw requestError;
    if (!request) return json({ error: "Hotel request not found." }, 404);

    const { data: property, error: propertyError } = await adminClient
      .from("properties")
      .select("location")
      .eq("id", request.property_id)
      .maybeSingle();
    if (propertyError) throw propertyError;

    const { data: room, error: roomError } = await adminClient
      .from("hotel_room_categories_public")
      .select("customer_rate")
      .eq("property_id", request.property_id)
      .eq("room_name", request.room_category)
      .maybeSingle();
    if (roomError) throw roomError;

    const nights = Math.max(0, Math.round(
      (new Date(request.check_out + "T00:00:00Z").getTime() -
       new Date(request.check_in + "T00:00:00Z").getTime()) / 86400000
    ));
    const roomCount = Number(request.rooms_requested || 1);
    const rate = Number(room?.customer_rate || 0);
    const accommodation = rate * nights * roomCount;
    const caution = 20000 * roomCount;
    const naira = (value: number) => "₦" + value.toLocaleString("en-NG");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#26332d;line-height:1.6">
        <h2 style="color:#123f32">Source Stays — New Hotel Availability Request</h2>
        <p>A customer has submitted a hotel room availability request.</p>
        <p style="font-size:20px;font-weight:bold;color:#123f32">${escapeHtml(request.request_ref)}</p>
        <h3>Customer details</h3>
        <p><strong>Name:</strong> ${escapeHtml(request.customer_name)}<br>
        <strong>Phone / WhatsApp:</strong> ${escapeHtml(request.customer_phone)}<br>
        <strong>Email:</strong> ${escapeHtml(request.customer_email || "Not provided")}</p>
        <h3>Room request</h3>
        <p><strong>Room category:</strong> ${escapeHtml(request.room_category)}<br>
        <strong>Area:</strong> ${escapeHtml(property?.location || "Not available")}<br>
        <strong>Check-in:</strong> ${escapeHtml(request.check_in)}<br>
        <strong>Check-out:</strong> ${escapeHtml(request.check_out)}<br>
        <strong>Nights:</strong> ${nights}<br>
        <strong>Rooms:</strong> ${roomCount}<br>
        <strong>Total guests:</strong> ${Number(request.guests || 0)}</p>
        <h3>Estimated customer pricing</h3>
        <p><strong>Accommodation:</strong> ${naira(accommodation)}<br>
        <strong>Refundable caution fee:</strong> ${naira(caution)}<br>
        <strong>Estimated total:</strong> ${naira(accommodation + caution)}</p>
        <p><strong>Customer note:</strong> ${escapeHtml(request.customer_note || "None")}</p>
        <p><strong>Status:</strong> Awaiting hotel availability confirmation</p>
        <p style="color:#66736b;font-size:13px">No payment has been taken. Confirm availability with the hotel before issuing payment instructions. Caution fee is refundable after checkout, subject to inspection and no damage.</p>
      </div>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Source Stays <bookings@sourcestays.com.ng>",
        to: ["sourcestays@gmail.com"],
        subject: "New Hotel Request " + request.request_ref + " — " + request.room_category,
        html,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("Resend hotel request email failed:", details);
      return json({ success: false, email_sent: false, error: "Email delivery failed." }, 502);
    }

    return json({ success: true, email_sent: true, request_ref: request.request_ref });
  } catch (error) {
    console.error("Hotel request email error:", error);
    return json({ success: false, email_sent: false, error: error instanceof Error ? error.message : "Email notification failed." }, 500);
  }
});
