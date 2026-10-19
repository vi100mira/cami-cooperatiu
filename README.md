# Techo Común

(Repositorio: `cami-cooperatiu`, nombre inicial del proyecto.)

Guía gratuita y sin ánimo de lucro para crear una **cooperativa de vivienda en cesión de uso** en España: ruta de 6 fases, 4 calculadoras (una de ellas de terreno, con la normativa urbanística de cada comunidad), vías de oportunidad, candidatos, directorio de entidades con mensajes listos, glosario y búsqueda en vivo de edificios y terrenos en venta.

Next.js (App Router) + TypeScript. La ruta, las calculadoras y los candidatos se guardan solo en el navegador (localStorage). Los grupos y sus favoritos, opcionales, usan Supabase (ver «Grupos y favoritos»). No hay cuentas externas ni OAuth.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # opcional: búsqueda en vivo y grupos (Supabase)
npm run dev                  # http://localhost:3000
npm test                     # cálculos, parser y protecciones de coste
npm run build
```

## Coste: cómo se evita una factura

- **Vercel Hobby (gratis)**: no cobra por excedente; si se agotan los límites, el servicio se pausa en lugar de facturar.
- **Firecrawl**: solo la búsqueda en vivo lo usa. Cada llamada es un scrape simple (**1 crédito**), nunca modo JSON ni proxy de pago.
  1. `SEARCH_ENABLED` distinto de `true` ⇒ búsqueda apagada, 0 créditos (valor por defecto).
  2. Lista blanca: la búsqueda en vivo solo lee 2 URLs fijas (edificios, terrenos). Los enlaces que pega una persona (`/api/importar`) solo pueden ser de Idealista, Fotocasa, Pisos.com o yaencontre, cuestan 1 crédito y se cachean 24 h por URL.
  3. Caché de 24 h: con visitas ilimitadas, el gasto máximo teórico son 7 créditos al día (una sola búsqueda provincial: 3 lecturas de edificios + 4 de terrenos), y el tope diario lo recorta a `SEARCH_DAILY_CAP`.
  4. Tope diario `SEARCH_DAILY_CAP` (por defecto 12, máximo absoluto 50) por instancia.
  5. Límite de 20 consultas por hora y por IP.
  6. Enfriamiento de 10 min tras un fallo; los errores no se cachean ni se reintentan en bucle.
  7. **Importante**: en tu cuenta de Firecrawl usa el plan gratuito y **no actives la recarga automática**. Así el límite real lo pone la cuenta.
- Los contadores 4–6 viven en memoria de cada instancia serverless; son un freno extra. La garantía real son la caché (3) y el tope de créditos de la cuenta (7).

## Grupos y favoritos (Supabase)

Opcional. Cada grupo se da de alta con una contraseña de grupo y cada persona tiene su contraseña personal. Los favoritos (el corazón de la búsqueda en vivo) se guardan en Supabase y los ve todo el grupo, con el nombre de quien los marcó. Si Supabase no está configurado, la pestaña «Grupo» avisa de que no está disponible y el resto de la app funciona igual.

- **Variables** (solo de servidor; `.env.local` está en `.gitignore`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `AUTH_SECRET` (mínimo 32 caracteres aleatorios). Ninguna lleva prefijo `NEXT_PUBLIC_`: la clave `service_role` da acceso total y nunca debe llegar al navegador.
- **Generar `AUTH_SECRET`:**

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- **Esquema:** `supabase/migrations/20261011_create_techo_comun_schema.sql` y, después, `20261012_actividad_y_purga_manual.sql` (actividad de los grupos y funciones de purga). Aplícalos en tu propio proyecto de Supabase (editor SQL o CLI).
- **Purgar grupos inactivos (a mano):** en el editor SQL, `select * from public.grupos_inactivos(12);` lista los de más de 12 meses sin actividad y `select * from public.purgar_grupos_inactivos(12);` los borra. Nada se borra solo. Ver el ADR-0003.
- **Documentos y modelos:** `docs/modelos/` recoge qué documentos aparecen en cada estación de la Ruta, quién los redacta y 12 modelos para los que redacta el propio grupo (declaración de intenciones, convocatoria y acta de asamblea, solicitud de ingreso, esquemas de estatutos, reglamento y contrato de cesión de uso, memoria, plan económico, solicitud urbanística, compromiso de aportación y certificación de acuerdos). Son orientativos y deben revisarse con asesoría jurídica antes de usarlos. La pestaña **Documentos** de la app los muestra desde esos mismos ficheros: tras editarlos, `npm run modelos` regenera `src/lib/modelos-indice.ts` y `src/lib/modelos-datos.ts` (una prueba falla si se olvida).
- **Aplicación instalable (PWA):** `src/app/manifest.ts` (manifiesto), `public/sw.js` (service worker, solo en producción), `public/icons/` (iconos generados con `node scripts/generar-iconos.mjs`) y el botón «Instalar la aplicación» de la cabecera de Ruta (en iPhone explica «Compartir → Añadir a pantalla de inicio»). El service worker nunca toca `/api`: grupos, favoritos, sesión y búsqueda van siempre a la red. Para forzar una limpieza de cachés, cambia `VERSION` en `public/sw.js`.
- **Municipios y distancia:** `src/lib/municipios-datos.ts` lo genera `node scripts/generar-municipios.mjs` desde Wikidata (542 municipios de la Comunitat Valenciana con coordenadas; no editar a mano). La distancia a los anuncios es en línea recta entre municipios y orientativa.
- **Prueba de extremo a extremo:** con `npm run dev` en marcha y `.env.local` rellenado, `npm run test:e2e` crea dos grupos de prueba, comprueba el flujo completo y los borra. Admite una URL como argumento, por ejemplo `node --env-file=.env.local scripts/e2e.mjs https://tu-dominio.vercel.app`. Usa 4 altas por ejecución (el límite es de 10 cada 15 minutos por IP) y 4 intentos de recuperación con código (el límite es de 5 cada 15 minutos por IP): espera unos minutos entre ejecuciones.
- **Seguridad:** RLS activado y sin políticas en las tres tablas, y todo acceso por las rutas `src/app/api/{grupos,miembros,favoritos,sesion}`. No añadas políticas para `anon` o `authenticated` sin leer antes el ADR. Contraseñas con bcrypt; sesión en cookie firmada de 12 h.
- **Privacidad:** se guardan solo nombre del grupo, nombre o alias, contraseñas cifradas y favoritos. Aviso visible en la pestaña «Grupo»; cada persona puede borrar su perfil desde ahí.
- **Coste:** plan gratuito de Supabase. No pases a un plan de pago ni actives complementos de pago.
- **Decisión, alternativas y límites:** `docs/00-gobierno/05-adr-0001-grupos-y-favoritos-con-supabase.md`.

