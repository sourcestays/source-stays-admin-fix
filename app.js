const { createClient } = window.supabase;
const supabaseClient = createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);
const BUCKET='property-images';
const esc=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function money(x){return Number(x||0).toLocaleString('en-NG');}
async function getListings(){
 const type=document.getElementById('type')?.value||'all', locationValue=document.getElementById('location')?.value||'';
 let q=supabaseClient.from('properties').select('*').eq('published',true).order('featured',{ascending:false}).order('id',{ascending:false});
 if(type!=='all') q=q.eq('category',type);
 if(locationValue) q=q.ilike('location',`%${locationValue}%`);
 const {data,error}=await q; if(error) throw error; return data||[];
}
async function loadListings(){
 const box=document.getElementById('listings'); if(!box)return;
 try{const items=await getListings(); box.innerHTML=items.length?items.map(p=>`<article class="card"><div class="photo" style="background-image:url('${esc(p.image_url||'')}')"></div><div class="body"><div class="eyebrow">${esc(p.category||'shortlet')}</div><h3>${esc(p.title)}</h3><div class="meta">${esc(p.location||'Lagos')} • ${p.bedrooms||0} bedroom(s) • ${p.guests||0} guest(s)</div><div class="price">₦${money(p.price)} / ${esc(p.price_period||'per night')}</div><div class="row"><span class="muted">${esc(p.amenities||'Quality service')}</span><a class="btn dark" href="property.html?id=${p.id}">View</a></div></div></article>`).join(''):'<p>No matching listings yet. Try another location or contact Source Stays.'}
 catch(e){console.error(e);box.innerHTML='<p>Listings are temporarily unavailable. Please try again or contact Source Stays on WhatsApp.</p>'}
}
async function submitBooking(payload){const {data,error}=await supabaseClient.from('bookings').insert(payload).select('id').single();if(error)throw error;return data;}
async function submitEnquiry(payload){const {data,error}=await supabaseClient.from('enquiries').insert(payload).select('id').single();if(error)throw error;return data;}
async function getProperty(id){const {data,error}=await supabaseClient.from('properties').select('*').eq('id',id).eq('published',true).single();if(error)throw error;return data;}
window.SourceStays={supabase:supabaseClient,BUCKET,esc,money,getListings,loadListings,submitBooking,submitEnquiry,getProperty};
if(document.getElementById('listings')) loadListings();
