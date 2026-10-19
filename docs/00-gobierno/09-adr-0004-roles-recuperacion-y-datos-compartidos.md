---
tipo: adr
estado_documental: vigente
proyecto: Techo Común
adr: 0004
estado: aceptada; implementada, verificada y desplegada en producción (12/10/2026, commit 0364482)
fecha: 2026-10-12
ultima_revision: 2026-10-12
---

# ADR-0004: Administración del grupo, código de recuperación y datos de la cooperativa compartidos

> **Actualizada por [ADR-0006](11-adr-0006-familias-y-varias-administraciones.md) (19/10/2026):** ya no hay una sola persona administradora por grupo (se retiró el índice único) y el número de familias solo lo cambian quienes administran. El resto de esta decisión sigue vigente.

## Contexto

- ADR-0001 dejó dos huecos: no había administración (nadie podía quitar a una persona ni restablecer su contraseña) y una contraseña perdida no se podía recuperar, porque no hay correo.
- Los datos de la tarjeta «Tu cooperativa» (comunidad, ciudad, familias y barrio) vivían solo en el navegador de cada persona, así que cada una veía unas cifras distintas aunque fueran del mismo grupo.
- El 12/10/2026 el responsable eligió: administra el grupo quien lo crea, y se comparten los datos de la cooperativa sin los ingresos.

## Decisión

1. **Una persona administra cada grupo.** Quien lo crea. Si se va, pasa a administrarlo la que lleva más tiempo en el grupo. En los grupos que ya existían, la que se unió primero (la migración lo asigna). Un índice único parcial garantiza una sola persona administradora por grupo.
2. **La administración permite:** quitar a una persona (se borran también sus favoritos), restablecer su contraseña personal y generar un código de recuperación nuevo. Cada acción exige la contraseña personal de quien administra, además de la sesión: no basta con un navegador abierto.
3. **Código de recuperación del grupo.** Se genera al crear el grupo (20 caracteres sin letras ambiguas, unos 100 bits) y se enseña **una sola vez**; en la base solo se guarda su huella bcrypt. Sirve, sin haber entrado, para cambiar la contraseña de una persona (por ejemplo la de quien administra) o la del grupo. Es de **un solo uso**: al usarlo se genera otro. Límite de 5 intentos cada 15 minutos por IP y por grupo.
4. **Cambiar la propia contraseña**, conociendo la actual.
5. **Datos de la cooperativa compartidos** en `grupos_cooperativos.datos` (JSON con lista blanca: comunidad, ciudad, familias y barrio). Los ingresos, el capital y el nombre de la cooperativa no se guardan. Al identificarse una persona manda lo que ya tenga el grupo; si no tiene nada se guardan los datos de esa persona; después cada cambio se guarda con una pequeña espera y gana el último que escribe. Cualquier persona identificada del grupo puede leerlos y escribirlos.
6. **El aviso de privacidad** recoge los datos nuevos, el rol, el código y las acciones de administración.

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Solo código de recuperación, sin roles | Nadie podría quitar a una persona que se ha ido del grupo. |
| Un código de recuperación por persona | Más cosas que guardar y perder; el código del grupo con una persona administradora cubre los casos reales. |
| Dejar todo como estaba | Una contraseña perdida obligaba a pedir un cambio a mano en la base de datos. |
| Compartir también los ingresos y el capital | Son datos económicos de familias concretas; se decidió que se queden en cada navegador. |
| Sincronizar en tiempo real | Complejidad innecesaria para un grupo pequeño; basta con cargar al entrar. |

## Consecuencias

**Positivas**
- Se puede resolver una contraseña perdida o una baja sin tocar la base de datos.
- Todas las personas del grupo ven la misma región, ciudad, familias y barrio.

**Riesgos y límites aceptados**
- **El código de recuperación es un secreto de grupo.** Quien lo tenga y conozca el identificador del grupo puede cambiar contraseñas. Se enseña una vez, se guarda cifrado y se renueva al usarlo, pero depende de que el grupo lo guarde bien.
- **Los grupos anteriores a este cambio no tienen código** hasta que su administradora lo genere desde «Administrar el grupo».
- **Gana el último que escribe** en los datos compartidos y no hay avisos de conflicto ni actualización en vivo: otra persona los ve al cargar la página.
- **La confianza sigue siendo de contraseñas:** quien conozca la del grupo y la de una persona entra como ella (ADR-0001).
- **Nuevo tratamiento de datos:** comunidad, ciudad, familias, barrio, centro de acción y distancia máxima no identifican por sí solos a una persona, pero junto al nombre del grupo pueden orientar sobre una cooperativa concreta. Va en el aviso y en el dossier jurídico.

## Estado de implementación (12/10/2026)

| Aspecto | Implementado | Verificado | Desplegado |
| --- | --- | --- | --- |
| Migración (`20261012_roles_recuperacion_y_datos.sql`) | Sí | Aplicada en la base real: un solo administrador por grupo, incluido el grupo existente | Sí (base de datos; aditiva, el código anterior sigue funcionando) |
| Rutas `/api/grupos/admin`, `/api/grupos/recuperar`, `/api/grupos/datos`, `/api/miembros/yo` (PATCH) y traspaso de administración | Sí | `npm run test:e2e`: 64 comprobaciones, incluida la recuperación con código de un solo uso, el aislamiento entre grupos y el traspaso, en local y contra producción | Sí (12/10/2026) |
| Interfaz (código al crear, «He olvidado una contraseña», «Administrar el grupo», «Cambiar mi contraseña», sincronización de datos) | Sí | Navegador en local: alta, código visible una vez, panel de administración, datos sembrados en la base; vista de móvil sin desbordamiento. En producción solo se comprobó que las rutas nuevas responden y la prueba e2e | Sí (12/10/2026) |

## Pendiente

1. ~~Desplegar~~ Hecho el 12/10/2026.
2. La administradora del grupo existente (`leida-vecinal`) debe generar su código de recuperación desde «Administrar el grupo».
3. Validar en la revisión jurídica el aviso ampliado (dossier `08`).
4. Valorar actualizar los datos compartidos al volver a la pestaña, o avisar de conflictos, si hay uso real.

## Evidencia en el código

`supabase/migrations/20261012_roles_recuperacion_y_datos.sql`, `src/lib/admin.ts`, `src/lib/auth.ts` (`generarCodigo`), `src/lib/validate.ts` (`validarDatosGrupo`), las rutas de `src/app/api/grupos/{admin,recuperar,datos}` y `src/app/api/miembros/yo`, `src/components/Grupo.tsx`, `src/components/SyncDatosGrupo.tsx` y `scripts/e2e.mjs`.
