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
let listingsVisibleCount = 8;
const LISTINGS_PAGE_SIZE = 9;

async function loadListings(){
  listingsVisibleCount = LISTINGS_PAGE_SIZE;
 const box=document.getElementById('listings'); if(!box)return;

 try {
  const items = await getListings();

  console.log('[Source Stays diagnostic]', {
    listingsLoaded: items.length,
    verificationFields: items.slice(0, 5).map(p => ({
      id: p.id,
      title: p.title,
      owner_identity_verified: p.owner_identity_verified,
      physical_inspection_verified: p.physical_inspection_verified
    }))
  });

  // Hotel cards use the customer-safe room-category view, never properties.price.
  // This keeps hotel net rates and markup private and leaves non-hotel pricing untouched.
  const hotelIds = items
    .filter(p => String(p.category || '').toLowerCase() === 'hotel')
    .map(p => p.id);

  const hotelStartingPrices = new Map();
  if (hotelIds.length) {
    const { data: roomRates, error: ratesError } = await supabaseClient
      .from('hotel_room_categories_public')
      .select('property_id, customer_rate')
      .in('property_id', hotelIds);

    if (ratesError) {
      console.error('Could not load public hotel room rates:', ratesError);
    } else {
      (roomRates || []).forEach(room => {
        const rate = Number(room.customer_rate);
        if (!Number.isFinite(rate) || rate <= 0) return;
        const current = hotelStartingPrices.get(String(room.property_id));
        if (current === undefined || rate < current) {
          hotelStartingPrices.set(String(room.property_id), rate);
        }
      });
    }
  }

  const renderVisibleListings = () => {
   const visibleItems = items.slice(0, listingsVisibleCount);
   box.innerHTML = visibleItems.length ? visibleItems.map(p => {
    const isHotel = String(p.category || '').toLowerCase() === 'hotel';
    const startingRate = hotelStartingPrices.get(String(p.id));
    const priceLabel = isHotel
      ? (startingRate
          ? 'Starting from ₦' + money(startingRate) + ' / per night'
          : 'View room rates')
      : '₦' + money(p.price) + ' / ' + esc(p.price_period || 'per night');

    return `<article class="card"><div class="photo" style="background-image:url('${esc(p.image_url||'')}')"></div><div class="body"><div class="eyebrow">${esc(p.category||'shortlet')}</div><h3>${esc(p.title)}</h3><div class="verification-badges">${p.owner_identity_verified?'<span class="verification-badge">✓ Source Verified</span>':''}${p.physical_inspection_verified?'<span class="verification-badge">✓ Physical Inspection Completed</span>':''}</div><div class="meta">${esc(p.location||'Lagos')}${p.category === 'land' ? ' • Land' : ' • ' + (p.bedrooms||0) + ' bedroom(s) • ' + (p.guests||0) + ' guest(s)'}</div><div class="price">${priceLabel}</div><div class="row"><span class="muted">${esc(p.amenities||'Quality service')}</span><a class="btn dark" href="property.html?id=${p.id}">View</a></div></div></article>`;
  }).join('') : '<p>No matching listings yet. Try another location or contact Source Stays.';
   const moreButton = document.getElementById('loadMoreListings');
   if (moreButton) moreButton.hidden = listingsVisibleCount >= items.length;
  };
  renderVisibleListings();
  const moreButton = document.getElementById('loadMoreListings');
  if (moreButton) moreButton.onclick = () => {
   listingsVisibleCount = Math.min(listingsVisibleCount + LISTINGS_PAGE_SIZE, items.length);
   renderVisibleListings();
  };
 } catch(e) {
  console.error(e);
  box.innerHTML='<p>Listings are temporarily unavailable. Please try again or contact Source Stays on WhatsApp.</p>';
 }
}


async function submitBooking(payload) {
  const { data, error } = await supabaseClient.rpc(
    'create_customer_booking',
    { p_payload: payload }
  );

  if (error) throw error;

  if (!data) {
    throw new Error(
      'Booking was not confirmed. Please contact Source Stays.'
    );
  }

  return { id: data };
}


async function submitEnquiry(payload){const {data,error}=await supabaseClient.from('enquiries').insert(payload).select('id').single();if(error)throw error;return data;}
async function getProperty(id){const {data,error}=await supabaseClient.from('properties').select('*').eq('id',id).eq('published',true).single();if(error)throw error;return data;}async function getPropertyImages(id){
  const {data,error}=await supabaseClient
    .from('property_images')
    .select('image_url')
    .eq('property_id',id)
    .order('id');

  if(error) throw error;
  return data || [];
}

async function checkAvailability(propertyId, checkIn, checkOut) {
  const { data, error } = await supabaseClient.rpc(
    'check_property_availability',
    {
      p_property_id: Number(propertyId),
      p_check_in: checkIn,
      p_check_out: checkOut
    }
  );

  if (error) throw error;
  return data === true;
}

window.SourceStays = {
  supabase: supabaseClient,
  BUCKET,
  esc,
  money,
  getListings,
  loadListings,
  submitBooking,
  submitEnquiry,
  getProperty,
  getPropertyImages,
  checkAvailability
};

if(document.getElementById('listings')) loadListings();
