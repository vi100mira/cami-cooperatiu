---
tipo: estado-operativo
estado_documental: vigente
proyecto: Techo Común
ultima_revision: 2026-10-19
---

# Estado operativo y hoja de ruta

## Cambios del 19/10/2026 (desplegados: commits 394466d y 955acad)

- **Calculadoras → Sin ahorro**: propuestas para cubrir lo que no presta el banco sin aportación inicial (`src/lib/financiacion.ts`, 8 tests). «Cuota» avisa cuando el préstamo supera el porcentaje que suele dar el banco y enlaza aquí. Dos términos nuevos en el glosario: títulos participativos y préstamo participativo.
- **Anuncios desde un enlace** (`/api/importar`, [ADR-0005](10-adr-0005-anuncios-desde-enlaces.md)): lector de listados de Idealista con muestra real, lector de fichas y de texto pegado, y lista blanca de portales. Verificado en local sin clave de Firecrawl (formulario, texto pegado, añadir, recargar y simular). La lectura real de un listado de Idealista se comprobó con Firecrawl fuera de la app.
- Puertas: `npm test` 209 tests en 24 archivos, `npm run typecheck` sin errores.
- Verificado en producción: `/api/importar` lee un listado de Idealista (30 anuncios con precio, m² y zona), así que la lectura de portales está activa en Vercel. Uso interno por ahora; temas legales pendientes antes de abrir al público.

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

Conexión entre Ruta y Grupo (11/10/2026, implementada, verificada en local y desplegada el 11/10/2026): la tarjeta «Tu grupo» de Ruta pasa a llamarse «Tu cooperativa» para no confundirla con la pestaña «Grupo» y muestra una franja con el estado de la conexión y un botón a la pestaña. Al crear un grupo se propone el nombre que figura en Ruta, y si Ruta tiene el nombre vacío adopta el del grupo al entrar, solo una vez por grupo. Región, ciudad, familias y barrio siguen solo en el navegador: compartirlos entre las personas del grupo exigiría ampliar el esquema y el aviso de privacidad, y está sin decidir.

Calculadora «Del terreno a las viviendas» (11/10/2026, implementada, verificada en local y desplegada), decisión en [ADR-0002](06-adr-0002-normativa-por-comunidad.md):

| Capacidad | Implementado | Verificado | Desplegado |
| --- | --- | --- | --- |
| Registro de normativa por comunidad y cálculo (clases de suelo, cesiones, dotaciones, viales, costes) | Sí | Pruebas unitarias y de calidad de las fuentes; ejemplo de 1 ha cuadrado a mano | Sí (11/10/2026) |
| Calculadora con cascada, costes y tabla de normas aplicadas | Sí | Navegador en local: no urbanizable, Andalucía (sin normativa cargada), botón de carga a las calculadoras de cuota y móvil sin desbordamiento | Sí (11/10/2026) |

Puertas de calidad (11/10/2026, Node 20, copia local): `npm test` 87 tests en 15 archivos, `npm run typecheck` sin errores y `npm run build` correcto. Solo la Comunitat Valenciana tiene normativa cargada. Los artículos 36 y 82 de la LOTUP se leyeron en una fuente secundaria, la reserva de vivienda protegida del 30 % está marcada «comprobar vigencia» frente al 40 % estatal, y los costes de urbanización son estimaciones editables de un informe de València cuyo año no se confirmó. Despliegue en producción el 11/10/2026 (commit `3390738`, Ready): se comprobó que está servido el código de la calculadora de terreno, la franja Ruta–Grupo, las etiquetas nuevas de acceso y el aviso con responsable, y que la API de grupos y de sesión responden; la interfaz no se recorrió en el navegador en producción.

Mejora de usabilidad de la calculadora de terreno (12/10/2026, implementada y verificada en local; pendiente de desplegar): la tarjeta medía 2.439 px a 1024×768 por apilar el resultado, los costes y las nueve normas, y la columna de resultados fija quedaba cortada. Ahora el resultado clave está siempre arriba y el detalle va en pestañas (Reparto, Costes y Normas), con cada norma en una línea que despliega su fuente. Alturas medidas a 1024×768: 735 px por defecto, 720 en Costes y 975 en Normas; en móvil 1.671 px, sin desbordamiento horizontal. Los resultados dejan de ser fijos y en pantallas estrechas los datos van antes que el detalle. Las pruebas de cálculo no cambian (87 en 15 archivos).

