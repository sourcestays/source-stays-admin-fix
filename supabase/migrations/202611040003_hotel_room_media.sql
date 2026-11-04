-- Add room-specific media and occupancy to hotel room categories.
-- Existing shortlet/property media columns and uploads remain unchanged.

alter table public.hotel_room_categories
  add column if not exists max_guests integer not null default 2
    check (max_guests between 1 and 20),
  add column if not exists photo_urls text[] not null default '{}',
  add column if not exists video_url text;

