---
tipo: estado-operativo
estado_documental: vigente
proyecto: Techo Común
ultima_revision: 2026-10-10
---

# Estado operativo y hoja de ruta

## Fotografía a 10/10/2026

- Fase: **MVP en desarrollo**, un solo desarrollador, sin usuarios externos.
- 34 commits entre el 9 y el 10 de octubre de 2026; último `3c2a12e` (botones de contacto con FECOVI).
- Producción: https://cami-cooperatiu.vercel.app responde 200.

| Capacidad | Implementado | Verificado | Desplegado |
| --- | --- | --- | --- |
| Ruta de 6 fases | Sí | Build | Sí |
| Calculadoras | Sí | Tests (`calc`, `fit`) y revisión manual en escritorio y móvil | Sí |
| Oportunidades y vías | Sí | Revisión manual | Sí |
| Búsqueda en vivo | Sí | Tests de parsers, `merge` y `guards` | **Sin confirmar si `SEARCH_ENABLED=true` en Vercel** |
| Catastro | Sí | Tests (`catastro`) | Sí |
| Entidades por comunidad | Sí | Tests (`content`) | Sí |
| FAQ y glosario | Sí | Tests (`faq`) | Sí |

## Puertas de calidad (10/10/2026, Node 20, copia local)

- `npm ci`: 0 vulnerabilidades.
- `npm test`: 42 tests en 10 archivos, todos pasan.
- `npm run typecheck`: sin errores.
- `npm run build`: correcto (`/`, `/api/buscar`, `/api/catastro`).
- No hay CI propia; Vercel compila en cada push.

## Cambios del 10/10/2026 (tarde)

Revisión de las calculadoras tras detectar que confundían lo comunitario con lo familiar:

- Cuota: cifras separadas en «Toda la cooperativa» y «Cada familia».
- Presupuesto: recuerda de dónde sale la cuota y separa «¿Puede optar a un concurso?» de «¿Puede pagar la cuota?», con aviso si no es asumible.
- Cooperativa frente a alquiler: pasa de gasto acumulado a cuota mensual (tabla de momentos clave y gráfico con el fin del préstamo marcado); el campo pasa a «Alquiler de un piso parecido, ya reformado» y se explica por qué la comparación es válida; horizonte por defecto de 40 años.

- Búsqueda en vivo: siempre en toda la provincia; el selector «Toda la provincia / Solo la ciudad» se retira y los filtros (municipio o barrio, precio, viviendas, orden) aparecen después, como ajuste fino sin gastar consultas. Gasto máximo teórico: 7 créditos/día.

## Pendiente de confirmar

- Si la búsqueda en vivo está activa en producción: `SEARCH_ENABLED` y `FIRECRAWL_API_KEY` existen en Vercel (producción), valor del interruptor no leído.
- Si una sola página por portal da suficientes anuncios al filtrar por municipio.

## Hoja de ruta

1. Confirmar el estado de la búsqueda en producción y del plan de Firecrawl (gratuito, sin recarga automática).
2. Fase 1b: exportar/importar los datos del grupo en JSON y varios grupos por navegador.
3. Revisar términos de uso de los portales antes de abrir la búsqueda al público.
4. Primeros testers externos.
5. Datos propios de otras comunidades autónomas en `entitiesFor`.
6. Fase 2: cuentas y grupos con Supabase y RLS. Con el objetivo de gestionar grupos, deja de ser opcional; falta decidir cuándo.