## Cambios del 12/10/2026 (implementados, verificados y desplegados)

El despliegue cuesta, así que se acumularon los cambios para publicarlos juntos.

| Cambio | Implementado | Verificado | Desplegado |
| --- | --- | --- | --- |
| Calculadora de terreno compacta: resultado clave arriba y pestañas Reparto, Costes y Normas (de 2.439 a 735 px a 1024×768) | Sí | Mediciones en navegador, cambios de clase y móvil sin desbordamiento | Sí (12/10/2026) |
| Normativa valenciana verificada en el texto del BOE (arts. 33, 36 y 82, actualizado el 10/08/2026), con la exención del art. 33.3 | Sí | Descarga y lectura en local; 89 pruebas de normativa y cálculo | Sí (12/10/2026) |
| Costes de urbanización de 2026 (125 y 55 €/m²) en lugar de los de 2010 (240 y 120) | Sí | Lectura de los PDF originales en local | Sí (12/10/2026) |
| Búsqueda ajustada a la cooperativa: capital orientativo, orden por defecto, etiquetas y casilla de ocultar | Sí | 20 pruebas nuevas y navegador con anuncios simulados (3 y 20 familias) | Sí (12/10/2026) |
| Búsqueda «Ambos» (edificios y terrenos mezclados, una consulta por tipo) en la búsqueda en vivo y en los portales | Sí | Pruebas de `filtrarTodo` y navegador con anuncios simulados: 2 consultas, lista mezclada y ordenada junta | Sí (12/10/2026, commit 0364482) |
| Centro de acción y desplazamiento máximo del grupo (p. ej. València y 20 km): dos campos en Ruta y en la búsqueda, compartidos con el grupo (`grupos_cooperativos.datos`, sin migración); filtran las ofertas por distancia en línea recta entre municipios, añaden la insignia «Municipio · a N km» y el orden «Más cerca del centro», y los anuncios que no se pueden ubicar se muestran con aviso salvo que se oculten. Tabla de los 542 municipios de la Comunitat Valenciana con coordenadas (Wikidata, CC0; `scripts/generar-municipios.mjs`). El municipio de cada anuncio se deduce de su dirección web, de su zona y de frases «en Municipio»: 79 de 83 anuncios reales ubicados (95 %), el resto sin ubicar a propósito | Sí | `ubicacion.test.ts` (20), `ajuste.test.ts` y `validate.test.ts`, e2e de 68 comprobaciones y navegador (20 km desde València deja València y Torrent, descarta Sagunt a 25 km y Gandia a 58 km) | Sí (13/10/2026, commit 9f5fce0) |
| Pestaña «Documentos»: catálogo de los documentos del proceso (quién los redacta y con qué fiabilidad) y 12 modelos para los que redacta el grupo, mostrados desde `docs/modelos/` (única fuente, `npm run modelos`, carga diferida). Cada modelo se puede copiar, descargar para Word (.doc), como texto (.md) e imprimir; las estaciones de la Ruta enlazan a los modelos que les corresponden; la vista abierta se recuerda. Convertidor de markdown propio y sin dependencias (`markdown.ts`) | Sí | 40 pruebas nuevas (convertidor, sincronía con los ficheros, enlaces, avisos de revisión jurídica) y navegador: Ruta → modelo, catálogo, enlaces internos, descargas, móvil sin desbordes; «Copiar» devuelve aviso cuando el navegador deniega el portapapeles | No (pendiente de desplegar) |
| «Apuntar como candidato» también marca el corazón (`marcarFavorito` en `grupo.tsx`): si estás identificada en tu grupo, la oferta queda como favorito compartido además de como candidato propio; si el corazón ya estaba marcado no se quita, y sin grupo solo se apunta el candidato. Motivo: favorito (se comparte con el grupo, se guarda en el servidor) y candidato (seguimiento propio, solo en el navegador) eran listas separadas | Sí | Navegador con un grupo de prueba (borrado): apuntar marca el favorito en el servidor, repetir no lo quita y la tarjeta lo muestra marcado; sin grupo solo se apunta el candidato | No (pendiente de desplegar) |
| «Tu cooperativa» deja de ser un formulario: en Ruta es un resumen informativo y compacto (nombre, comunidad, ciudad, familias, zona, centro de acción y distancia, y si está compartido con el grupo) y los datos se editan en una única ventana modal «Datos de la cooperativa» (`Cooperativa.tsx`), abierta con «Editar datos» desde Ruta y desde un resumen equivalente en la pestaña Grupo. La pestaña Grupo queda para personas, contraseñas y favoritos. Motivo: parecía que el grupo se definía en dos sitios | Sí | Navegador: la ventana abre, edita (el resumen cambia al instante) y cierra con Hecho, X, fondo y Escape, y se puede reabrir; resumen también dentro de un grupo de prueba (borrado); vista de móvil sin desbordes | Sí (13/10/2026, commit 4aa297c) |
| Mapa de cada oferta más preciso (`consultaMapa` en `ubicacion.ts`): el enlace «Abrir en Google Maps» y el mapa incrustado buscan el lugar que dice el título («en Carrer de la Pau», «en Parque de la Bombilla-Pla de Rascanya, Llíria»), la zona si no es el «València» por defecto de los portales y el municipio deducido de la dirección del anuncio, más la provincia si no es València y «España». Antes buscaban solo «zona + València», así que un anuncio de Burjassot con zona «València» se buscaba como «València València». Los candidatos apuntados desde la búsqueda guardan ese texto (`Cand.mapa`) | Sí | 6 pruebas nuevas con anuncios reales y navegador con un terreno de Llíria y un edificio de Burjassot | Sí (13/10/2026, commit 4aa297c) |
| Estructura de Oportunidades y Calculadoras en apartados: en vez de una columna larga de tarjetas, cada pestaña tiene un menú de apartados (Calculadoras: Del terreno, Cuota, Presupuesto, Alquiler; Oportunidades: Buscar, Candidatos con su contador, Vías, Entidades) que muestra uno cada vez, igual que ya hacía la calculadora del terreno con Reparto, Costes y Normas. El apartado abierto se recuerda al ir a otra pestaña y volver y al recargar (`subpestana.ts`), y los saltos entre secciones (simular, «Apuntar como candidato», «Volver a Oportunidades», enlaces de la Ruta) abren el apartado que toca. La altura de cada pestaña baja de varias pantallas a unos 1.800–2.600 px en escritorio y el menú cabe sin deslizar en móvil | Sí | `subpestana.test.ts` (3 pruebas) y navegador: los cuatro apartados de cada pestaña, los saltos desde la búsqueda y desde la calculadora, y la vista de móvil sin desbordes | Sí (13/10/2026, commit 4aa297c) |
| «Qué haría falta» en «¿Cabe en el presupuesto?»: cuando la cuota no cabe en el 30 % de los ingresos, el bloque dice, para esa propiedad y cambiando solo una cosa cada vez, la aportación inicial por vivienda, la obra máxima (y su equivalente en €/m² si hay m² de referencia) o los ingresos que harían falta; si el mantenimiento y la reserva ya se comen el 30 %, lo dice (`queHariaFalta` en `calc.ts`). Motivo: con los supuestos de partida (ingresos 36.000 €, aportación 15.000 € por vivienda) solo caben 19 de 74 anuncios reales y el veredicto «No» se repetía; con 30.000 € por vivienda caben 31 | Sí | 6 pruebas nuevas (la aportación o la obra calculadas dejan la cuota justo en el 30 %) y navegador con 3 propiedades: una cabe, otra necesita 25.704 € por vivienda y otra 119.037 € | Sí (13/10/2026, commit 6687bd9) |
| Simulación completa de cada propiedad: la calculadora muestra una ficha con precio, obra, total con gastos, viviendas, coste por vivienda y cuota; la obra supuesta (1.375 €/m², del ejemplo de las calculadoras) se calcula sobre los m² del edificio o el techo construible del terreno y se ajusta en la propia ficha; un terreno ya calcula viviendas, suelo urbanizado y cuota al simularlo (con la clase de suelo de «Del terreno a las viviendas»), en vez de quedarse a medias | Sí | `simulacion.test.ts` (16 pruebas) y navegador con 4 propiedades distintas: 1.074, 948, 914 y 1.285 €/mes; ajustar la obra a 500 €/m² baja la cuota de 1.285 a 845 €/mes | Sí (13/10/2026, commit 9f5fce0) |
| Navegación para estudiar: la búsqueda en vivo (tipo, filtros y resultados) se conserva al ir a otra pestaña y volver, y también al recargar dentro de la visita (`memoria.ts`, sessionStorage); cada pestaña recuerda hasta dónde habías bajado; la calculadora ofrece «← Volver a Oportunidades» cuando simulas un anuncio | Sí | `memoria.test.ts` (5 pruebas) y navegador: 2 consultas, volver desde la calculadora sin repetir la búsqueda y con la misma posición | Sí (12/10/2026, commit ba8cadc; el código servido contiene la memoria de búsqueda) |
| Preguntas frecuentes: entrada «Aspectos legales» sobre venta a terceros no socios y reventa de viviendas adjudicadas, con artículos verificados en el texto consolidado del BOE de la Ley 27/1999 (art. 4, 89 y 92; actualizado el 09/04/2026) y del Decreto Legislativo 2/2015 valenciano (art. 65 y 91; actualizado el 10/08/2026). Diferencias con la nota de partida: el tope valenciano para operar con no socios es el 25 % por promoción o fase (art. 91.4), no una excepción por viabilidad (eso es la autorización del art. 4.2 de la ley estatal); y el plazo de cinco años «desde la licencia de primera ocupación, hasta diez» es de la ley estatal (art. 92), mientras que la valenciana lo cuenta desde la adjudicación (art. 91.7) | Sí | `faq.test.ts` y navegador | Sí (12/10/2026, commit dc8b09a; se comprobó que el código servido contiene la entrada) |
| Simulación corregida: un edificio carga precio, viviendas estimadas y una obra supuesta de 110.000 € por vivienda; un terreno carga precio y superficie en «Del terreno a las viviendas»; ninguna toca ya las familias de la cooperativa (que se comparten con el grupo); «Quitar y volver a mis datos» restaura lo anterior | Sí | `simulacion.test.ts` (12 pruebas) y navegador | Sí (12/10/2026, commit 0364482) |
| Actividad de los grupos y purga manual (ADR-0003) | Sí | SQL contra la base real; funciones inaccesibles para la clave pública; actividad comprobada en `test:e2e` | Sí (12/10/2026) |
| Prueba de extremo a extremo en el repositorio (`npm run test:e2e`) | Sí | 31 comprobaciones contra la base real, con limpieza | — |

