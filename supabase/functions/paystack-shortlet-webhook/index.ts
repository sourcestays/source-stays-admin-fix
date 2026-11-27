import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function sha512Hmac(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async req => {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  try {
    const secret = Deno.env.get("PAYSTACK_SECRET_KEY")?.trim() || "";
    const url = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("ZYLUS_SUPABASE_SECRET_KEY") || "";
    if (!secret || !url || !serviceKey) {
      console.error("Shortlet Paystack webhook is missing server configuration.");
      return json({ error: "Webhook is not configured." }, 503);
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";
    const expected = await sha512Hmac(secret, rawBody);
    if (!signature || !constantTimeEqual(signature.toLowerCase(), expected)) {
      return json({ error: "Invalid webhook signature." }, 401);
    }

    const event = JSON.parse(rawBody);
    if (event?.event !== "charge.success") return json({ received: true, ignored: true });

    const reference = String(event?.data?.reference || "").trim();
    const transactionId = String(event?.data?.id || "").trim();
    if (!reference || !transactionId) return json({ error: "Missing Paystack transaction details." }, 400);

    // Verify directly with Paystack; the signed webhook alone never settles a booking.
    const verifyResponse = await fetch(
      "https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference),
      { headers: { Authorization: "Bearer " + secret } },
    );
    const verified = await verifyResponse.json().catch(() => null);
    if (!verifyResponse.ok || !verified?.status || verified?.data?.status !== "success") {
      return json({ error: "Paystack verification is not yet successful." }, 502);
    }
    const paid = verified.data;
    if (String(paid.reference) !== reference || String(paid.id) !== transactionId ||
        String(paid.currency) !== "NGN" || Number(paid.amount) <= 0) {
      return json({ error: "Paystack transaction details do not match." }, 409);
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: tx, error: txError } = await admin
      .from("shortlet_payment_transactions")
      .select("id,booking_id,customer_user_id,reference,amount,currency,gateway,status")
      .eq("reference", reference)
      .maybeSingle();
    if (txError) throw txError;
    if (!tx || tx.gateway !== "paystack") return json({ received: true, ignored: true });

    const eventId = "charge.success:" + transactionId + ":" + reference;
    const { data: priorEvent, error: priorError } = await admin
      .from("shortlet_paystack_webhook_events")
      .select("event_id,processed_at")
      .eq("event_id", eventId)
      .maybeSingle();
    if (priorError) throw priorError;
    if (priorEvent?.processed_at) return json({ received: true, duplicate: true });

    if (!priorEvent) {
      const { error: eventInsertError } = await admin
        .from("shortlet_paystack_webhook_events")
        .insert({
          event_id: eventId,
          reference,
          event_type: "charge.success",
          payload: event,
        });
      if (eventInsertError && !String(eventInsertError.code || "").includes("23505")) {
        throw eventInsertError;
      }
    }

    if (Math.round(Number(tx.amount) * 100) !== Number(paid.amount) ||
        String(tx.currency) !== "NGN") {
      await admin.from("shortlet_paystack_webhook_events")
        .update({ processed_at: new Date().toISOString() }).eq("event_id", eventId);
      console.error("Shortlet webhook amount mismatch for reference:", reference);
      return json({ received: true, review_required: true });
    }

    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id,customer_user_id,amount_due,currency,payment_request_status")
      .eq("id", tx.booking_id)
      .eq("customer_user_id", tx.customer_user_id)
      .maybeSingle();
    if (bookingError) throw bookingError;

    if (!booking ||
        String(booking.payment_request_status || "").toLowerCase() !== "requested" ||
        String(booking.currency || "NGN").toUpperCase() !== "NGN" ||
        Math.round(Number(booking.amount_due) * 100) !== Math.round(Number(tx.amount) * 100)) {
      await admin.from("shortlet_paystack_webhook_events")
        .update({ processed_at: new Date().toISOString() }).eq("event_id", eventId);
      console.error("Shortlet webhook requires booking reconciliation:", reference);
      return json({ received: true, review_required: true });
    }

    const { data: updatedTx, error: updateTxError } = await admin
      .from("shortlet_payment_transactions")
      .update({
        status: "paid",
        gateway_transaction_id: transactionId,
        gateway_response: paid,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", tx.id)
      .select("id")
      .maybeSingle();
    if (updateTxError) throw updateTxError;
    if (!updatedTx) throw new Error("Could not mark shortlet transaction as paid.");

    const { data: updatedBooking, error: updateBookingError } = await admin
      .from("bookings")
      .update({ payment_status: "paid" })
      .eq("id", tx.booking_id)
      .eq("customer_user_id", tx.customer_user_id)
      .select("id")
      .maybeSingle();
    if (updateBookingError) throw updateBookingError;
    if (!updatedBooking) throw new Error("Could not update the shortlet booking payment status.");

    const { error: markEventError } = await admin
      .from("shortlet_paystack_webhook_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("event_id", eventId);
    if (markEventError) throw markEventError;

    return json({ received: true, paid: true });
  } catch (error) {
    console.error("Shortlet Paystack webhook error:", error);
    return json({ error: "Unable to process webhook. Paystack may retry delivery." }, 500);
  }
});
