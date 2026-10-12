---
tipo: adr
estado_documental: vigente
proyecto: Techo Común
adr: 0001
estado: aceptada; implementada, verificada y desplegada en producción (11/10/2026, commit 3e5bf21)
fecha: 2026-10-11
supera: decisión «Sin cuentas en fase 1» y el modelo de «Fase 2» de USUARIOS-Y-COOPERATIVAS.md
ultima_revision: 2026-10-11
---

# ADR-0001: Grupos con contraseña y favoritos compartidos en Supabase

## Contexto

- El autor confirmó el 10/10/2026 que el objetivo del producto es **gestionar grupos cooperativistas**: el grupo es el centro, no solo una guía.
- Hasta el 10/10/2026 no había base de datos ni cuentas: todo vivía en `localStorage`, sin compartir entre personas ni dispositivos. Esa decisión era deliberada (coste cero y ningún dato personal en servidor) y está recogida en `03-decisiones-riesgos-y-deuda.md`.
- El 11/10/2026 se pidió: (1) alta de grupos genérica, para cualquier grupo de España; (2) favoritos de ofertas con icono de corazón, guardados en Supabase y compartidos entre las personas del grupo; (3) sin OAuth, como MVP basado en confianza.

## Decisión

1. **Grupo y miembros con contraseña.** El grupo tiene identificador y contraseña de grupo; cada persona tiene nombre o alias y contraseña personal. Sin correo ni proveedores externos de identidad.
2. **Datos en Supabase**, en un proyecto propio (`techo-comun`, región `eu-west-3` París, plan gratuito, coste 0 € al mes el 11/10/2026). Tres tablas: `grupos_cooperativos`, `miembros` y `favoritos` (`supabase/migrations/20261011_create_techo_comun_schema.sql`).
3. **El navegador nunca habla con la base.** RLS activado y **sin políticas** en las tres tablas, y permisos revocados a `anon` y `authenticated`. Todo acceso pasa por rutas de servidor (`src/app/api/{grupos,miembros,favoritos,sesion}`) con la clave `service_role`, que solo existe en el servidor. Motivo: sin Supabase Auth, la base no sabe qué usuario hace cada petición y RLS no puede expresar «solo los datos de mi grupo». Cerrar las tablas y aislar por grupo en el servidor es la forma de cumplirlo.
4. **Contraseñas y sesión.** Contraseñas solo como hash bcrypt (coste 12), nunca en texto plano. Sesión en una cookie `tc_sesion` firmada con HMAC-SHA256 (`AUTH_SECRET`), `httpOnly`, `sameSite=strict`, 12 horas, que lleva el grupo y, tras confirmar identidad, el miembro. Los errores de acceso son genéricos y, para un grupo inexistente, se compara contra un hash ficticio para igualar el trabajo y no revelar qué grupos existen (el tiempo de respuesta no se ha medido).
5. **Datos mínimos.** En servidor solo: nombre del grupo, identificador, nombre o alias, hashes y favoritos. Del favorito, solo una lista blanca (título, zona, precio, m², portal, enlace https, tipo). Nada de correo, teléfono, DNI, ingresos ni datos bancarios.
6. **Privacidad visible.** Aviso en la pestaña «Grupo» y en el pie; consentimiento marcado para crear un grupo; derecho de supresión desde la interfaz («Borrar mi perfil»; si es la última persona, se borra el grupo).
7. **Lo demás sigue en el navegador:** ruta, calculadoras, candidatos e ingresos de las familias.

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Seguir solo con `localStorage` + exportar/importar JSON (fase 1b) | No permite compartir entre personas, que es el objetivo. Sigue siendo válida para los datos que no se suben. |
| Supabase Auth con enlace mágico, `memberships` y RLS por usuario (fase 2 de `USUARIOS-Y-COOPERATIVAS.md`) | Más segura (RLS real, sin contraseñas que custodiar), pero exige correo, soporte y más carga legal. Queda como evolución. |
| Políticas RLS con contraseña en cabecera o JWT propio | Más compleja y frágil para un MVP. |
| Reutilizar el proyecto `subenciones-rag` | Mezclaría datos de dos proyectos distintos. |