Puertas de calidad (12/10/2026, Node 20, copia local): `npm test` 109 tests en 16 archivos y `npm run typecheck` sin errores. Despliegue único en producción el 12/10/2026 (commit `5ee0ab4`, Ready): `npm run test:e2e` contra producción pasó las 31 comprobaciones y se comprobó que el código nuevo está servido (orden por cooperativa, pestaña de normas, costes de 2026, aviso con la actividad y la exención del art. 33.3). La interfaz nueva no se recorrió en el navegador en producción.

## Pendiente de confirmar

- Variables de Vercel para los grupos: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `AUTH_SECRET` añadidas el 11/10/2026 solo en el entorno Production (las dos claves como *sensitive*; `AUTH_SECRET` con un valor distinto del local). No hay nada en Preview ni Development. Prueba de humo en producción el 11/10/2026 (10 comprobaciones: portada, base alcanzable, alta, cookie `httpOnly` y `Secure`, sesión firmada, favorito, borrado de perfil y de grupo) con datos de prueba que se borraron; la base quedó con 0 filas. La interfaz no se recorrió en el navegador en producción.
- Revisión jurídica del aviso de privacidad y de las garantías de las transferencias internacionales (Vercel). El responsable (Leida cooperativa) y su contacto constan en el aviso desde el 11/10/2026.
- Si la búsqueda en vivo está activa en producción: `SEARCH_ENABLED` y `FIRECRAWL_API_KEY` existen en Vercel (producción), valor del interruptor no leído.
- Si una sola página por portal da suficientes anuncios al filtrar por municipio.

