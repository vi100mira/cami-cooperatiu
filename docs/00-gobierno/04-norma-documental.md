---
tipo: norma-documental
estado_documental: vigente
proyecto: Techo Común
ultima_revision: 2026-10-10
---

# Norma documental de Techo Común

## Capas

- `docs/00-gobierno/`: verdad ejecutiva y estado fechado.
- Código y tests: evidencia de implementación y comportamiento.
- `README.md`: desarrollo, coste y despliegue.
- `docs/USUARIOS-Y-COOPERATIVAS.md`: decisión de arquitectura de cuentas.
- Cúpula Profesional: ficha resumen; no copia del repositorio.

## Convenciones

- Español; fechar toda afirmación de estado.
- Distinguir `implementado`, `verificado` y `desplegado`.
- Nunca incluir claves (`FIRECRAWL_API_KEY`), `.env.local` ni datos de grupos.

## Matriz de actualización

| Cambio | Actualización mínima |
| --- | --- |
| Nueva capacidad o pestaña | Memoria y estado |
| Portales, búsqueda o límites de coste | Decisiones/riesgos, estado y README |
| Variables o configuración de Vercel | Estado |
| Cuentas, datos o privacidad | Decisiones/riesgos y `USUARIOS-Y-COOPERATIVAS.md` |

## Revisión mínima

1. `git pull` y `git status`.
2. `npm test`, `npm run typecheck` y `npm run build`.
3. Actualizar estado y fecha.
4. Actualizar la ficha en la Cúpula Profesional.
