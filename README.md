# Techo Común

(Repositorio: `cami-cooperatiu`, nombre inicial del proyecto.)

Guía gratuita y sin ánimo de lucro para crear una **cooperativa de vivienda en cesión de uso** en España: ruta de 6 fases, 3 calculadoras, vías de oportunidad, candidatos, directorio de entidades con mensajes listos, glosario y búsqueda en vivo de edificios y terrenos en venta.

Next.js (App Router) + TypeScript. Los datos del grupo se guardan solo en el navegador (localStorage). No hay base de datos ni cuentas.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # opcional: solo para la búsqueda en vivo
npm run dev                  # http://localhost:3000
npm test                     # cálculos, parser y protecciones de coste
npm run build
```

## Coste: cómo se evita una factura

- **Vercel Hobby (gratis)**: no cobra por excedente; si se agotan los límites, el servicio se pausa en lugar de facturar.
- **Firecrawl**: solo la búsqueda en vivo lo usa. Cada llamada es un scrape simple (**1 crédito**), nunca modo JSON ni proxy de pago.
  1. `SEARCH_ENABLED` distinto de `true` ⇒ búsqueda apagada, 0 créditos (valor por defecto).
  2. Lista blanca: solo 2 URLs fijas (edificios, terrenos). Nadie puede pedir otra URL.
  3. Caché de 24 h: con visitas ilimitadas, el gasto máximo teórico son ~2 créditos al día.
  4. Tope diario `SEARCH_DAILY_CAP` (por defecto 6, máximo absoluto 50) por instancia.
  5. Límite de 20 consultas por hora y por IP.
  6. Enfriamiento de 10 min tras un fallo; los errores no se cachean ni se reintentan en bucle.
  7. **Importante**: en tu cuenta de Firecrawl usa el plan gratuito y **no actives la recarga automática**. Así el límite real lo pone la cuenta.
- Los contadores 4–6 viven en memoria de cada instancia serverless; son un freno extra. La garantía real son la caché (3) y el tope de créditos de la cuenta (7).

## Alcance geográfico

La app es de ámbito estatal. Cada grupo indica su comunidad autónoma y su ciudad; las entidades, enlaces y mensajes se adaptan (`entitiesFor` en `src/lib/content.ts`). La Comunitat Valenciana tiene datos propios (Fecovi, EVha, Ley 3/2023); en el resto aparecen recursos estatales (banca ética, Sostre Cívic, Sareb/Casa 47) y enlaces de búsqueda de la federación, la consejería y el ayuntamiento de su zona. Para enriquecer otra comunidad, añade una rama en `entitiesFor` con datos verificados.
La búsqueda en vivo solo se activa en ciudades de la lista blanca `CITIES` (`src/lib/search.ts`, hoy solo València); en el resto se enlaza a los portales.

Cuentas y trabajo en equipo: ver `docs/USUARIOS-Y-COOPERATIVAS.md`.

## Fotos, mapa y planos

- Las fotos de los resultados vienen del mismo listado que ya se descarga (0 créditos extra) y se cargan desde la CDN de Fotocasa, siempre con enlace al anuncio original.
- El mapa (Google Maps incrustado, sin clave) solo se carga al pulsar «Ver mapa». «Catastro» abre la Sede Electrónica; cada candidato admite referencia catastral, dirección y enlaces a plano y fotos.
- Los planos de planta no vienen en el listado, solo en la ficha de cada anuncio. Leer fichas cuesta 1 crédito cada una y no está activado.

## Fuente de datos y aviso legal

Idealista bloquea el acceso automatizado, por lo que la búsqueda usa **Fotocasa**. Antes de abrirla al público, revisa los términos de uso del portal y valora si el uso (no comercial, caché de 24 h, enlazando siempre al anuncio original) es aceptable. Si prefieres no arriesgar, deja `SEARCH_ENABLED=false`: el resto de la app funciona igual.
Los datos son orientativos y pueden fallar si el portal cambia su HTML (parser en `src/lib/parse-fotocasa.ts`, con tests).

## Despliegue en Vercel (gratis)

1. Sube el repo a GitHub (`git remote add origin … && git push -u origin main`).
2. En vercel.com ⇒ *Add New… ⇒ Project* ⇒ importa el repo (plan **Hobby**). Framework: Next.js (automático).
3. *Settings ⇒ Environment Variables*: añade `FIRECRAWL_API_KEY`, `SEARCH_ENABLED=true` y `SEARCH_DAILY_CAP=6` solo si quieres la búsqueda. Redespliega.
4. Cada `git push` a `main` despliega solo.

## Dominio propio

*Project ⇒ Settings ⇒ Domains ⇒ Add*. Vercel indica el registro DNS (A o CNAME) que poner donde compres el dominio. Un dominio cuesta unos 10–15 €/año: es el único gasto posible y lo decides tú.

## Estructura

- `src/lib/content.ts`: fases, glosario, vías, entidades y plantillas de mensajes.
- `src/lib/calc.ts`: matemáticas de las calculadoras (con tests).
- `src/lib/{guards,search,parse-fotocasa}.ts` y `src/app/api/buscar/route.ts`: búsqueda con protecciones.
- `src/components/*`: interfaz.

Guía de orientación; no es asesoría jurídica ni financiera.

## Portales de la búsqueda en vivo

Fotocasa (edificios y terrenos) y Pisos.com (edificios), unidos sin duplicados por precio y m². Idealista bloquea la lectura automática y no se usa: la vía legítima es pedir su API oficial. Cada consulta no cacheada de edificios cuesta 2 créditos (uno por portal); la caché dura 24 h. El tope `SEARCH_DAILY_CAP` cuenta lecturas, no búsquedas.
