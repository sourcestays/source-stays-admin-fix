-- Hotel Source Stays Credits: separate from ordinary booking redemptions.
create table if not exists public.hotel_source_stays_credit_redemptions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.hotel_availability_requests(id) on delete restrict,
  customer_user_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(12,2) not null check (amount >= 2000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  customer_note text,
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);
create unique index if not exists hotel_source_stays_credit_one_active_request_idx
  on public.hotel_source_stays_credit_redemptions(request_id)
  where status in ('pending','approved');
alter table public.hotel_source_stays_credit_redemptions enable row level security;
drop policy if exists "Customers view own hotel credit requests" on public.hotel_source_stays_credit_redemptions;
create policy "Customers view own hotel credit requests" on public.hotel_source_stays_credit_redemptions
for select to authenticated using (customer_user_id = (select auth.uid()));
drop policy if exists "Admins view hotel credit requests" on public.hotel_source_stays_credit_redemptions;
create policy "Admins view hotel credit requests" on public.hotel_source_stays_credit_redemptions
for select to authenticated using (exists(select 1 from public.admin_users a where a.id=(select auth.uid())));
revoke all on public.hotel_source_stays_credit_redemptions from anon, authenticated;
grant select on public.hotel_source_stays_credit_redemptions to authenticated;
grant all on public.hotel_source_stays_credit_redemptions to service_role;

alter table public.hotel_payment_transactions
  add column if not exists credit_amount numeric(12,2) not null default 0;
alter table public.hotel_payment_transactions
  drop constraint if exists hotel_payment_total_matches_components;
alter table public.hotel_payment_transactions
  add constraint hotel_payment_total_matches_components
  check (total_amount = accommodation_amount + caution_fee_amount - credit_amount and credit_amount >= 0);

create or replace function public.request_hotel_source_stays_credit_redemption(
  p_request_id uuid, p_amount numeric, p_customer_note text default null
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_req public.hotel_availability_requests%rowtype;
  v_balance numeric(12,2);
  v_total numeric(12,2);
  v_id uuid;
begin
  if v_uid is null then raise exception 'Please sign in first.'; end if;
  if p_amount is null or p_amount < 2000 or p_amount <> round(p_amount,2) then
    raise exception 'Minimum credit redemption is ₦2,000.';
  end if;
  select * into v_req from public.hotel_availability_requests
    where id=p_request_id and customer_user_id=v_uid for update;
  if not found then raise exception 'Hotel reservation not found.'; end if;
  if v_req.payment_status='paid' or v_req.payment_status in ('refund_pending','refunded') then
    raise exception 'Credits can only be requested before hotel payment.';
  end if;
  if v_req.status not in ('available','awaiting_payment') or
     v_req.availability_expires_at is null or v_req.availability_expires_at <= now() then
    raise exception 'Hotel availability has expired. Please reconfirm availability first.';
  end if;
  select coalesce(sum(case when entry_type='earn' then amount when entry_type='redeem' then -amount when entry_type='adjustment' then amount else 0 end),0)
    into v_balance from public.source_stays_credit_ledger where customer_user_id=v_uid;
  if p_amount > v_balance then raise exception 'Requested credits exceed your available balance.'; end if;
  select round((r.customer_rate * (v_req.check_out-v_req.check_in) * v_req.rooms_requested) + (20000 * v_req.rooms_requested),2)
    into v_total
    from public.hotel_room_categories_public r where r.id=v_req.room_category_id and r.property_id=v_req.property_id;
  if v_total is null or p_amount > v_total then raise exception 'Credit amount exceeds the hotel balance payable.'; end if;
  insert into public.hotel_source_stays_credit_redemptions(request_id,customer_user_id,amount,customer_note)
    values(p_request_id,v_uid,p_amount,left(coalesce(p_customer_note,''),500))
    returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.request_hotel_source_stays_credit_redemption(uuid,numeric,text) from public;
grant execute on function public.request_hotel_source_stays_credit_redemption(uuid,numeric,text) to authenticated;

create or replace function public.admin_review_hotel_source_stays_credit_redemption(
  p_request_id uuid, p_approve boolean, p_admin_note text default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_row public.hotel_source_stays_credit_redemptions%rowtype;
  v_pending integer;
begin
  if not exists(select 1 from public.admin_users where id=auth.uid()) then
    raise exception 'Administrator access required.';
  end if;
  select * into v_row from public.hotel_source_stays_credit_redemptions
    where id=p_request_id for update;
  if not found then raise exception 'Credit request not found.'; end if;
  if v_row.status <> 'pending' then raise exception 'This credit request has already been reviewed.'; end if;
  if p_approve then
    if exists(select 1 from public.hotel_availability_requests
      where id=v_row.request_id and (payment_status='paid' or status not in ('available','awaiting_payment')
        or availability_expires_at <= now())) then
      raise exception 'Hotel request is paid or availability has expired.';
    end if;
    select count(*) into v_pending from public.hotel_payment_transactions
      where request_id=v_row.request_id and status='pending';
    if v_pending > 0 then raise exception 'A payment link already exists. Do not approve credits until the payment attempt is cancelled or expires.'; end if;
    insert into public.source_stays_credit_ledger(customer_user_id,amount,entry_type,note)
      values(v_row.customer_user_id,v_row.amount,'redeem','Hotel reservation credit redemption '||v_row.request_id::text);
    update public.hotel_source_stays_credit_redemptions
      set status='approved',admin_note=left(p_admin_note,500),reviewed_at=now(),reviewed_by=auth.uid()
      where id=p_request_id;
  else
    update public.hotel_source_stays_credit_redemptions
      set status='rejected',admin_note=left(p_admin_note,500),reviewed_at=now(),reviewed_by=auth.uid()
      where id=p_request_id;
  end if;
end;
$$;
revoke all on function public.admin_review_hotel_source_stays_credit_redemption(uuid,boolean,text) from public;
grant execute on function public.admin_review_hotel_source_stays_credit_redemption(uuid,boolean,text) to authenticated;
