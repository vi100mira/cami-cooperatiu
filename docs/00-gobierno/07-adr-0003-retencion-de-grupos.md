---
tipo: adr
estado_documental: vigente
proyecto: Techo Común
adr: 0003
estado: aceptada; migración aplicada en la base de datos; código verificado en local y pendiente del despliegue final (12/10/2026)
fecha: 2026-10-12
ultima_revision: 2026-10-12
---

# ADR-0003: Los grupos no caducan solos; se anota su actividad y se pueden purgar a mano

## Contexto

- Los grupos guardan nombres o alias en servidor (ADR-0001). El aviso de privacidad decía que se conservan «hasta que borres tu perfil» y que el grupo se borra cuando se va la última persona, pero un grupo abandonado con gente dentro se conservaría indefinidamente.
- Se barajó una caducidad automática (6, 12 o 24 meses sin actividad). No hay correo, así que no se puede avisar a nadie antes de borrar, y un grupo en pausa podría perder sus favoritos sin enterarse.
- El 12/10/2026 el responsable decidió **no caducar automáticamente** y dejar **solo preparada la función** de borrado, para ejecutarla a mano.

## Decisión

1. **Sin caducidad automática.** Nada se borra solo.
2. **Se anota la última actividad de cada grupo** en `grupos_cooperativos.ultima_actividad`: al entrar al grupo, al confirmar una persona y al marcar o quitar un favorito. Lo hace el servidor (`anotarActividad`) y nunca hace fallar la petición.
3. **Dos funciones de administración** (`supabase/migrations/20261012_actividad_y_purga_manual.sql`):
   - `public.grupos_inactivos(meses)`: lista los grupos sin actividad durante ese plazo, sin borrar nada.
   - `public.purgar_grupos_inactivos(meses)`: los borra, con sus miembros y favoritos en cascada y devolviendo lo borrado.
   Ambas exigen un plazo mínimo de 3 meses y solo las puede ejecutar quien administra la base de datos o usa la clave de servicio: se revocó el permiso a `anon`, `authenticated` y `public`.
4. **El aviso de privacidad lo dice** con claridad: no hay plazo automático, se anota la fecha de última actividad y el responsable puede borrar a mano los grupos que lleven mucho tiempo sin usarse.

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Borrado automático diario con `pg_cron` tras 12 meses | Habría sido más favorable a la minimización de datos, pero borra datos sin aviso posible y es un cambio de comportamiento en producción que el responsable prefirió no activar. Queda como evolución. |
| No anotar actividad y no tener función | Obligaría a decidir a ciegas qué grupo está abandonado. |
| Anotar la actividad con cada petición de lectura | Escribiría en la base en cada visita; basta con las acciones que muestran uso real. |

## Consecuencias

**Positivas**
- La decisión de borrar un grupo se toma con datos, sin automatismos que borren por sorpresa.
- La purga es reversible hasta el momento de ejecutarla: primero se consulta y después se borra.

**Riesgos y límites aceptados**
- **Conservación indefinida por defecto.** Sin plazo automático, los datos de un grupo abandonado se conservan mientras nadie ejecute la purga. El principio de limitación del plazo de conservación del RGPD pide un criterio; el criterio actual es «hasta que se borre el perfil o el responsable purgue», que conviene validar en la revisión jurídica.
- **Depende de una persona.** Si nadie ejecuta la purga, no ocurre. Conviene fijar una rutina (por ejemplo, revisar cada año con `grupos_inactivos(12)`).
- **Actividad solo aproximada:** leer los favoritos sin marcar nada no cuenta como actividad.

## Estado de implementación (12/10/2026)

| Aspecto | Implementado | Verificado | Desplegado |
| --- | --- | --- | --- |
| Migración (columna, índice y funciones) | Sí | En la base real: la vista previa solo lista el grupo viejo, un plazo menor de 3 meses se rechaza, la purga borra el grupo y sus miembros en cascada y conserva el reciente; sin avisos nuevos de seguridad y la clave pública recibe «permiso denegado» al invocar las funciones | Sí (aplicada en producción el 12/10/2026) |
| Anotación de la actividad y aviso de privacidad | Sí | `npm run test:e2e` comprueba que la fecha avanza tras marcar un favorito | Pendiente del despliegue final |

## Pendiente

1. Validar con la revisión jurídica que este criterio de conservación es suficiente.
2. Fijar una rutina de revisión de grupos inactivos.
3. Valorar el borrado automático si hubiera muchos grupos.

## Evidencia en el código

`supabase/migrations/20261012_actividad_y_purga_manual.sql`, `src/lib/supabase.ts` (`anotarActividad`), las rutas `src/app/api/{grupos/entrar,miembros/entrar,favoritos}`, `src/components/Privacidad.tsx` y `scripts/e2e.mjs`.
