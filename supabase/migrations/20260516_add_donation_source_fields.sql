alter table public.donations
  add column if not exists donor_type text not null default 'restaurant_business'
    check (donor_type in ('restaurant_business', 'individual', 'event_organizer')),
  add column if not exists food_source_name text;

comment on column public.donations.donor_type is
  'Demo donor source type: restaurant/business, individual, or event organizer.';

comment on column public.donations.food_source_name is
  'For individual donors, where the food was bought from.';