## Alcance geográfico

La app es de ámbito estatal. Cada grupo indica su comunidad autónoma y su ciudad; las entidades, enlaces y mensajes se adaptan (`entitiesFor` en `src/lib/content.ts`). La Comunitat Valenciana tiene datos propios (Fecovi, EVha, Ley 3/2023); en el resto aparecen recursos estatales (banca ética, Sostre Cívic, Sareb/Casa 47) y enlaces de búsqueda de la federación, la consejería y el ayuntamiento de su zona. Para enriquecer otra comunidad, añade una rama en `entitiesFor` con datos verificados.
La búsqueda en vivo solo se activa en ciudades de la lista blanca `CITIES` (`src/lib/search.ts`, hoy solo València); en el resto se enlaza a los portales.

Cuentas y trabajo en equipo: ver `docs/USUARIOS-Y-COOPERATIVAS.md`.

## Fotos, mapa y planos

- Las fotos de los resultados vienen del mismo listado que ya se descarga (0 créditos extra) y se cargan desde la CDN de Fotocasa, siempre con enlace al anuncio original.
- El mapa (Google Maps incrustado, sin clave) solo se carga al pulsar «Ver mapa». «Catastro» abre la Sede Electrónica; cada candidato admite referencia catastral, dirección y enlaces a plano y fotos.
- Los planos de planta no vienen en el listado, solo en la ficha de cada anuncio. Leer fichas cuesta 1 crédito cada una y no está activado.

