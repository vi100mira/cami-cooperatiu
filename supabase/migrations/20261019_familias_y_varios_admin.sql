-- Familias y varias personas administradoras (ADR-0006).
-- Cada persona del grupo puede indicar a qué familia pertenece (texto libre, opcional).
-- Un grupo puede tener varias personas administradoras: se quita el índice que limitaba a una.
alter table public.miembros
  add column if not exists familia text check (familia is null or char_length(familia) between 1 and 60);

drop index if exists public.miembros_un_admin_por_grupo;
