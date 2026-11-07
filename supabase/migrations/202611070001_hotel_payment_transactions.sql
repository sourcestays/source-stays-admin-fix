-- Source Stays hotel payment records.
-- Apply after the hotel availability, room-category and room-media migrations.
-- Hotel payments are kept separate from ordinary shortlet bookings.

alter table public.hotel_availability_requests
  add column if not exists payment_status text not null default 'not_started'
    check (payment_status in ('not_started','pending','paid','failed','refund_pending','refunded')),
  add column if not exists payment_verified_at timestamptz,
  add column if not exists hotel_reservation_confirmed_at timestamptz,
  add column if not exists hotel_identity_released_at timestamptz,
  add column if not exists payment_reference text;

create index if not exists hotel_availability_requests_payment_status_idx
  on public.hotel_availability_requests (payment_status, created_at desc);

create table if not exists public.hotel_payment_transactions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.hotel_availability_requests(id) on delete restrict,
  reference text not null unique,
  gateway text not null default 'paystack' check (gateway = 'paystack'),
  currency text not null default 'NGN' check (currency = 'NGN'),
  accommodation_amount numeric(12,2) not null check (accommodation_amount > 0),
  caution_fee_amount numeric(12,2) not null default 0 check (caution_fee_amount >= 0),
  total_amount numeric(12,2) not null check (total_amount > 0),
  rooms_requested integer not null check (rooms_requested between 1 and 20),
  nights integer not null check (nights between 1 and 365),
  room_category_id uuid not null references public.hotel_room_categories(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending','paid','failed','refund_pending','refunded')),
  authorization_url text,
  access_code text,
  paid_at timestamptz,
  paystack_transaction_id text,
  gateway_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_payment_total_matches_components
    check (total_amount = accommodation_amount + caution_fee_amount)
);

create index if not exists hotel_payment_transactions_request_idx
  on public.hotel_payment_transactions (request_id, created_at desc);
create index if not exists hotel_payment_transactions_status_idx
  on public.hotel_payment_transactions (status, created_at desc);

alter table public.hotel_payment_transactions enable row level security;

drop policy if exists "Source Stays admins view hotel payment transactions"
  on public.hotel_payment_transactions;
create policy "Source Stays admins view hotel payment transactions"
  on public.hotel_payment_transactions
  for select to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = (select auth.uid())
    )
  );

revoke all on public.hotel_payment_transactions from anon, authenticated;
grant select on public.hotel_payment_transactions to authenticated;
grant all on public.hotel_payment_transactions to service_role;

create or replace function public.set_hotel_payment_transaction_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_hotel_payment_transactions_updated_at
  on public.hotel_payment_transactions;
create trigger trg_hotel_payment_transactions_updated_at
before update on public.hotel_payment_transactions
for each row execute function public.set_hotel_payment_transaction_updated_at();

-- Keep the customer request status and payment status synchronized without
-- automatically confirming the hotel reservation.
create or replace function public.sync_hotel_payment_request_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    update public.hotel_availability_requests
       set payment_status = 'paid',
           payment_verified_at = coalesce(new.paid_at, now()),
           payment_reference = new.reference
     where id = new.request_id;
  elsif new.status = 'failed' then
    update public.hotel_availability_requests
       set payment_status = 'failed',
           payment_reference = new.reference
     where id = new.request_id
       and payment_status <> 'paid';
  elsif new.status in ('refund_pending','refunded') then
    update public.hotel_availability_requests
       set payment_status = new.status
     where id = new.request_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_hotel_payment_request_status
  on public.hotel_payment_transactions;
create trigger trg_sync_hotel_payment_request_status
after insert or update of status on public.hotel_payment_transactions
for each row execute function public.sync_hotel_payment_request_status();
