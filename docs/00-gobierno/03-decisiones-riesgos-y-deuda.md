---
tipo: decisiones-riesgos
estado_documental: vigente
proyecto: Techo Común
ultima_revision: 2026-10-11
---

# Decisiones, riesgos y deuda

## Decisiones e invariantes

- **Coste cero**: Vercel Hobby (se pausa en vez de facturar) y Firecrawl en plan gratuito sin recarga automática. La búsqueda está apagada salvo `SEARCH_ENABLED=true`.
- **Búsqueda acotada**: lista blanca de URLs y ciudades, caché de 24 h, tope `SEARCH_DAILY_CAP` (12 por defecto, máximo 50), 20 consultas/hora por IP, enfriamiento de 10 min tras fallo, solo scrapes simples de 1 crédito.
- **Sin Idealista**: bloquea la lectura automática; solo se usaría su API oficial.
- **Sin cuentas ni servidor de datos (fase 1): superado el 11/10/2026 por [ADR-0001](05-adr-0001-grupos-y-favoritos-con-supabase.md).** Ahora solo el sistema de grupos y favoritos guarda datos en servidor; la ruta, las calculadoras, los candidatos y los ingresos de las familias siguen solo en el navegador.
- **La base solo se toca desde el servidor**: RLS activado y sin políticas en `grupos_cooperativos`, `miembros` y `favoritos`, permisos revocados a `anon` y `authenticated`, y `SUPABASE_SERVICE_ROLE_KEY` únicamente en variables de servidor (nunca `NEXT_PUBLIC_*`). No añadir políticas para `anon` o `authenticated` sin revisar el ADR: abrirían los datos de todos los grupos.
- **Contraseñas solo con hash bcrypt**, sesión en cookie firmada (`AUTH_SECRET`), y errores de acceso genéricos para no revelar qué grupos existen.
- **Datos mínimos en servidor**: nombre o alias, nombre del grupo y favoritos con lista blanca de campos. Sin correo, teléfono, DNI, ingresos ni datos bancarios.
- **Aviso de privacidad visible** y derecho de supresión desde la interfaz.
- **Los grupos no caducan solos (ADR-0003, 12/10/2026):** se anota la fecha de última actividad y hay funciones de purga manual (`public.grupos_inactivos` y `public.purgar_grupos_inactivos`, plazo mínimo de 3 meses) que solo ejecuta quien administra la base de datos. El aviso de privacidad lo dice.
- **Toda cifra normativa lleva fuente, fecha y fiabilidad** (ADR-0002). Una cifra de una comunidad nunca se presenta como de otra: lo que falta se respalda con el marco estatal o con una referencia marcada como «no es tu norma». Las reglas legales no se editan en la calculadora; las estimaciones sí.
- **Enlazar siempre al anuncio original** y presentar todo como orientación, no asesoría jurídica ni financiera.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Términos de uso de los portales | Revisar antes de abrir al público; se puede apagar la búsqueda sin afectar al resto |
| Cambios en el HTML de los portales | Parsers con fixtures y tests; detectar fallos en uso real |
| Gasto en Firecrawl | La garantía real es la caché y el plan gratuito sin recarga; los contadores en memoria son por instancia |
| Datos de entidades desactualizados | Revisión periódica, sobre todo de la Comunitat Valenciana |
| Pérdida de datos del grupo al limpiar el navegador | Fase 1b: exportar/importar JSON (afecta a ruta, calculadoras y candidatos; los favoritos están en Supabase) |
| Filtración de `SUPABASE_SERVICE_ROLE_KEY` o `AUTH_SECRET` | Solo en variables de servidor; no se versionan (`.env.local` está en `.gitignore`); rotar la clave en Supabase y cambiar `AUTH_SECRET` si hay sospecha. RLS no protege frente a la clave `service_role` |
| Fuerza bruta sobre contraseñas de grupo o de persona | Mínimo de 8 caracteres, bcrypt coste 12 y límite por IP cada 15 min (10 intentos en alta y entrada al grupo, 20 al confirmar persona). El contador está en memoria de cada instancia: es un freno, no una garantía |
| Sistema basado en confianza: quien conozca las dos contraseñas entra como la persona | Aceptado en el MVP; el aviso lo explica y recomienda contraseñas no reutilizadas. Evolución: Supabase Auth |
| Contraseña perdida sin recuperación (no hay correo) | Aceptado en el MVP; la persona puede añadirse de nuevo con otro nombre |
| Datos personales (nombres o alias) en servidor | Responsable (Leida cooperativa) y contacto en el aviso desde el 11/10/2026. **Pendiente:** revisión jurídica y garantías de las transferencias internacionales (Vercel). Decidido el 12/10/2026: sin caducidad automática y con purga manual de grupos inactivos (ADR-0003); validar ese criterio de conservación |
| Sesión de una persona borrada válida hasta 12 h | `/api/sesion` la degrada a «grupo» y las escrituras fallan por clave foránea; impacto limitado a su propio navegador |
| La normativa urbanística cambia y puede estar desactualizada (el texto refundido de la LOTUP tiene una modificación publicada el 02/07/2026 y hay un anteproyecto de nueva ley del suelo valenciana) | La fecha de revisión es visible junto a cada cifra; revisar la normativa periódicamente y antes de abrir a testers externos |
| Costes de urbanización de un plan concreto (València, abril de 2026, reforma interior) que pueden no valer para otro ámbito, y cifras muy distintas según el documento | Se declaran como estimación editable, con contraste de otros documentos en la nota de cada cifra. Los artículos 33, 36 y 82 se verificaron en el BOE el 12/10/2026 |
| Conservación indefinida de los datos de un grupo abandonado | Se anota la última actividad y hay funciones de purga manual (ADR-0003); depende de que alguien las ejecute |
| Que se tome la calculadora de terreno por asesoría urbanística | Aviso permanente de que es orientación y recomendación de pedir el informe o la cédula urbanística al ayuntamiento |
| El plan gratuito de Supabase puede pausar proyectos inactivos | Comprobar la política vigente; si se pausa, la pestaña «Grupo» avisa y el resto de la guía sigue funcionando |

## Deuda

- No hay CI que ejecute los tests antes del despliegue.
- Aviso de Vitest por usar `__dirname` en `vitest.config.mts`.
- Varios commits de arreglo directamente en producción (p. ej. «Arreglo de sintaxis»): no hay comprobación previa al push desde Cowork.
- Las rutas de grupos y favoritos tienen pruebas unitarias de sus piezas y la prueba de extremo a extremo `npm run test:e2e` (31 comprobaciones el 12/10/2026), que hay que ejecutar a mano contra un servidor con la base real: no corre en ningún CI.
- No hay roles ni administración de grupo, ni recuperación de contraseña.
- Solo la Comunitat Valenciana tiene normativa cargada, y el ámbito del proyecto se centra en ella y en la provincia de València (decisión del 12/10/2026). Fuera de ahí se usa el marco estatal y referencias con aviso. Cargar otra comunidad exigiría revisar cada fuente.
- El plazo hasta poder construir y los costes de urbanización de referencia no tienen una fuente oficial; son estimaciones editables.
- La clase de suelo no se guarda en la ficha de cada candidato ni se lee de los anuncios.
- El esquema vive en `supabase/migrations/`, pero no hay herramienta que lo aplique ni detecte desvíos con la base real.
