
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (ch) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch] as string)
  );

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const url = Deno.env.get("SUPABASE_URL") || "";

    const service =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("ZYLUS_SUPABASE_SECRET_KEY") ||
      "";

    const publishable =
      Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
      "";

    const resend = Deno.env.get("RESEND_API_KEY") || "";

    if (!url || !service || !publishable || !resend) {
      return json(
        { error: "Confirmation service is not configured." },
        503
      );
    }

    const auth = req.headers.get("Authorization") || "";

    if (!auth.startsWith("Bearer ")) {
      return json({ error: "Admin authentication required." }, 401);
    }

    const userClient = createClient(url, publishable, {
      global: { headers: { Authorization: auth } },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const admin = createClient(url, service, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } =
      await userClient.auth.getUser(auth.slice(7));

    if (authError || !authData.user) {
      return json({ error: "Invalid admin session." }, 401);
    }

    const { data: adminRow, error: adminError } = await admin
      .from("admin_users")
      .select("id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (adminError) throw adminError;

    if (!adminRow) {
      return json({ error: "Admin access required." }, 403);
    }

    const body = await req.json().catch(() => ({}));

    const requestId = String(body.request_id || "").trim();
    const checkInInstructions = String(
      body.check_in_instructions || ""
    ).trim();

    if (!requestId) {
      return json({ error: "Hotel request ID is required." }, 400);
    }

    const { data: request, error: requestError } = await admin
      .from("hotel_availability_requests")
      .select(
        "id,request_ref,property_id,customer_name,customer_email,customer_phone,room_category,check_in,check_out,rooms_requested,guests,payment_status,payment_verified_at,hotel_reservation_confirmed_at,hotel_identity_released_at"
      )
      .eq("id", requestId)
      .maybeSingle();

    if (requestError) throw requestError;

    if (!request) {
      return json({ error: "Hotel request not found." }, 404);
    }

    if (
      request.payment_status !== "paid" ||
      !request.payment_verified_at
    ) {
      return json(
        {
          error:
            "This request cannot be confirmed because payment has not been verified.",
        },
        409
      );
    }

    if (
      request.hotel_reservation_confirmed_at &&
      request.hotel_identity_released_at
    ) {
      return json(
        {
          error:
            "This hotel reservation has already been confirmed and released.",
        },
        409
      );
    }

    if (!request.customer_email) {
      return json(
        {
          error:
            "Customer email is missing. Add a valid email before confirming.",
        },
        409
      );
    }

    const { data: property, error: propertyError } = await admin
      .from("properties")
      .select("id,title,exact_address,location,partner_id")
      .eq("id", request.property_id)
      .maybeSingle();

    if (propertyError) throw propertyError;

    if (!property) {
      return json(
        { error: "Linked hotel listing was not found." },
        404
      );
    }

    const { data: partner, error: partnerError } = await admin
      .from("property_partners")
      .select("partner_name,address")
      .eq("id", property.partner_id)
      .maybeSingle();

    if (partnerError) throw partnerError;

    const hotelName = String(
      partner?.partner_name || property.title || ""
    ).trim();

    const hotelAddress = String(
      property.exact_address || partner?.address || ""
    ).trim();

    if (!hotelName || !hotelAddress) {
      return json(
        {
          error:
            "Hotel identity or exact address is missing. Update the hotel listing or partner record before confirming.",
        },
        409
      );
    }

    const confirmedAt = new Date().toISOString();

    const { error: updateError } = await admin
      .from("hotel_availability_requests")
      .update({
        hotel_reservation_confirmed_at: confirmedAt,
        hotel_identity_released_at: confirmedAt,
      })
      .eq("id", requestId)
      .eq("payment_status", "paid");

    if (updateError) throw updateError;

    const dateText = request.check_in + " to " + request.check_out;

    const instructions = checkInInstructions
      ? "<h3>Check-in instructions</h3><p>" +
        esc(checkInInstructions).replace(/\n/g, "<br>") +
        "</p>"
      : "<p>Please contact Source Stays before arrival if you need any check-in assistance.</p>";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#26332d;line-height:1.6">
        <h2 style="color:#123f32">
          Your hotel reservation is confirmed, ${esc(request.customer_name)}!
        </h2>

        <p>Your payment has been verified and the hotel has confirmed your reservation.</p>

        <p>
          <strong>Booking reference:</strong> ${esc(request.request_ref)}<br>
          <strong>Hotel:</strong> ${esc(hotelName)}<br>
          <strong>Address:</strong> ${esc(hotelAddress)}<br>
          <strong>Room:</strong> ${esc(request.room_category)}<br>
          <strong>Dates:</strong> ${esc(dateText)}<br>
          <strong>Rooms:</strong> ${Number(request.rooms_requested)}<br>
          <strong>Guests:</strong> ${Number(request.guests)}
        </p>

        ${instructions}

        <p>Keep this email for your records. Thank you for choosing Source Stays.</p>
      </div>
    `;

    const emailResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + resend,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Source Stays <bookings@sourcestays.com.ng>",
          to: [request.customer_email],
          subject:
            "Your hotel reservation is confirmed | Source Stays",
          html,
        }),
      }
    );

    if (!emailResponse.ok) {
      const detail = await emailResponse.text();

      console.error(
        "Hotel confirmation email failed:",
        detail
      );

      return json({
        success: true,
        confirmed: true,
        email_sent: false,
        warning:
          "Reservation was marked confirmed, but the email could not be delivered. Please resend or contact the customer.",
      });
    }

    return json({
      success: true,
      confirmed: true,
      email_sent: true,
      confirmed_at: confirmedAt,
    });
  } catch (error) {
    console.error(
      "Hotel reservation confirmation error:",
      error
    );

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Hotel confirmation failed.",
      },
      500
    );
  }
});
