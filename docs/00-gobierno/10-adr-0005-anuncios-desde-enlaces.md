---
tipo: adr
estado_documental: vigente
proyecto: Techo Común
adr: 0005
estado: aceptada; implementada, verificada y desplegada en producción (19/10/2026, commit 955acad)
fecha: 2026-10-19
ultima_revision: 2026-10-19
---

# ADR-0005: Anuncios desde enlaces de portales (Idealista incluido)

## Contexto

- El autor pidió poder pegar una URL (por ejemplo, de Idealista) y que funcione como un origen de datos más, conectado con todo lo demás: filtros, ajuste a la cooperativa, calculadoras, candidatos, favoritos y mapa.
- Hasta ahora la búsqueda en vivo solo leía 2 URLs fijas por portal (edificios y terrenos de la provincia de València) e Idealista no se usaba porque «bloquea la lectura automática».
- Prueba real del 19/10/2026 con Firecrawl (proxy básico, 1 crédito):
  - una **página de resultados** de Idealista (`/venta-edificios/valencia-valencia/`) **se lee bien**, con título, precio, m², zona, foto y enlace a cada ficha;
  - la **ficha** de un anuncio suelto (`/inmueble/109685821/`) **falla**: Idealista la bloquea.

## Decisión

1. **«Añadir desde un enlace»** en Oportunidades → Buscar, disponible en cualquier ciudad, no solo en València. La persona pega una búsqueda (con sus propios filtros) o un anuncio de Idealista, Fotocasa, Pisos.com o yaencontre.
2. **Lista blanca de portales, no de URLs** (`src/lib/importar.ts`): solo esos 4 dominios, solo https, sin credenciales ni puertos, sin fragmento. Cada portal tiene un lector probado con una muestra real (`parse-idealista.ts` es nuevo). Nadie puede usar la app para leer cualquier web.
3. **Mismas protecciones de coste** que la búsqueda en vivo (`/api/importar`): interruptor `SEARCH_ENABLED`, tope diario `SEARCH_DAILY_CAP` (se comparte), 20 consultas/hora por IP y caché de 24 h por URL. Un error de importación no activa el enfriamiento global, para que un enlace roto no bloquee la búsqueda de los demás.
4. **Las fichas de Idealista no se intentan leer**: se sabe que fallan, así que no se gasta un crédito. Se ofrece un formulario corto (título, precio, m², zona) que se puede rellenar pegando el texto del anuncio; ese texto se interpreta en el navegador (`parse-ficha.ts`), sin servidor ni créditos. Lo mismo se ofrece cuando la lectura está apagada, se agota el tope o el portal falla.
5. **Lo añadido se guarda en el navegador** (`importados` en el estado de `localStorage`, como los candidatos) y se suma a la lista de la búsqueda en vivo, sin duplicados. Los anuncios sueltos (a mano o desde una ficha) se muestran siempre, aunque no encajen con la cooperativa; los listados pasan por los mismos filtros.

## Alternativas descartadas

- **Proxy de pago de Firecrawl para las fichas de Idealista**: más créditos por ficha y más choque con sus términos de uso.
- **Aceptar cualquier URL**: abriría la app como lector genérico de webs a costa de los créditos del proyecto.
- **Guardar lo importado en Supabase**: no hace falta para un solo navegador; los favoritos del grupo ya comparten lo que importa.

## Consecuencias y riesgos

- Gasto máximo: cada enlace distinto cuesta 1 crédito al día como mucho; el tope diario sigue mandando.
- **Términos de uso de Idealista**: sigue siendo el riesgo principal. El uso es no comercial, con caché de 24 h, enlazando siempre al anuncio original y a petición de la persona. Revisar antes de abrir al público (ver [dossier de revisión jurídica](08-dossier-revision-juridica.md)).
- Si Idealista cambia su HTML, el lector falla con «no hemos encontrado anuncios» y queda el formulario; el test con la muestra real lo detecta al actualizarla.
- Las fotos de Idealista se cargan desde su CDN; si bloquea el enlace directo, el anuncio se ve sin foto.

## Verificación (19/10/2026)

- Tests: `parse-idealista` (muestra real), `parse-ficha` e `importar` (lista blanca, trucos de dominio, URLs raras, fichas).
- En local, sin clave de Firecrawl: ficha de Idealista → aviso y formulario; texto pegado → precio, m² y título; añadido → aparece en la lista, sobrevive a recargar y se simula en las calculadoras.
- Producción (19/10/2026, tras desplegar 955acad): `/api/importar` con un listado de Idealista devuelve 30 anuncios con precio, m² y zona; un portal no admitido devuelve 400.
