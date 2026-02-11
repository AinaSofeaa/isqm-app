-- Allow element-based calculation types used by the app
alter table public.calculations drop constraint if exists calculations_type_check;
alter table public.calculations
  add constraint calculations_type_check
  check (type in ('beam','column','slab','concrete','formwork','rebar'));
