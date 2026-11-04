-- Source Stays hotel availability requests (manual WhatsApp confirmation MVP)
-- Apply this migration in the Supabase SQL Editor before deploying the related UI.

create table if not exists public.hotel_availability_requests (
  id uuid primary key default gen_random_uuid(),
  request_ref text not null unique default (
    'SSR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  property_id bigint not null references public.properties(id) on delete restrict,
  customer_user_id uuid not null references auth.users(id) on delete restrict,
  customer_name text not null check (char_length(trim(customer_name)) between 2 and 150),
  customer_email text,
  customer_phone text not null check (char_length(trim(customer_phone)) between 7 and 40),
  room_category text not null check (char_length(trim(room_category)) between 2 and 120),
  check_in date not null,
  check_out date not null,
  rooms_requested integer not null default 1 check (rooms_requested between 1 and 20),
  guests integer not null default 1 check (guests between 1 and 50),
  customer_note text check (customer_note is null or char_length(customer_note) <= 1000),
  status text not null default 'pending_availability'
    check (status in ('pending_availability','available','unavailable','awaiting_payment','expired','cancelled')),
  hotel_confirmation_note text,
  availability_confirmed_at timestamptz,
  availability_expires_at timestamptz,
  whatsapp_opened_at timestamptz,
  payment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_availability_dates_valid check (check_out > check_in)
);

create index if not exists hotel_availability_requests_created_idx
  on public.hotel_availability_requests (created_at desc);
create index if not exists hotel_availability_requests_status_idx
  on public.hotel_availability_requests (status, created_at desc);
create index if not exists hotel_availability_requests_property_dates_idx
  on public.hotel_availability_requests (property_id, check_in, check_out);

alter table public.hotel_availability_requests enable row level security;

-- Customers can submit requests only for themselves.
drop policy if exists "Customers create own hotel availability requests"
  on public.hotel_availability_requests;
create policy "Customers create own hotel availability requests"
  on public.hotel_availability_requests
  for insert to authenticated
  with check (
    customer_user_id = (select auth.uid())
    and status = 'pending_availability'
    and availability_confirmed_at is null
    and availability_expires_at is null
    and payment_url is null
    and hotel_confirmation_note is null
  );

-- Customers can see only their own request status; private hotel details are
-- deliberately not stored in this customer-visible request record.
drop policy if exists "Customers view own hotel availability requests"
  on public.hotel_availability_requests;
create policy "Customers view own hotel availability requests"
  on public.hotel_availability_requests
  for select to authenticated
  using (customer_user_id = (select auth.uid()));

-- Source Stays staff are identified through the existing admin_users table.
drop policy if exists "Source Stays admins manage hotel availability requests"
  on public.hotel_availability_requests;
create policy "Source Stays admins manage hotel availability requests"
  on public.hotel_availability_requests
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

-- Only authenticated users may create requests. Anonymous visitors must sign in
-- through the existing customer-account flow before submitting a request.
revoke all on public.hotel_availability_requests from anon;
grant select, insert on public.hotel_availability_requests to authenticated;
grant update, delete on public.hotel_availability_requests to authenticated;

create or replace function public.set_hotel_availability_request_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_hotel_availability_requests_updated_at
  on public.hotel_availability_requests;
create trigger trg_hotel_availability_requests_updated_at
before update on public.hotel_availability_requests
for each row execute function public.set_hotel_availability_request_updated_at();

-- Guard customer-owned rows against changing the request or promoting themselves.
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

drop trigger if exists trg_guard_hotel_availability_request_changes
  on public.hotel_availability_requests;
create trigger trg_guard_hotel_availability_request_changes
before update on public.hotel_availability_requests
for each row execute function public.guard_hotel_availability_request_changes();
