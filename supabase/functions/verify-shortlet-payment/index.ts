import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return json({error:"Method not allowed."},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")||"",anon=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||Deno.env.get("ZYLUS_SUPABASE_SECRET_KEY")||"",secret=Deno.env.get("PAYSTACK_SECRET_KEY")||"",auth=req.headers.get("Authorization")||"";
  if(!url||!anon||!key||!secret) return json({error:"Payment verification is temporarily unavailable."},503);
  if(!auth.startsWith("Bearer ")) return json({error:"Please sign in."},401);
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await userClient.auth.getUser(auth.slice(7));
  if(authError||!user) return json({error:"Your login session is invalid."},401);
  const body=await req.json().catch(()=>({}));
  const bookingId=Number(body.booking_id);
  if(!Number.isSafeInteger(bookingId)||bookingId<=0) return json({error:"A valid booking reference is required."},400);
  const {data:tx,error}=await admin.from("shortlet_payment_transactions").select("id,booking_id,customer_user_id,amount,status,reference").eq("booking_id",bookingId).eq("customer_user_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(error) throw error;
  if(!tx) return json({error:"No payment attempt was found for this booking yet."},404);
  const reference=String(tx.reference);
  if(tx.status==="paid") return json({success:true,paid:true,booking_id:tx.booking_id});
  const response=await fetch("https://api.paystack.co/transaction/verify/"+encodeURIComponent(reference),{headers:{Authorization:"Bearer "+secret}});
  const result=await response.json().catch(()=>null);
  if(!response.ok||!result?.status) return json({error:"Paystack could not verify this payment yet. Please refresh shortly."},502);
  const data=result.data;
  if(data.status!=="success") return json({success:true,paid:false,status:data.status||"pending"});
  if(Number(data.amount)!==Math.round(Number(tx.amount)*100)||String(data.currency)!=="NGN"||String(data.reference)!==reference) return json({error:"Payment amount or reference does not match this booking. Contact Source Stays."},409);
  const {error:updateError}=await admin.from("shortlet_payment_transactions").update({status:"paid",gateway_transaction_id:String(data.id),gateway_response:data,paid_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",tx.id);
  if(updateError) throw updateError;
  const {error:bookingError}=await admin.from("bookings").update({payment_status:"paid"}).eq("id",tx.booking_id).eq("customer_user_id",user.id);
  if(bookingError) throw bookingError;
  return json({success:true,paid:true,booking_id:tx.booking_id});
 }catch(e){console.error("Shortlet payment verification error:",e);return json({error:"Unable to verify payment. Please try again."},500);}
});