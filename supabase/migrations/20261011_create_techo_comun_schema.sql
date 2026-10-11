-- Esquema del sistema de grupos y favoritos (ADR-0001, docs/00-gobierno/05-adr-0001-grupos-y-favoritos-con-supabase.md).
-- Aplicada el 2026-10-11 en el proyecto Supabase «techo-comun» (eu-west-3).
--
-- Acceso: RLS activado y SIN políticas, y permisos revocados a anon/authenticated.
-- Solo el servidor (clave service_role, nunca expuesta al navegador) lee y escribe estas tablas.
-- No añadas políticas para anon o authenticated sin revisar antes el ADR: abrirían los datos de todos los grupos.

create table public.grupos_cooperativos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table public.miembros (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos_cooperativos(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 60),
  password_hash text not null,
  created_at timestamptz not null default now(),
  unique (grupo_id, nombre)
);

create table public.favoritos (
  id uuid primary key default gen_random_uuid(),
  miembro_id uuid not null references public.miembros(id) on delete cascade,
  oferta_id text not null,
  datos jsonb not null,
  created_at timestamptz not null default now(),
  unique (miembro_id, oferta_id)
);

alter table public.grupos_cooperativos enable row level security;
alter table public.miembros enable row level security;
alter table public.favoritos enable row level security;

revoke all on public.grupos_cooperativos, public.miembros, public.favoritos from anon, authenticated;
