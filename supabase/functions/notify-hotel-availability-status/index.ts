import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, ch =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch] as string));

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL") || "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("ZYLUS_SUPABASE_SECRET_KEY") || "";
    const publishable = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const resend = Deno.env.get("RESEND_API_KEY") || "";
    if (!url || !service || !publishable || !resend) return json({ error: "Notification service is not configured." }, 503);
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);
    const userClient = createClient(url, publishable, { global: { headers: { Authorization: auth } }, auth: { persistSession: false, autoRefreshToken: false } });
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await userClient.auth.getUser(auth.slice(7));
    if (authError || !authData.user) return json({ error: "Invalid admin session." }, 401);
    const { data: adminRow, error: adminError } = await admin.from("admin_users").select("id").eq("id", authData.user.id).maybeSingle();
    if (adminError) throw adminError;
    if (!adminRow) return json({ error: "Admin access required." }, 403);

    const body = await req.json().catch(() => ({}));
    const requestId = String(body.request_id || "").trim();
    const desiredStatus = String(body.status || "").trim();
    if (!requestId || !["available", "unavailable"].includes(desiredStatus)) return json({ error: "Invalid notification request." }, 400);
    const { data: request, error: reqError } = await admin.from("hotel_availability_requests")
      .select("id,request_ref,property_id,room_category_id,room_category,customer_name,customer_email,customer_phone,check_in,check_out,rooms_requested,guests,status,availability_expires_at")
      .eq("id", requestId).maybeSingle();
    if (reqError) throw reqError;
    if (!request || request.status !== desiredStatus) return json({ error: "Request status changed before notification." }, 409);
    const propertyUrl = "https://sourcestays.com.ng/hotel-booking.html?property_id=" +
      encodeURIComponent(request.property_id) + "&room_id=" + encodeURIComponent(request.room_category_id) +
      "&request_ref=" + encodeURIComponent(request.request_ref);

    if (desiredStatus === "unavailable") {
      if (!request.customer_email) return json({ success: true, email_sent: false, message: "No customer email was provided." });
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: "Bearer " + resend, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Source Stays <bookings@sourcestays.com.ng>", to: [request.customer_email],
          subject: "Update on your Source Stays hotel request " + request.request_ref,
          html: "<p>Hello " + esc(request.customer_name) + ",</p><p>Unfortunately, the selected room is not available for your requested dates. Please contact Source Stays so we can help find an alternative.</p><p>Reference: <strong>" + esc(request.request_ref) + "</strong></p><p>Source Stays</p>"
        })
      });
      if (!response.ok) return json({ error: "Could not send customer email notification.", email_sent: false }, 502);
      return json({ success: true, email_sent: true });
    }

    const expiry = request.availability_expires_at ? new Date(request.availability_expires_at).getTime() : 0;
    if (!expiry || expiry <= Date.now()) return json({ error: "Availability confirmation has already expired." }, 409);
    if (!request.customer_email) return json({ success: true, email_sent: false, payment_url: propertyUrl, message: "No customer email was provided." });
    const { data: room, error: roomError } = await admin.from("hotel_room_categories_public")
      .select("customer_rate").eq("id", request.room_category_id).eq("property_id", request.property_id).maybeSingle();
    if (roomError) throw roomError;
    const nights = Math.max(1, Math.round((new Date(request.check_out + "T00:00:00Z").getTime() - new Date(request.check_in + "T00:00:00Z").getTime()) / 86400000));
    const rooms = Number(request.rooms_requested);
    const accommodation = Number(room?.customer_rate || 0) * nights * rooms;
    const caution = 20000 * rooms;
    const total = accommodation + caution;
    const expiresText = new Date(expiry).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: "Bearer " + resend, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Source Stays <bookings@sourcestays.com.ng>", to: [request.customer_email],
        subject: "Good news — your room is available | Source Stays",
        html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#26332d;line-height:1.6"><h2 style="color:#123f32">Good news, ${esc(request.customer_name)}!</h2><p>The room you requested is available for your dates.</p><p><strong>Request reference:</strong> ${esc(request.request_ref)}<br><strong>Room:</strong> ${esc(request.room_category)}<br><strong>Dates:</strong> ${esc(request.check_in)} to ${esc(request.check_out)} (${nights} night(s))<br><strong>Rooms:</strong> ${rooms}</p><h3>Payment summary</h3><p>Accommodation: ₦${accommodation.toLocaleString("en-NG")}<br>Refundable caution fee: ₦${caution.toLocaleString("en-NG")}<br><strong>Total: ₦${total.toLocaleString("en-NG")}</strong></p><p>Your room availability has been confirmed. You can review your request and proceed securely whenever you are ready. If you need more time, that is absolutely fine. Room availability can change, so please contact Source Stays to reconfirm before making payment if you return later.</p><p><a href="${esc(propertyUrl)}" style="display:inline-block;background:#123f32;color:#fff;padding:13px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Review your request</a></p><p>If the button does not open, copy this link: ${esc(propertyUrl)}</p><p>The hotel's identity and exact address will be shared only after payment is verified and the hotel confirms your reservation.</p><p>Thank you for choosing Source Stays.</p></div>`
      })
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Resend availability notification failed:", detail);
      return json({ error: "Email notification delivery failed.", email_sent: false }, 502);
    }
    return json({ success: true, email_sent: true, payment_url: propertyUrl, expires_at: request.availability_expires_at });
  } catch (error) {
    console.error("Hotel availability customer notification error:", error);
    return json({ error: error instanceof Error ? error.message : "Notification failed." }, 500);
  }
});
