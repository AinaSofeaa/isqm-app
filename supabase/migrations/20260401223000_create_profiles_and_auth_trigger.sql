-- Profiles, institutions, RLS, and signup trigger

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  state text null
);

alter table public.institutions enable row level security;

drop policy if exists "Authenticated can read institutions" on public.institutions;
drop policy if exists "Public can read institutions" on public.institutions;
create policy "Public can read institutions"
  on public.institutions
  for select
  to anon, authenticated
  using (true);

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

alter table public.profiles add column if not exists full_name text null;
alter table public.profiles add column if not exists role text null;
alter table public.profiles add column if not exists institution text null;
alter table public.profiles add column if not exists user_type text null;
alter table public.profiles add column if not exists institution_id uuid null references public.institutions (id);
alter table public.profiles add column if not exists company_name text null;
alter table public.profiles add column if not exists phone text null;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;

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
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_type text;
  v_institution_id uuid;
  v_institution_name text;
  v_company_name text;
begin
  v_user_type := nullif(trim(new.raw_user_meta_data ->> 'user_type'), '');
  if v_user_type not in ('student', 'worker') then
    v_user_type := null;
  end if;

  if v_user_type = 'student'
    and coalesce(new.raw_user_meta_data ->> 'institution_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then
    select i.id, i.name
      into v_institution_id, v_institution_name
      from public.institutions i
      where i.id = (new.raw_user_meta_data ->> 'institution_id')::uuid;
  end if;

  if v_user_type = 'worker' then
    v_company_name := nullif(trim(new.raw_user_meta_data ->> 'company_name'), '');
  end if;

  insert into public.profiles (
    id,
    full_name,
    phone,
    role,
    institution,
    user_type,
    institution_id,
    company_name
  )
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'role'), ''),
    case when v_user_type = 'student' then v_institution_name else null end,
    v_user_type,
    case when v_user_type = 'student' then v_institution_id else null end,
    case when v_user_type = 'worker' then v_company_name else null end
  )
  on conflict (id) do update
  set full_name = coalesce(public.profiles.full_name, excluded.full_name),
      phone = coalesce(public.profiles.phone, excluded.phone),
      role = coalesce(public.profiles.role, excluded.role),
      institution = coalesce(public.profiles.institution, excluded.institution),
      user_type = coalesce(public.profiles.user_type, excluded.user_type),
      institution_id = coalesce(public.profiles.institution_id, excluded.institution_id),
      company_name = coalesce(public.profiles.company_name, excluded.company_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();
