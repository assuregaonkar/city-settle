-- CitySettle Phase 1 schema
-- Run this in the Supabase SQL editor for your project.

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  salary_inr int,
  office_lat float,
  office_lng float,
  office_address text,
  office_city text check (office_city in ('bengaluru', 'mumbai')),
  preferences jsonb default '{}',
  family_status text,
  chosen_neighborhood_id uuid,
  onboarded_at timestamptz,
  created_at timestamptz default now()
);

-- neighborhoods
create table if not exists public.neighborhoods (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  name text not null,
  lat float,
  lng float,
  avg_rent_1bhk int,
  avg_rent_2bhk int,
  safety_score numeric,
  aqi int,
  amenities jsonb,
  vibe_tags text[],
  unique (city, name)
);

-- recommendations
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade,
  neighborhood_id uuid references public.neighborhoods,
  score numeric,
  affordability_score numeric,
  commute_score numeric,
  safety_score numeric,
  aqi_score numeric,
  vibe_score numeric,
  commute_minutes int,
  rationale text,
  generated_at timestamptz default now()
);

-- chat_messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- checklist_items
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade,
  neighborhood_id uuid references public.neighborhoods,
  task text not null,
  category text,
  why text,
  completed boolean default false,
  order_index int,
  created_at timestamptz default now()
);

-- commute_cache
create table if not exists public.commute_cache (
  id uuid primary key default gen_random_uuid(),
  origin_lat numeric not null,
  origin_lng numeric not null,
  dest_id uuid references public.neighborhoods,
  hour_bucket int,
  duration_seconds int,
  fetched_at timestamptz default now(),
  unique (origin_lat, origin_lng, dest_id, hour_bucket)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.neighborhoods enable row level security;
alter table public.recommendations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.checklist_items enable row level security;
alter table public.commute_cache enable row level security;

-- profiles: users own their row
create policy "users_own_profile"
  on public.profiles for all
  using (auth.uid() = id);

-- neighborhoods: readable by all authenticated users; writable only by service_role (default)
create policy "neighborhoods_read_authenticated"
  on public.neighborhoods for select
  using (auth.role() = 'authenticated');

-- recommendations: users own their rows
create policy "users_own_recommendations"
  on public.recommendations for all
  using (auth.uid() = user_id);

-- chat_messages: users own their rows
create policy "users_own_chat_messages"
  on public.chat_messages for all
  using (auth.uid() = user_id);

-- checklist_items: users own their rows
create policy "users_own_checklist_items"
  on public.checklist_items for all
  using (auth.uid() = user_id);

-- commute_cache: readable by all authenticated users; writable only by service_role (default)
create policy "commute_cache_read_authenticated"
  on public.commute_cache for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- Auto-create profile row on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
