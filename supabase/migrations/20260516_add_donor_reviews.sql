create table if not exists public.donor_reviews (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations(id) on delete cascade,
  donor_id uuid not null references public.profiles(id) on delete cascade,
  ngo_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint donor_reviews_one_per_donation unique (donation_id)
);

create index if not exists donor_reviews_donor_id_idx
  on public.donor_reviews (donor_id);

create index if not exists donor_reviews_ngo_id_idx
  on public.donor_reviews (ngo_id);

-- Disable RLS to match the pattern of other Sharebite tables
-- (all access control is handled at the API route level)
alter table public.donor_reviews disable row level security;

comment on table public.donor_reviews is
  'NGO reviews of donors after delivered donations.';

comment on column public.donor_reviews.tags is
  'Optional NGO feedback tags such as Fresh food, Good packaging, Easy pickup, On-time, or Needs improvement.';
