-- Source Stays hotel room categories and customer-safe room-rate view.
-- This is separate from properties.price so existing shortlet pricing is untouched.

create table if not exists public.hotel_room_categories (
  id uuid primary key default gen_random_uuid(),
  property_id bigint not null references public.properties(id) on delete cascade,
  room_name text not null check (char_length(trim(room_name)) between 2 and 120),
  description text,
  hotel_net_rate numeric(12,2) not null check (hotel_net_rate > 0),
  markup_type text not null default 'fixed'
    check (markup_type in ('fixed', 'percentage')),
  markup_value numeric(12,2) not null default 0
    check (markup_value >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_room_category_markup_valid
    check (markup_type <> 'percentage' or markup_value <= 100)
);

create index if not exists hotel_room_categories_property_idx
  on public.hotel_room_categories (property_id, is_active, sort_order);

alter table public.hotel_room_categories enable row level security;

drop policy if exists "Source Stays admins manage hotel room categories"
  on public.hotel_room_categories;
create policy "Source Stays admins manage hotel room categories"
  on public.hotel_room_categories
  for all to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.admin_users au
      where au.id = (select auth.uid())
    )
  );

revoke all on public.hotel_room_categories from anon;
grant select, insert, update, delete on public.hotel_room_categories to authenticated;

create or replace function public.set_hotel_room_category_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_hotel_room_categories_updated_at
  on public.hotel_room_categories;
create trigger trg_hotel_room_categories_updated_at
before update on public.hotel_room_categories
for each row execute function public.set_hotel_room_category_updated_at();

-- Public customers see only the retail rate. Hotel net rates and markup inputs
-- remain in the RLS-protected base table and are not exposed by this view.
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
  hrc.sort_order
from public.hotel_room_categories hrc
join public.properties p on p.id = hrc.property_id
where hrc.is_active = true
  and p.published = true
  and lower(coalesce(p.category, '')) = 'hotel';

revoke all on public.hotel_room_categories_public from anon;
grant select on public.hotel_room_categories_public to anon, authenticated;

-- Tie each availability request to a real room category. Keep the text field
-- for readable admin/customer request records and backward compatibility.
alter table public.hotel_availability_requests
  add column if not exists room_category_id uuid
  references public.hotel_room_categories(id) on delete restrict;

create index if not exists hotel_availability_requests_room_category_idx
  on public.hotel_availability_requests (room_category_id);

create or replace function public.set_hotel_availability_request_room_category()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_room public.hotel_room_categories%rowtype;
begin
  if new.room_category_id is null then
    raise exception 'Please select a valid hotel room category.';
  end if;

  select *
    into selected_room
    from public.hotel_room_categories
   where id = new.room_category_id
     and property_id = new.property_id
     and is_active = true;

  if not found then
    raise exception 'The selected room category is not available for this hotel.';
  end if;

  if not exists (
    select 1
      from public.properties p
     where p.id = new.property_id
       and p.published = true
       and lower(coalesce(p.category, '')) = 'hotel'
  ) then
    raise exception 'Hotel availability requests can only be created for published hotels.';
  end if;

  new.room_category := selected_room.room_name;
  return new;
end;
$$;

drop trigger if exists trg_set_hotel_availability_request_room_category
  on public.hotel_availability_requests;
create trigger trg_set_hotel_availability_request_room_category
before insert on public.hotel_availability_requests
for each row execute function public.set_hotel_availability_request_room_category();

drop policy if exists "Customers create own hotel availability requests"
  on public.hotel_availability_requests;
create policy "Customers create own hotel availability requests"
  on public.hotel_availability_requests
  for insert to authenticated
  with check (
    customer_user_id = (select auth.uid())
    and room_category_id is not null
    and status = 'pending_availability'
    and availability_confirmed_at is null
    and availability_expires_at is null
    and payment_url is null
    and hotel_confirmation_note is null
  );

-- Keep the selected room category immutable for customer-owned requests.
create or replace function public.guard_hotel_availability_request_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.admin_users au where au.id = (select auth.uid())
  ) then
    if old.customer_user_id <> (select auth.uid())
       or new.customer_user_id <> old.customer_user_id
       or new.property_id <> old.property_id
       or new.customer_name <> old.customer_name
       or new.customer_email is distinct from old.customer_email
       or new.customer_phone <> old.customer_phone
       or new.room_category <> old.room_category
       or new.room_category_id is distinct from old.room_category_id
       or new.check_in <> old.check_in
       or new.check_out <> old.check_out
       or new.rooms_requested <> old.rooms_requested
       or new.guests <> old.guests
       or new.customer_note is distinct from old.customer_note
       or new.status <> old.status
       or new.availability_confirmed_at is distinct from old.availability_confirmed_at
       or new.availability_expires_at is distinct from old.availability_expires_at
       or new.hotel_confirmation_note is distinct from old.hotel_confirmation_note
       or new.payment_url is distinct from old.payment_url then
      raise exception 'Customers cannot modify hotel availability requests.';
    end if;
  end if;
  return new;
end;
$$;