## Consecuencias

**Positivas**
- Los grupos pueden compartir favoritos sin cuentas externas.
- Coste cero mientras se esté en el plan gratuito.
- Si falla Supabase o no está configurado, la pestaña «Grupo» lo avisa y el resto de la guía funciona igual.

**Riesgos y límites aceptados**
- **La seguridad pasa a depender del servidor.** Quien obtenga `SUPABASE_SERVICE_ROLE_KEY` o `AUTH_SECRET` salta cualquier aislamiento; RLS no protege frente a esa clave.
- **Sistema basado en confianza:** quien conozca la contraseña del grupo y la de una persona entra como ella.
- **Sin recuperación de contraseña:** no hay correo; una contraseña perdida no se recupera.
- **Límite de intentos en memoria**, por instancia serverless y por IP: es un freno, no una garantía contra fuerza bruta.
- **Sesión de una persona borrada:** su cookie sigue firmada hasta 12 horas, aunque `/api/sesion` ya la degrada a «grupo» y las escrituras fallan.
- **Datos personales en servidor** (nombres o alias): aplican las obligaciones del RGPD. El responsable (Leida cooperativa) y su contacto constan en el aviso desde el 11/10/2026; falta la revisión jurídica.
- El plan gratuito de Supabase puede pausar proyectos inactivos: comprobar la política vigente antes de depender de él.

## Estado de implementación (11/10/2026)

| Aspecto | Implementado | Verificado | Desplegado |
| --- | --- | --- | --- |
| Esquema y RLS en Supabase | Sí | Aviso informativo «RLS sin política» (intencionado); la clave pública recibe `42501` al leer y escribir las tres tablas | Sí (base de datos) |
| Rutas de servidor | Sí | 29 comprobaciones de extremo a extremo contra la base real (aislamiento entre grupos, cookie falsificada, favoritos ajenos, hashes bcrypt, lista blanca de datos). En producción, 10 comprobaciones del ciclo completo: alta, cookie `httpOnly` y `Secure`, sesión firmada, favorito, borrado de perfil y de grupo | Sí (11/10/2026) |
| Interfaz (pestaña, corazón, privacidad) | Sí | Navegador contra la base real: alta, favorito persistente tras recargar, cambio de persona, borrar perfil, corazón sin sesión, vista móvil. En producción solo se comprobó que la portada carga con la pestaña «Grupo»; la interfaz no se recorrió en el navegador | Sí (11/10/2026) |
| Tests unitarios | Sí | 63 tests en 13 archivos, `typecheck` y `build` correctos | — |

Límites de la verificación: la búsqueda en vivo está apagada en local, así que la respuesta de `/api/buscar` se simuló con dos anuncios de prueba. El script de extremo a extremo está en el repositorio desde el 12/10/2026 (`npm run test:e2e`, 31 comprobaciones).

## Pendiente

1. Revisión jurídica del aviso de privacidad y de las garantías de transferencia internacional (Vercel), La caducidad de grupos inactivos se decidió el 12/10/2026: sin plazo automático y con purga manual (ADR-0003). Responsable y contacto: hechos el 11/10/2026.
2. Variables en Vercel: hechas el 11/10/2026 en Production (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `AUTH_SECRET` con valor distinto del local, sin prefijo `NEXT_PUBLIC_`). Falta decidir si se añaden a Preview: hacerlo haría que los despliegues de prueba escribieran en la misma base que producción, porque solo hay un proyecto de Supabase.
3. Hecho el 12/10/2026: el script de extremo a extremo está en el repositorio como prueba de integración.
4. Decidir si se añade administración del grupo (hoy no hay roles) y recuperación de contraseña.
5. Valorar el paso a Supabase Auth cuando haya usuarios reales.

## Evidencia en el código

`src/lib/{auth,session,supabase,validate,favoritos,grupo,http}.ts(x)`, `src/app/api/{grupos,miembros,favoritos,sesion}/`, `src/components/{Grupo,FavButton,Privacidad}.tsx` y los tests `auth.test.ts`, `validate.test.ts` y `favoritos.test.ts`.