## Hoja de ruta

1. Confirmar el estado de la búsqueda en producción y del plan de Firecrawl (gratuito, sin recarga automática).
2. Fase 1b: exportar/importar los datos del grupo en JSON y varios grupos por navegador.
3. Revisar términos de uso de los portales antes de abrir la búsqueda al público.
4. Primeros testers externos.
5. Datos propios de otras comunidades autónomas en `entitiesFor`.
6. Revisión jurídica del aviso de privacidad y de las transferencias internacionales (ver ADR-0001), incluido el criterio de conservación. La caducidad de grupos se decidió el 12/10/2026: sin plazo automático y con purga manual (ADR-0003). Los grupos están desplegados desde el 11/10/2026.
7. Roles de grupo, recuperación de contraseña y datos de la cooperativa compartidos: decididos, implementados y desplegados el 12/10/2026 (ADR-0004); la administradora del grupo existente debe generar su código de recuperación. La prueba de extremo a extremo (`npm run test:e2e`, 64 comprobaciones) está en el repositorio.
8. Valorar Supabase Auth (enlace mágico y RLS por usuario) cuando haya usuarios reales. Es la evolución prevista en `USUARIOS-Y-COOPERATIVAS.md`.
9. Calculadora de terreno: el ámbito se limita a la Comunitat Valenciana y la provincia de València (decisión del 12/10/2026; no se cargarán otras comunidades por ahora). Pendiente comprobar el 30 % frente al 40 % de vivienda protegida (la interfaz ya muestra el rango 30–40 % en m²) y fijar una revisión periódica de la normativa (ver ADR-0002). Los artículos 33, 36 y 82 de la LOTUP ya están verificados en el BOE.
10. Búsqueda ajustada a la cooperativa: probada el 12/10/2026 con la búsqueda real de producción (83 anuncios de la provincia de València, de 66 a 64.000 m²): con 3 familias y 60.000 € por familia salen primero edificios de 183 a 428 m²; con 12 familias y 90.000 €, los de 600 a 1.900 m². Queda valorar guardar la clase de suelo en cada candidato.

