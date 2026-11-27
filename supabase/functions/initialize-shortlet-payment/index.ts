import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods":"POST, OPTIONS" };
const json = (body: unknown, status=200) => new Response(JSON.stringify(body), { status, headers:{...cors,"Content-Type":"application/json"} });
const serviceKey = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("ZYLUS_SUPABASE_SECRET_KEY") || "";
Deno.serve(async req => {
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return json({error:"Method not allowed."},405);
 try {
  const url=Deno.env.get("SUPABASE_URL")||"", anon=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"", key=serviceKey(), secret=Deno.env.get("PAYSTACK_SECRET_KEY")?.trim()||"";
  const auth=req.headers.get("Authorization")||"";
  if(!url||!anon||!key||!secret) return json({error:"Payment service is temporarily unavailable."},503);
  if(!auth.startsWith("Bearer ")) return json({error:"Please sign in before paying."},401);
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await userClient.auth.getUser(auth.slice(7));
  if(authError||!user) return json({error:"Your login session is invalid."},401);
  const body=await req.json().catch(()=>({}));
  const bookingId=Number(body.booking_id);
  if(!Number.isSafeInteger(bookingId)||bookingId<=0) return json({error:"A valid booking reference is required."},400);
  const {data:booking,error}=await admin.from("bookings")
    .select("id,customer_user_id,customer_email,amount_due,currency,payment_status,payment_request_status,status,check_in,check_out")
    .eq("id",bookingId).eq("customer_user_id",user.id).maybeSingle();
  if(error) throw error;
  if(!booking) return json({error:"Booking not found."},404);
  if(booking.payment_status==="paid") return json({error:"This booking has already been paid."},409);
  if(String(booking.payment_request_status||"").toLowerCase()!=="requested") return json({error:"Source Stays has not requested payment for this booking yet. You will be able to pay here once your booking and final amount are confirmed."},409);
  if(!booking.check_in||!booking.check_out||booking.check_out<=booking.check_in) return json({error:"Booking dates are invalid."},409);
  const amount=Number(booking.amount_due), kobo=Math.round(amount*100);
  if(!Number.isFinite(amount)||amount<=0||!Number.isSafeInteger(kobo)||kobo<=0) return json({error:"The confirmed booking amount is invalid."},409);
  const {data:existing,error:existingError}=await admin.from("shortlet_payment_transactions")
    .select("reference,status,authorization_url,amount").eq("booking_id",bookingId).eq("customer_user_id",user.id).eq("status","pending").order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(existingError) throw existingError;
  if(existing?.authorization_url && Number(existing.amount)===amount) return json({success:true,authorization_url:existing.authorization_url,reference:existing.reference,amount,currency:"NGN",reused:true});
  if(existing && Number(existing.amount)!==amount) {
   const {error:staleError}=await admin.from("shortlet_payment_transactions").update({status:"failed",updated_at:new Date().toISOString()}).eq("reference",existing.reference).eq("status","pending");
   if(staleError) throw staleError;
  }
  const email=String(booking.customer_email||user.email||"").trim();
  if(!email.includes("@")) return json({error:"A valid email address is required for Paystack."},400);
  const reference="SSSHT-"+crypto.randomUUID().replaceAll("-","").toUpperCase();
  const {data:tx,error:insertError}=await admin.from("shortlet_payment_transactions").insert({booking_id:bookingId,customer_user_id:user.id,reference,currency:"NGN",amount,status:"pending"}).select("id").single();
  if(insertError) throw insertError;
  const callback=String(body.callback_url||"https://sourcestays.com.ng/confirmation.html").trim();
  if(!/^https:\/\/([a-z0-9-]+\.)?sourcestays\.com\.ng(\/|$)/i.test(callback)){
    await admin.from("shortlet_payment_transactions").update({status:"failed"}).eq("id",tx.id);
    return json({error:"Invalid payment return URL."},400);
  }
  const response=await fetch("https://api.paystack.co/transaction/initialize",{method:"POST",headers:{Authorization:"Bearer "+secret,"Content-Type":"application/json"},body:JSON.stringify({email,amount:kobo,currency:"NGN",reference,callback_url:callback,metadata:{payment_type:"shortlet_booking",booking_id:bookingId,customer_user_id:user.id}})});
  const paystack=await response.json().catch(()=>null);
  if(!response.ok||!paystack?.status||!paystack?.data?.authorization_url){
    await admin.from("shortlet_payment_transactions").update({status:"failed",gateway_response:paystack||{http_status:response.status}}).eq("id",tx.id);
    return json({error:"Paystack could not initialize payment. Please try again."},502);
  }
  const {error:saveError}=await admin.from("shortlet_payment_transactions").update({authorization_url:paystack.data.authorization_url,access_code:paystack.data.access_code||null}).eq("id",tx.id).eq("status","pending");
  if(saveError) throw saveError;
  
  return json({success:true,authorization_url:paystack.data.authorization_url,reference,amount,currency:"NGN"});
 } catch(e) { console.error("Shortlet payment initialization error:",e); return json({error:"Unable to initialize payment. Please try again."},500); }
});