# Modelo de usuarios y cooperativas (decisión de arquitectura)

> Actualizado el 11/10/2026. Este documento describe el modelo **vigente** y la evolución prevista. La decisión, las alternativas y los riesgos están en [ADR-0001](00-gobierno/05-adr-0001-grupos-y-favoritos-con-supabase.md). Estado: implementado y verificado en local; **no desplegado**.

## Modelo vigente: grupos con contraseña (MVP basado en confianza)

**Grupo = cooperativa; persona = miembro del grupo.** Sin correo ni OAuth: se entra con una contraseña de grupo y se confirma la identidad con una contraseña personal.

### Qué vive dónde

| Dato | Dónde | Por qué |
| --- | --- | --- |
| Ruta, calculadoras, candidatos e ingresos de las familias | Solo en el navegador (`localStorage`) | No hace falta compartirlos todavía y evita guardar datos sensibles en servidor |
| Grupo, miembros y favoritos | Supabase (Postgres, UE) | Es lo que el grupo comparte |

Un navegador sigue siendo un grupo para los datos de la primera fila: no se sincronizan entre personas.

### Modelo de datos (Postgres)

- `grupos_cooperativos(id, nombre, slug único, password_hash, created_at)`
- `miembros(id, grupo_id → grupos_cooperativos, nombre, password_hash, created_at)`, nombre único dentro del grupo
- `favoritos(id, miembro_id → miembros, oferta_id, datos jsonb, created_at)`, una fila por persona y oferta

`datos` solo admite una lista blanca: título, zona, precio, m², portal, enlace https y tipo. El esquema está en `supabase/migrations/`. Los borrados son en cascada: al borrar un grupo se van sus miembros y favoritos; al borrar un miembro, sus favoritos.

### Flujo de acceso

1. **Entrar al grupo** con su identificador y la contraseña de grupo. También se puede **crear un grupo** (con el primer miembro) o **añadirse** a uno existente.
2. **Elegir quién eres** entre los miembros y escribir la contraseña personal.
3. **Ver los favoritos del grupo**, cada uno con el nombre de quien lo marcó, con filtro «todos / solo los míos». El corazón del buscador marca y quita favoritos propios.

La sesión es una cookie firmada (`httpOnly`, `sameSite=strict`, 12 h) que lleva el grupo y, tras confirmar identidad, el miembro.

### Aislamiento y seguridad

- **El navegador nunca habla con la base.** RLS activado y **sin políticas**, y permisos revocados a `anon` y `authenticated`. El acceso pasa por rutas de servidor con la clave `service_role`.
- **Por qué no hay políticas RLS por grupo:** sin Supabase Auth, la base no sabe qué usuario hace cada petición, así que RLS no puede expresar «solo los datos de mi grupo». El aislamiento por grupo lo hace el servidor a partir de la sesión firmada. La seguridad depende, por tanto, de que `SUPABASE_SERVICE_ROLE_KEY` y `AUTH_SECRET` no salgan del servidor.
- Contraseñas con bcrypt (coste 12), nunca en texto plano. Errores de acceso genéricos y límite de intentos por IP (en memoria, por instancia).

### Límites conocidos

- Quien conozca la contraseña del grupo y la de una persona entra como ella.
- No hay recuperación de contraseña (no hay correo) ni roles de administración.
- Los datos de ruta, calculadoras y candidatos no se comparten entre personas ni dispositivos.

### Datos personales

Solo el nombre del grupo, el nombre o alias de cada persona, las contraseñas cifradas y los favoritos. No se piden correo, teléfono, DNI, ingresos ni datos bancarios, y los ingresos de las calculadoras siguen siendo locales. Hay aviso de privacidad visible y cada persona puede borrar su perfil desde la pestaña «Grupo»; si es la última, el grupo también se borra. **Pendiente antes de abrirlo al público:** identificar al responsable con un contacto y revisión jurídica.

## Fase 1b: exportar e importar el estado local (pendiente, sin servidor)

- Exportar/importar los datos del navegador (ruta, calculadoras, candidatos) como un archivo JSON: copia de seguridad y paso de un dispositivo a otro o a otra persona del grupo.
- Varios grupos por navegador con un selector: la clave de `localStorage` pasa a incluir el id del grupo.

## Evolución prevista: cuentas con Supabase Auth

El planteamiento original del 10/10/2026 queda como evolución para cuando haya usuarios reales. Mejora la seguridad respecto al modelo vigente (RLS real y sin contraseñas que custodiar), a cambio de gestionar correo y soporte.

Modelo de datos (Postgres):
- `profiles(id = auth.uid, nombre)`
- `groups(id, nombre, region, ciudad, created_by)`
- `memberships(group_id, user_id, rol: 'admin' | 'miembro')`
- `group_data(group_id, data jsonb, updated_at)`: progreso, candidatos y calculadoras (el mismo objeto que hoy está en `localStorage`).

**Aislamiento:** Row Level Security en cada tabla: se puede leer o escribir una fila solo si existe una `membership` del usuario para ese `group_id`. La seguridad vive en la base de datos, no en el código de la app, así un fallo de frontend no abre datos de otros grupos. Invitar a una persona = enlace de invitación de un solo uso que crea su `membership`.

**Autenticación:** enlace mágico por correo (sin contraseñas que custodiar).

**Stack y coste:** Supabase (Auth + Postgres + RLS) en plan gratuito. Con el plan gratuito no se factura por excedente: al llegar a los límites el proyecto se limita o pausa. Condiciones para no recibir una factura: no pasar a un plan de pago, no activar complementos de pago y fijar alertas de uso.

**Colaboración simultánea:** basta «último en guardar gana» con aviso si hay una versión más reciente; edición en tiempo real solo si se pide.

**Migración desde el modelo vigente:** los grupos y miembros actuales no tienen correo, así que habría que invitarlos a vincular una cuenta. Conviene decidirlo antes de que haya muchos grupos.
