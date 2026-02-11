-- Calculations history table + RLS
create extension if not exists "pgcrypto";

create table if not exists public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
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

create index if not exists calculations_user_id_created_at_idx
  on public.calculations (user_id, created_at desc);

alter table public.calculations enable row level security;

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

drop policy if exists "Users can update their own calculations" on public.calculations;
create policy "Users can update their own calculations"
  on public.calculations
  for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own calculations" on public.calculations;
create policy "Users can delete their own calculations"
  on public.calculations
  for delete
  to authenticated
  using (auth.uid() = user_id);
