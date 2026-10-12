-- Roles de grupo, código de recuperación y datos compartidos de la cooperativa (ADR-0004,
-- docs/00-gobierno/09-adr-0004-roles-recuperacion-y-datos-compartidos.md).
--
-- Cambio aditivo: las columnas nuevas tienen valor por defecto, así que el código anterior sigue funcionando.
--  * miembros.es_admin: una sola persona administra cada grupo (índice único parcial).
--    En los grupos que ya existen administra quien se unió primero.
--  * grupos_cooperativos.recovery_hash: huella (bcrypt) del código de recuperación. Nunca se guarda el código.
--    Nulo en los grupos antiguos hasta que su administrador genere uno.
--  * grupos_cooperativos.datos: región, ciudad, familias y barrio que comparten las personas del grupo.
--    Los ingresos y el capital NO se guardan aquí.

alter table public.miembros add column es_admin boolean not null default false;
alter table public.grupos_cooperativos add column recovery_hash text;
alter table public.grupos_cooperativos add column datos jsonb not null default '{}'::jsonb;

update public.miembros m
   set es_admin = true
 where m.id = (
   select x.id from public.miembros x
    where x.grupo_id = m.grupo_id
    order by x.created_at, x.id
    limit 1
 );

create unique index miembros_un_admin_por_grupo on public.miembros (grupo_id) where es_admin;
