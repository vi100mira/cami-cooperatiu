---
tipo: estado-operativo
estado_documental: vigente
proyecto: Techo Común
ultima_revision: 2026-10-11
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

## Cambios del 11/10/2026: grupos y favoritos con Supabase

Decisión en [ADR-0001](05-adr-0001-grupos-y-favoritos-con-supabase.md). Commits `ce485ab` (código) y `3e5bf21` (documentación) en `main`; desplegado en producción el 11/10/2026 (despliegue Ready en `cami-cooperatiu.vercel.app`, commit `3e5bf21`).

| Capacidad | Implementado | Verificado | Desplegado |
| --- | --- | --- | --- |
| Esquema y RLS en Supabase (`techo-comun`, `eu-west-3`) | Sí | Aviso informativo «RLS sin política» (intencionado); la clave pública recibe `42501` al leer y escribir | Sí (base de datos) |
| Alta, entrada, miembros y sesión (`/api/grupos`, `/api/miembros`, `/api/sesion`) | Sí | 29 comprobaciones de extremo a extremo contra la base real; tests de `auth` y `validate` | Sí (11/10/2026) |
| Favoritos con corazón y filtro «todos / solo los míos» (`/api/favoritos`) | Sí | Navegador contra la base real (persiste tras recargar, aislamiento entre grupos) con la búsqueda simulada | Sí (11/10/2026) |
| Pestaña «Grupo» y aviso de privacidad | Sí | Navegador en escritorio y móvil (sin desbordamiento horizontal) | Sí (11/10/2026) |
| Borrar mi perfil (cascada; borra el grupo si era la última persona) | Sí | Navegador contra la base real | Sí (11/10/2026) |

Puertas de calidad (11/10/2026, Node 20, copia local): `npm test` 63 tests en 13 archivos, `npm run typecheck` sin errores y `npm run build` correcto (añade `/api/favoritos`, `/api/grupos`, `/api/grupos/entrar`, `/api/miembros`, `/api/miembros/entrar`, `/api/miembros/yo` y `/api/sesion`).

Decisiones de interfaz del 11/10/2026: el botón «Apuntar como candidato» se conserva junto al corazón, porque alimenta el embudo de candidatos y no es un favorito. Los datos de ruta, calculadoras y candidatos siguen sin sincronizarse entre personas.

## Pendiente de confirmar

- Variables de Vercel para los grupos: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `AUTH_SECRET` añadidas el 11/10/2026 solo en el entorno Production (las dos claves como *sensitive*; `AUTH_SECRET` con un valor distinto del local). No hay nada en Preview ni Development. Prueba de humo en producción el 11/10/2026 (10 comprobaciones: portada, base alcanzable, alta, cookie `httpOnly` y `Secure`, sesión firmada, favorito, borrado de perfil y de grupo) con datos de prueba que se borraron; la base quedó con 0 filas. La interfaz no se recorrió en el navegador en producción.
- Responsable del tratamiento y contacto en el aviso de privacidad, y revisión jurídica, antes de abrir los grupos al público.
- Si la búsqueda en vivo está activa en producción: `SEARCH_ENABLED` y `FIRECRAWL_API_KEY` existen en Vercel (producción), valor del interruptor no leído.
- Si una sola página por portal da suficientes anuncios al filtrar por municipio.

## Hoja de ruta

1. Confirmar el estado de la búsqueda en producción y del plan de Firecrawl (gratuito, sin recarga automática).
2. Fase 1b: exportar/importar los datos del grupo en JSON y varios grupos por navegador.
3. Revisar términos de uso de los portales antes de abrir la búsqueda al público.
4. Primeros testers externos.
5. Datos propios de otras comunidades autónomas en `entitiesFor`.
6. Datos del responsable en el aviso de privacidad y revisión jurídica antes de abrir los grupos al público (ver ADR-0001). Los grupos ya están desplegados desde el 11/10/2026.
7. Llevar la prueba de extremo a extremo al repositorio y decidir roles de grupo y recuperación de contraseña.
8. Valorar Supabase Auth (enlace mágico y RLS por usuario) cuando haya usuarios reales. Es la evolución prevista en `USUARIOS-Y-COOPERATIVAS.md`.
