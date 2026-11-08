-- Store the admin's response to a customer inspection request.
-- This is separate from the customer's original message.
alter table public.inspection_requests
  add column if not exists admin_note text;

comment on column public.inspection_requests.admin_note is
  'Admin response note for inspection availability, including the nearest available date.';
