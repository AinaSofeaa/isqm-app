-- ISQM-App: Supabase schema + RLS policies

-- 1) Table
create table if not exists public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('beam','column','slab','concrete','formwork','rebar')),
  label text not null,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb not null default '{}'::jsonb,
  result double precision not null,
  unit text not null,
  created_at timestamptz not null default now()
);

alter table public.calculations add column if not exists outputs jsonb not null default '{}'::jsonb;
alter table public.calculations drop constraint if exists calculations_type_check;
alter table public.calculations add constraint calculations_type_check
  check (type in ('beam','column','slab','concrete','formwork','rebar'));

-- Helpful index for listing by user
create index if not exists calculations_user_id_created_at_idx
  on public.calculations (user_id, created_at desc);

-- 2) Row Level Security
alter table public.calculations enable row level security;

-- 3) Policies
drop policy if exists "Users can read their own calculations" on public.calculations;
create policy "Users can read their own calculations"
  on public.calculations
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own calculations" on public.calculations;
create policy "Users can insert their own calculations"
  on public.calculations
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own calculations" on public.calculations;
create policy "Users can delete their own calculations"
  on public.calculations
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 4) Institutions table
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  state text null
);

-- 5) Institutions RLS
alter table public.institutions enable row level security;

drop policy if exists "Authenticated can read institutions" on public.institutions;
drop policy if exists "Public can read institutions" on public.institutions;
create policy "Public can read institutions"
  on public.institutions
  for select
  to anon, authenticated
  using (true);

-- 6) Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text null,
  role text null,
  institution text null,
  user_type text null,
  institution_id uuid null references public.institutions (id),
  company_name text null,
  phone text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure new columns exist when table already created
alter table public.profiles add column if not exists user_type text null;
alter table public.profiles add column if not exists institution_id uuid null references public.institutions (id);
alter table public.profiles add column if not exists company_name text null;

-- 7) Row Level Security
alter table public.profiles enable row level security;

-- 8) Policies
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);

-- 9) Create profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 10) Keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();
