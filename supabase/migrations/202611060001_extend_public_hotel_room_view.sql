-- Extend the customer-safe hotel room view with room media and capacity.
-- Private hotel_net_rate and markup fields remain excluded.
create or replace view public.hotel_room_categories_public
with (security_barrier = true)
as
select
  hrc.id,
  hrc.property_id,
  hrc.room_name,
  hrc.description,
  round(
    case
      when hrc.markup_type = 'percentage'
        then hrc.hotel_net_rate * (1 + hrc.markup_value / 100)
      else hrc.hotel_net_rate + hrc.markup_value
    end,
    2
  ) as customer_rate,
  hrc.max_guests,
  hrc.photo_urls,
  hrc.video_url,
  hrc.sort_order
from public.hotel_room_categories hrc
join public.properties p on p.id = hrc.property_id
where hrc.is_active = true
  and p.published = true
  and lower(coalesce(p.category, '')) = 'hotel';

grant select on public.hotel_room_categories_public to anon, authenticated;
