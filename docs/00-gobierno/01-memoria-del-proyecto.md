---
tipo: memoria-proyecto
estado_documental: vigente
proyecto: Techo Común
ultima_revision: 2026-10-19
---

# Memoria del proyecto Techo Común

## Propósito

Guía web gratuita y sin ánimo de lucro para que un grupo de personas cree una cooperativa de vivienda en cesión de uso en España. Nombre inicial: Camí Cooperatiu (de ahí el repositorio `cami-cooperatiu`); renombrado a Techo Común el 9/10/2026.

## Objetivo (confirmado por el autor, 10/10/2026)

Herramienta para **gestionar grupos cooperativistas** y generar alternativas a las formas habituales de acceder a la vivienda. No es solo una guía informativa: el grupo es el centro del producto.

## Usuarios

Grupos que quieren formar una cooperativa de vivienda. Ámbito estatal, con datos propios de la Comunitat Valenciana. A 10/10/2026 el único desarrollador y usuario de pruebas es el autor.

## Capacidades

- **Ruta**: 6 fases con progreso marcable.
- **Calculadoras**: 3 calculadoras de viabilidad; se precargan desde un resultado de búsqueda («Simular»).
- **Del terreno a las viviendas** (desplegado el 11/10/2026): calculadora de terreno que, según la clase de suelo (solar, urbano por urbanizar, urbanizable o no urbanizable), calcula cuánto suelo es edificable tras viales, dotaciones y cesiones, las viviendas posibles y el coste del suelo urbanizado, y los carga en las de cuota. Cada cifra normativa sale de un registro por comunidad (hoy solo la Comunitat Valenciana) con su artículo, fuente, fecha y fiabilidad. Ver [ADR-0002](06-adr-0002-normativa-por-comunidad.md).
- **Oportunidades**: vías de acceso a suelo o edificio (concurso, promoción parada, Sareb/Casa 47…), con contacto directo a FECOVI y sección de sorteos de alquiler de Casa 47 para personas socias.
- **Búsqueda en vivo**: edificios y terrenos en Fotocasa, Pisos.com y yaencontre (también terrenos de bancos), València ciudad o provincia, unión sin duplicados, filtros y detección de gestoras de Sareb (Hipoges, Aliseda). Desde el 12/10/2026 ordena por defecto «ajustado a tu cooperativa»: compara las viviendas estimadas o los m² con las familias, y el precio con la mitad del capital orientativo (aportación y préstamo de las calculadoras), con etiquetas en cada anuncio y una casilla que oculta solo los casos extremos.
- **Sin ahorro** (desplegado el 19/10/2026): apartado de las calculadoras para grupos que parten de cero. Calcula lo que no presta el banco (por defecto, el 20 % del coste) y propone formas reales de cubrirlo sin aportación inicial: préstamo participativo o puente devuelto en la cuota, capital de personas colaboradoras (títulos participativos, como La Borda con Coop57), una mezcla de ambos, suelo público en derecho de superficie y la ayuda que haría falta. Cada propuesta da la cuota por familia, cuándo baja y si cabe en el 30 % de los ingresos, y recomienda la más barata que cabe.
- **Anuncios desde un enlace** (desplegado el 19/10/2026): pegar una búsqueda o un anuncio de Idealista, Fotocasa, Pisos.com o yaencontre los añade a la lista de la búsqueda, con todo lo demás conectado. Las fichas de Idealista se rellenan a mano o pegando su texto. Ver [ADR-0005](10-adr-0005-anuncios-desde-enlaces.md).
- **Búsqueda en portales**: enlaces preparados para cualquier ciudad.
- **Candidatos**: fotos, mapa bajo demanda, Catastro (referencia por dirección) y enlaces a planos.
- **Entidades**: directorio adaptado por comunidad autónoma con mensajes listos.
- **Grupo y favoritos** (desplegado el 11/10/2026): cualquier grupo puede darse de alta con contraseña de grupo y contraseñas personales, sin correo ni OAuth. Cada persona marca ofertas con un corazón en la búsqueda en vivo y el grupo ve todos los favoritos con el nombre de quien los marcó, con filtro «todos / solo los míos». Aviso de privacidad visible y borrado del propio perfil. Ver [ADR-0001](05-adr-0001-grupos-y-favoritos-con-supabase.md).
- **Preguntas frecuentes y glosario.**

## Arquitectura

```text
Navegador (ruta, calculadoras y candidatos en localStorage; cookie de sesión del grupo)
  → Next.js 16 en Vercel (Hobby)
      ├ /api/buscar   → Firecrawl → Fotocasa, Pisos.com, yaencontre
      │                 (lista blanca, caché 24 h, tope diario, límite por IP, enfriamiento)
      ├ /api/importar → Firecrawl → enlace pegado de Idealista, Fotocasa, Pisos.com o yaencontre
      │                 (lista blanca de portales y las mismas protecciones)
      ├ /api/catastro → Sede Electrónica del Catastro
      └ /api/{grupos,miembros,favoritos,sesion}
                      → Supabase (Postgres en la UE; RLS sin políticas, solo clave de servidor)
```

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, componentes estilo shadcn/ui, Lucide, Vitest, Supabase (grupos y favoritos) y bcryptjs. Sin cuentas externas ni OAuth: el acceso es por contraseña de grupo y personal.

## Forma de trabajo

Desarrollo con sesiones de Claude (Cowork) que publican directamente en GitHub (`vi100mira/cami-cooperatiu`, rama `main`). Cada push a `main` despliega en Vercel. Copia local en `OneDrive\Documents\02_Profesional\01_Proyectos\CamiCooperatiu`, que debe actualizarse con `git pull` antes de trabajar en ella.
