---
tipo: adr
estado_documental: vigente
proyecto: Techo Común
adr: 0006
estado: aceptada; implementada, verificada y desplegada en producción (19/10/2026, commit 4463c25)
fecha: 2026-10-19
ultima_revision: 2026-10-19
---

# ADR-0006: Familias en el grupo y varias personas administrando

## Contexto

- Cada persona tiene su usuario y su contraseña (ADR-0001), pero una familia son varias personas adultas (por ejemplo, madre, padre e hija). Hacía falta saber quién es de qué familia sin crear «usuarios de familia» ni compartir contraseñas.
- El número de familias de la cooperativa lo comparte todo el grupo (ADR-0004) y cualquier persona podía cambiarlo, aunque de él dependen la búsqueda por tamaño y las calculadoras.
- ADR-0004 fijaba una sola persona administradora por grupo, con un índice único. Una cooperativa necesita varias, y que ninguna pueda anular a otra.
- El 19/10/2026 el responsable aprobó el diseño: «n usuarios para la familia x, que se escribe cuando lo defines, y el número de familias lo gestiona la administración; puede haber más de una».

## Decisión

1. **Familia = texto libre en cada persona** (`miembros.familia`, hasta 60 caracteres, opcional). Se escribe al crear el grupo o al unirse, y se puede cambiar después («Cambiar mi familia»). No hay usuario ni contraseña de familia: cada persona sigue entrando con la suya.
2. **Agrupación sin distinguir mayúsculas, tildes ni espacios de más** (`src/lib/familias.ts`). Al unirse, si la familia escrita equivale a una existente, se guarda con la grafía existente, y se sugieren las existentes (`<datalist>`). La pestaña Grupo muestra a las personas agrupadas por familia, y los favoritos llevan nombre y familia de quien los marcó. Hay un filtro «Solo de mi familia».
3. **Quien aún no ha confirmado su identidad ve los nombres de familia que existen, pero no quién es de cuál**; la correspondencia solo la ven las personas identificadas (`GET /api/miembros`).
4. **El número de familias solo lo cambian quienes administran.** Lo fuerza el servidor (`PUT /api/grupos/datos`: si quien escribe no administra y el grupo ya tiene datos, se conserva el número guardado y se devuelve lo guardado). En la interfaz es de solo lectura para el resto, y todas las personas ven al lado cuántas familias hay registradas («2 de 12»).
5. **Varias personas administran.** Se elimina el índice único de administración. Quien administra puede nombrar a otra persona para administrar y renunciar ella misma. Reglas:
   - siempre queda al menos una persona administrando (no se puede renunciar siendo la única; si dos renuncian a la vez, se deshace la última);
   - **una administradora no puede quitar ni restablecer la contraseña de otra administradora**: solo puede renunciar ella misma (y entonces pasa a ser una persona más);
   - cada acción sigue exigiendo la contraseña personal de quien la hace;
   - el código de recuperación del grupo sigue igual (ADR-0004), y con él se puede cambiar la contraseña de cualquier persona, también de una administradora;
   - si quien administra borra su perfil y no queda ninguna otra administradora, pasa a administrar la persona que lleva más tiempo en el grupo (sin cambios).
6. **Grupos existentes:** `leida-vecinal` conserva a su administrador y las familias empiezan vacías; cada persona las indica desde «Indicar mi familia».

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Un código o usuario de familia compartido | Las personas de un hogar no podrían distinguirse en los favoritos y habría que compartir una contraseña. |
| Contar las familias solo a partir de las que se registran | Una cooperativa suele fijar antes el número de familias que cuántas han entrado a la aplicación. Se muestra ambos: el fijado y los registrados. |
| Que las administradoras puedan quitarse entre sí | Una administradora podría expulsar a las demás; la renuncia propia evita el conflicto. |
| Familia obligatoria en el servidor | Rompería a las personas ya existentes. Es obligatoria en los formularios de alta y opcional en el servidor. |

## Consecuencias

**Positivas**
- Un hogar entero puede estar en el grupo sin compartir contraseñas, y se ve cuántas familias han entrado de las previstas.
- El tamaño de la cooperativa, del que dependen la búsqueda y las calculadoras, no lo altera cualquiera.
- La administración deja de depender de una sola persona.

**Riesgos y límites aceptados**
- **Dato personal nuevo:** la familia (un apellido o nombre libre) se muestra a las demás personas identificadas del grupo. Va en el aviso de privacidad y en el dossier jurídico (`08`). Se recomienda no usar nombres completos.
- Los nombres de familia que existen son visibles para quien solo conoce la contraseña del grupo (no la correspondencia con las personas).
- Si dos administradoras renuncian a la vez la protección es de mejor esfuerzo (comprobación posterior), no una restricción de la base de datos.
- Quien administra puede nombrar a otra persona sin su consentimiento previo; la persona nombrada puede renunciar.

## Estado de implementación (19/10/2026)

| Aspecto | Implementado | Verificado | Desplegado |
| --- | --- | --- | --- |
| Migración `20261019_familias_y_varios_admin.sql` (columna `familia`, sin índice único de administración) | Sí | Aplicada en la base real; `leida-vecinal` intacto (1 persona, administradora, sin familia). El proyecto estaba pausado por inactividad y se reactivó | Sí (base de datos; aditiva) |
| Rutas `/api/miembros` (GET/POST), `/api/miembros/yo` (PATCH familia), `/api/grupos` (alta), `/api/grupos/admin` (`ascender`, `renunciar`; `quitar` y `restablecer` no alcanzan a administradoras), `/api/grupos/datos` (familias solo administración), `/api/favoritos` (familia) | Sí | `npm run test:e2e`: 99 comprobaciones en local y contra producción, incluidas las reglas de administración, las familias y la limpieza | Sí |
| Interfaz (familia al crear y unirse con sugerencias, «Personas y familias», filtro de favoritos, «Nombrar para administrar», «Renunciar a administrar», familias de solo lectura con «registradas de N») | Sí | Navegador en local con un grupo de prueba (borrado después): administradora edita, otra persona ve solo lectura y sin panel de administración, sugerencias y agrupación correctas | Sí (el fragmento con «Personas y familias» se sirve en producción) |
| Pruebas unitarias | Sí | 250 en verde (`familias.test.ts` y alta con familia) | — |

## Evidencia en el código

`supabase/migrations/20261019_familias_y_varios_admin.sql`, `src/lib/familias.ts`, `src/lib/validate.ts`, `src/app/api/grupos/admin/route.ts`, `src/app/api/grupos/datos/route.ts`, `src/app/api/miembros/route.ts`, `src/app/api/miembros/yo/route.ts`, `src/components/Grupo.tsx`, `src/components/Cooperativa.tsx`, `src/components/SyncDatosGrupo.tsx`, `scripts/e2e.mjs`.
