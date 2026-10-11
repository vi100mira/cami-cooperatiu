---
tipo: norma-documental
estado_documental: vigente
proyecto: Techo Común
ultima_revision: 2026-10-11
---

# Norma documental de Techo Común

## Capas

- `docs/00-gobierno/`: verdad ejecutiva y estado fechado.
- Código y tests: evidencia de implementación y comportamiento.
- `README.md`: desarrollo, coste y despliegue.
- `docs/00-gobierno/NN-adr-NNNN-*.md`: decisiones de arquitectura con alternativas y consecuencias (una por archivo; el prefijo continúa la numeración de los documentos de gobierno).
- `src/lib/normativa.ts`: normativa urbanística por comunidad. Es dato con fuente: cada cifra lleva artículo, enlace, fecha de consulta y fiabilidad.
- `supabase/migrations/`: esquema de la base de datos, tal como se aplicó.
- `docs/USUARIOS-Y-COOPERATIVAS.md`: modelo de usuarios y grupos, y su evolución.
- Cúpula Profesional: ficha resumen; no copia del repositorio.

## Convenciones

- Español; fechar toda afirmación de estado.
- Distinguir `implementado`, `verificado` y `desplegado`.
- Nunca incluir claves (`FIRECRAWL_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`), `.env.local` ni datos de grupos o de sus miembros.

## Matriz de actualización

| Cambio | Actualización mínima |
| --- | --- |
| Nueva capacidad o pestaña | Memoria y estado |
| Portales, búsqueda o límites de coste | Decisiones/riesgos, estado y README |
| Variables o configuración de Vercel | Estado |
| Cuentas, datos o privacidad | Decisiones/riesgos, `USUARIOS-Y-COOPERATIVAS.md` y el ADR correspondiente |
| Cambio en el esquema de la base de datos | Nueva migración en `supabase/migrations/`, ADR si cambia el modelo de acceso, y README |
| Decisión de arquitectura nueva | Nuevo ADR y entrada en el índice |
| Nueva comunidad o cambio de una cifra urbanística | Datos en `normativa.ts` con artículo, enlace y fecha de consulta, estado en la memoria y revisión de la fecha en el ADR-0002 |

## Revisión mínima

1. `git pull` y `git status`.
2. `npm test`, `npm run typecheck` y `npm run build`.
3. Actualizar estado y fecha.
4. Actualizar la ficha en la Cúpula Profesional.
