-- Actividad de los grupos y purga MANUAL de los inactivos (ADR-0003).
-- No hay caducidad automática: nada se borra solo. Estas funciones las ejecuta quien administra la base de datos.
--
-- Cuenta como actividad: entrar al grupo, confirmar una persona y marcar o quitar un favorito
-- (lo registra el servidor con `ultima_actividad`).

alter table public.grupos_cooperativos
  add column ultima_actividad timestamptz not null default now();

create index grupos_cooperativos_ultima_actividad_idx on public.grupos_cooperativos (ultima_actividad);

-- Ver qué grupos llevan más de `meses` sin actividad, sin borrar nada.
create or replace function public.grupos_inactivos(meses integer)
returns table (slug text, nombre text, ultima_actividad timestamptz, miembros bigint)
language plpgsql
set search_path = ''
as $$
begin
  if meses is null or meses < 3 then
    raise exception 'El plazo mínimo es de 3 meses';
  end if;
  return query
    select g.slug, g.nombre, g.ultima_actividad, (select count(*) from public.miembros m where m.grupo_id = g.id)
    from public.grupos_cooperativos g
    where g.ultima_actividad < now() - make_interval(months => meses)
    order by g.ultima_actividad;
end;
$$;

-- Borrar los grupos con más de `meses` sin actividad. Los miembros y favoritos se van en cascada.
create or replace function public.purgar_grupos_inactivos(meses integer)
returns table (slug text, ultima_actividad timestamptz)
language plpgsql
set search_path = ''
as $$
begin
  if meses is null or meses < 3 then
    raise exception 'El plazo mínimo es de 3 meses';
  end if;
  return query
    delete from public.grupos_cooperativos g
    where g.ultima_actividad < now() - make_interval(months => meses)
    returning g.slug, g.ultima_actividad;
end;
$$;

-- Solo la clave de servicio o quien administra la base de datos puede ejecutarlas.
revoke all on function public.grupos_inactivos(integer) from public, anon, authenticated;
revoke all on function public.purgar_grupos_inactivos(integer) from public, anon, authenticated;