## Despliegue del 12/10/2026 por la tarde

Commit `0364482` en producción: reserva de vivienda protegida con rango 30–40 %, aviso de privacidad con cláusulas contractuales tipo, ADR-0004 (administración del grupo, código de recuperación y datos compartidos), búsqueda «Ambos», simulación corregida y tema azul oscuro por defecto con interruptor. Comprobado: `npm run test:e2e` contra producción, 64 de 64 y sin grupos de prueba sobrantes; las rutas nuevas responden. 132 pruebas unitarias, tipos y compilación de producción en verde. La interfaz nueva no se recorrió en el navegador en producción.

## Despliegue del 13/10/2026

Commit `9f5fce0` en producción: simulación completa de cada propiedad (ficha, obra ajustable por m² y terrenos que llegan hasta la cuota) y centro de acción con desplazamiento máximo del grupo (filtro por distancia, orden «Más cerca del centro», tabla de 542 municipios de la Comunitat Valenciana). Comprobado: el código servido contiene lo nuevo y `npm run test:e2e` contra producción pasó las 68 comprobaciones, incluidas las de centro y distancia, sin grupos de prueba sobrantes. 172 pruebas unitarias, tipos y compilación en verde. La interfaz nueva no se recorrió en el navegador de producción.

También el 13/10/2026 (commit `6687bd9`): el bloque «¿Cabe en el presupuesto?» dice qué haría falta en cada propiedad cuando la cuota no cabe (aportación por vivienda, obra máxima o ingresos). Comprobado que el código servido en producción lo contiene; es un cambio de interfaz y no se repitió la prueba e2e.

También el 13/10/2026 (commit `4aa297c`): Oportunidades y Calculadoras en apartados, mapa más preciso de cada oferta y «Tu cooperativa» como resumen con una única ventana de edición. Comprobado que el código servido en producción contiene los tres cambios; son cambios de interfaz y no se repitió la prueba e2e.
