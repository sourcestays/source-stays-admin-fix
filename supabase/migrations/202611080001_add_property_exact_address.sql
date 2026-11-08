-- Store private exact property addresses used for post-confirmation hotel details.
alter table public.properties
  add column if not exists exact_address text;