## Fuente de datos y aviso legal

La búsqueda en vivo usa Fotocasa, Pisos.com y yaencontre. Idealista solo entra cuando alguien pega un enlace de una búsqueda suya: sus listados se leen, sus fichas no (ver `docs/00-gobierno/10-adr-0005-anuncios-desde-enlaces.md`). Antes de abrirla al público, revisa los términos de uso del portal y valora si el uso (no comercial, caché de 24 h, enlazando siempre al anuncio original) es aceptable. Si prefieres no arriesgar, deja `SEARCH_ENABLED=false`: el resto de la app funciona igual.
Los datos son orientativos y pueden fallar si el portal cambia su HTML (parser en `src/lib/parse-fotocasa.ts`, con tests).

## Despliegue en Vercel (gratis)

1. Sube el repo a GitHub (`git remote add origin … && git push -u origin main`).
2. En vercel.com ⇒ *Add New… ⇒ Project* ⇒ importa el repo (plan **Hobby**). Framework: Next.js (automático).
3. *Settings ⇒ Environment Variables*: añade `FIRECRAWL_API_KEY`, `SEARCH_ENABLED=true` y `SEARCH_DAILY_CAP=12` solo si quieres la búsqueda, y `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `AUTH_SECRET` (valor distinto del local) solo si quieres los grupos. Redespliega.
4. Cada `git push` a `main` despliega solo.

## Dominio propio

*Project ⇒ Settings ⇒ Domains ⇒ Add*. Vercel indica el registro DNS (A o CNAME) que poner donde compres el dominio. Un dominio cuesta unos 10–15 €/año: es el único gasto posible y lo decides tú.

## Estructura

- `src/lib/content.ts`: fases, glosario, vías, entidades y plantillas de mensajes.
- `src/lib/calc.ts`: matemáticas de las calculadoras (con tests).
- `src/lib/normativa.ts`, `src/lib/terreno.ts` y `src/components/Terreno.tsx`: calculadora «Del terreno a las viviendas». La normativa urbanística es un registro por comunidad con la fuente, la fecha y la fiabilidad de cada cifra; para añadir una comunidad se añaden datos en `REGISTRO` (con tests de calidad de las fuentes). Ver el ADR-0002.
- `src/lib/{guards,search,parse-fotocasa}.ts` y `src/app/api/buscar/route.ts`: búsqueda con protecciones.
- `src/lib/{auth,session,supabase,validate,favoritos,http}.ts` y `src/app/api/{grupos,miembros,favoritos,sesion}`: grupos, sesión y favoritos (con tests de `auth`, `validate` y `favoritos`).
- `src/lib/grupo.tsx`, `src/components/{Grupo,FavButton,Privacidad}.tsx`: estado del grupo en el cliente, pestaña «Grupo», corazón y aviso de privacidad.
- `supabase/migrations/`: esquema de la base de datos. `scripts/e2e.mjs`: prueba de extremo a extremo de grupos y favoritos.
- `src/lib/fit.ts` y `src/lib/calc.ts` (`capacidad`): filtros de la búsqueda y encaje de cada anuncio con el tamaño y el capital de la cooperativa (con tests en `ajuste.test.ts`).
- `src/components/*`: interfaz.

Guía de orientación; no es asesoría jurídica ni financiera.

## Portales de la búsqueda en vivo

Fotocasa, Pisos.com y yaencontre (edificios y terrenos), unidos sin duplicados por precio y m². Idealista no está en la búsqueda automática; se puede añadir pegando el enlace de una búsqueda suya en «Añadir desde un enlace». Alcance: siempre toda la provincia de València; el municipio o barrio se filtra después sobre los resultados, sin gastar créditos. Cada consulta no cacheada de edificios cuesta 3 créditos (uno por portal) y la de terrenos 4 (añade el filtro «de bancos» de yaencontre); la caché dura 24 h. El tope `SEARCH_DAILY_CAP` cuenta lecturas, no búsquedas.
