alter table public.calculations
  add column if not exists context_key text null,
  add column if not exists project_location text null,
  add column if not exists reference_remark text null;

create index if not exists calculations_user_id_type_context_created_at_idx
  on public.calculations (user_id, type, context_key, created_at desc);
