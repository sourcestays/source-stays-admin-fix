import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("ZYLUS_SUPABASE_SECRET_KEY");
const publishableKey =
  Deno.env.get("SUPABASE_ANON_KEY") ||
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    if (!supabaseUrl || !serviceKey || !publishableKey) {
      throw new Error("Required Supabase server configuration is missing.");
    }

    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return json({ error: "Authentication required." }, 401);
    }

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

   
const accessToken = authorization.slice("Bearer ".length);

const {
  data: { user },
  error: userError,
} = await userClient.auth.getUser(accessToken);

if (userError || !user) {
  return json({ error: "Your login session is invalid." }, 401);
}

const { data: assurance, error: assuranceError } =
  await userClient.auth.mfa.getAuthenticatorAssuranceLevel(accessToken);

if (
  assuranceError ||
  assurance?.currentLevel !== "aal2"
) {
  console.error("Zylus MFA assurance check:", {
    error: assuranceError?.message,
    currentLevel: assurance?.currentLevel,
    nextLevel: assurance?.nextLevel
  });

  return json({
    error: "Please complete Google Authenticator verification first.",
  }, 403);
}


    const { data: admin, error: adminError } = await adminClient
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return json({ error: "Administrator access denied." }, 403);
    }

    const body = await req.json();

    // Admin-only receipt viewing. The storage bucket remains private;
    // only a short-lived signed URL is returned after the MFA/admin checks above.
    if (body.action === "view_payment_proof") {
      const proofId = String(body.proof_id || "").trim();

      if (!proofId || proofId.length > 100) {
        return json({ error: "Invalid receipt request." }, 400);
      }

      const { data: proof, error: proofError } = await adminClient
        .from("zylus_payment_proofs")
        .select("id,sale_id,storage_path,original_filename,file_type,file_size_bytes,review_status")
        .eq("id", proofId)
        .maybeSingle();

      if (proofError) throw proofError;
      if (!proof) return json({ error: "Receipt not found." }, 404);

      const storagePath = String(proof.storage_path || "");
      const expectedPrefix = String(proof.sale_id || "") + "/";

      if (
        !proof.sale_id ||
        !storagePath ||
        !storagePath.startsWith(expectedPrefix) ||
        storagePath.startsWith("/") ||
        storagePath.includes("..")
      ) {
        return json({ error: "Invalid receipt storage path." }, 400);
      }

      const { data: signed, error: signedError } = await adminClient.storage
        .from("zylus-payment-proofs")
        .createSignedUrl(storagePath, 600);

      if (signedError) throw signedError;

      return json({
        success: true,
        signed_url: signed.signedUrl,
        proof: {
          id: proof.id,
          original_filename: proof.original_filename,
          file_type: proof.file_type,
          file_size_bytes: proof.file_size_bytes,
          review_status: proof.review_status
        }
      });
    }

    if (body.action === "issue_payment_instructions") {
      const saleId = String(body.sale_id || "").trim();
      const bankName = String(body.bank_name || "").trim();
      const accountName = String(body.account_name || "").trim();
      const accountNumber = String(body.account_number || "").replace(/\s/g, "");
      const paymentReference = String(body.payment_reference || "").trim();
      const additionalInstructions = String(body.additional_instructions || "").trim();

      if (
        !saleId ||
        !bankName ||
        !accountName ||
        !/^\d{6,20}$/.test(accountNumber) ||
        bankName.length > 120 ||
        accountName.length > 150 ||
        paymentReference.length > 150 ||
        additionalInstructions.length > 1000
      ) {
        return json({ error: "Please enter valid verified bank details." }, 400);
      }

      const { data: sale, error: saleError } = await adminClient
        .from("zylus_sales")
        .select("id,transaction_ref,property_id,buyer_name,buyer_email,buyer_phone,purchase_amount,payment_status")
        .eq("id", saleId)
        .maybeSingle();

      if (saleError) throw saleError;

      if (!sale || sale.payment_status !== "awaiting_payment") {
        return json({
          error: "This transaction cannot receive new payment instructions."
        }, 400);
      }

      const { data: property, error: propertyError } = await adminClient
        .from("properties")
        .select("title")
        .eq("id", sale.property_id)
        .single();

      if (propertyError) throw propertyError;

      const token = randomToken();
      const tokenHash = await sha256(token);
      const customerLink =
        "https://sourcestays.com.ng/payment-proof.html?ref=" +
        encodeURIComponent(sale.transaction_ref) +
        "&token=" + encodeURIComponent(token);

      const instructionReference = paymentReference || sale.transaction_ref;
      const now = new Date().toISOString();

      const { data: instruction, error: instructionError } = await adminClient
        .from("zylus_payment_instructions")
        .insert({
          sale_id: sale.id,
          bank_name: bankName,
          account_name: accountName,
          account_number: accountNumber,
          amount_to_pay: sale.purchase_amount,
          payment_reference: instructionReference,
          additional_instructions: additionalInstructions,
          verified_at: now,
          verified_by: user.id,
          issued_at: now,
          email_status: "pending",
          whatsapp_status: "pending"
        })
        .select("id")
        .single();

      if (instructionError) throw instructionError;

      const { error: tokenUpdateError } = await adminClient
        .from("zylus_sales")
        .update({ access_token_hash: tokenHash })
        .eq("id", sale.id);

      if (tokenUpdateError) {
        await adminClient
          .from("zylus_payment_instructions")
          .delete()
          .eq("id", instruction.id);
        throw tokenUpdateError;
      }

      const amount = Number(sale.purchase_amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      const emailHtml = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333">
          <h2 style="color:#176b45">Source Stays</h2>
          <h3>Verified Zylus Property Payment Instructions</h3>
          <p>Dear ${sale.buyer_name.replace(/[&<>"']/g, "")},</p>
          <p>Your payment instructions for <strong>${String(property.title || "Zylus property").replace(/[&<>"']/g, "")}</strong> are below.</p>
          <p><strong>Transaction reference:</strong> ${sale.transaction_ref}</p>
          <p><strong>Bank:</strong> ${bankName}</p>
          <p><strong>Account name:</strong> ${accountName}</p>
          <p><strong>Account number:</strong> ${accountNumber}</p>
          <p><strong>Amount:</strong> ₦${amount}</p>
          <p><strong>Payment reference:</strong> ${instructionReference}</p>
          <p>${additionalInstructions.replace(/[&<>"']/g, "")}</p>
          <p>Make payment directly to the stated Zylus Group account. Do not pay Source Stays.</p>
          <p><a href="${customerLink}">Submit your payment receipt securely</a></p>
          <p>Uploading a receipt does not mean payment has been confirmed. Source Stays will review it and forward it to Zylus for confirmation.</p>
          <p>Thank you,<br>Source Stays</p>
        </div>
      `;

      let emailSent = false;
      let emailErrorMessage = "";

      try {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (!resendKey) throw new Error("Resend API key is missing.");

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Source Stays <bookings@sourcestays.com.ng>",
            to: [sale.buyer_email],
            subject: "Verified Zylus Property Payment Instructions",
            html: emailHtml
          })
        });

        if (!emailResponse.ok) {
          const errorBody = await emailResponse.text();
          throw new Error(errorBody);
        }

        emailSent = true;
      } catch (emailError) {
        emailErrorMessage = emailError instanceof Error
          ? emailError.message
          : "Email delivery failed.";
        console.error("Zylus payment email error:", emailError);
      }

      const { error: emailStatusError } = await adminClient
        .from("zylus_payment_instructions")
        .update({
          email_status: emailSent ? "sent" : "failed",
          email_sent_at: emailSent ? new Date().toISOString() : null
        })
        .eq("id", instruction.id);

      if (emailStatusError) throw emailStatusError;

      const whatsappPhone = sale.buyer_phone.replace(/\D/g, "").replace(/^0/, "234");

      const whatsappMessage =
        `Hello ${sale.buyer_name}, here are your verified Zylus property payment instructions.\n\n` +
        `Transaction: ${sale.transaction_ref}\n` +
        `Bank: ${bankName}\n` +
        `Account name: ${accountName}\n` +
        `Account number: ${accountNumber}\n` +
        `Amount: ₦${amount}\n` +
        `Payment reference: ${instructionReference}\n\n` +
        `${additionalInstructions}\n\n` +
        `After payment, submit your receipt securely here:\n${customerLink}\n\n` +
        `Please note that payment is subject to confirmation by Zylus Group.\nSource Stays`;

      return json({
        success: true,
        message: emailSent
          ? "Payment instructions issued and email sent."
          : "Instructions saved, but email delivery failed. You can send the WhatsApp message manually.",
        email_sent: emailSent,
        email_error: emailSent ? undefined : emailErrorMessage,
        whatsapp_link:
          `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`,
        customer_link: customerLink,
        transaction_ref: sale.transaction_ref
      });
    }

    if (body.action !== "create_sale") {
      return json({ error: "Unsupported action." }, 400);
    }

    const propertyId = Number(body.property_id);
    const buyerName = String(body.buyer_name || "").trim();
    const buyerEmail = String(body.buyer_email || "").trim().toLowerCase();
    const buyerPhone = String(body.buyer_phone || "").trim();
    const purchaseAmount = Number(body.purchase_amount);

    if (
      !Number.isSafeInteger(propertyId) ||
      propertyId <= 0 ||
      !buyerName ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail) ||
      !buyerPhone ||
      !Number.isFinite(purchaseAmount) ||
      purchaseAmount <= 0
    ) {
      return json({
        error: "Enter a valid property, buyer details and purchase amount.",
      }, 400);
    }

    if (
      buyerName.length > 150 ||
      buyerEmail.length > 254 ||
      buyerPhone.length > 40
    ) {
      return json({ error: "One or more buyer details are too long." }, 400);
    }

    const { data: property, error: propertyError } = await adminClient
      .from("properties")
      .select("id,title,category,is_zylus_group")
      .eq("id", propertyId)
      .maybeSingle();

    if (propertyError) throw propertyError;

    if (
      !property ||
      property.is_zylus_group !== true ||
      !["sale", "land"].includes(String(property.category || "").toLowerCase())
    ) {
      return json({
        error: "This is not an eligible Zylus property for a sales transaction.",
      }, 400);
    }

    const token = randomToken();
    const tokenHash = await sha256(token);
    const transactionRef =
      "SSZ-" + crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();

    const { data: sale, error: insertError } = await adminClient
      .from("zylus_sales")
      .insert({
        property_id: propertyId,
        transaction_ref: transactionRef,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        purchase_amount: purchaseAmount,
        payment_status: "awaiting_payment",
        access_token_hash: tokenHash,
        created_by: user.id,
      })
      .select("id,transaction_ref,property_id,buyer_name,buyer_email,buyer_phone,purchase_amount,payment_status,created_at")
      .single();

    if (insertError) throw insertError;

    return json({
      success: true,
      message: "Zylus sales transaction created.",
      sale,
      customer_access_token: token,
      note: "This token is shown only once. Do not share it publicly.",
    });
  } catch (error) {
    console.error("Zylus sales workflow error:", error);
    return json({
      error: error instanceof Error
        ? error.message
        : "An unexpected server error occurred.",
    }, 500);
  }
});