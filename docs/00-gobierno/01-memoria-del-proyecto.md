---
tipo: memoria-proyecto
estado_documental: vigente
proyecto: Techo Común
ultima_revision: 2026-10-11
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
- **Oportunidades**: vías de acceso a suelo o edificio (concurso, promoción parada, Sareb/Casa 47…), con contacto directo a FECOVI y sección de sorteos de alquiler de Casa 47 para personas socias.
- **Búsqueda en vivo**: edificios y terrenos en Fotocasa, Pisos.com y yaencontre (también terrenos de bancos), València ciudad o provincia, unión sin duplicados, filtros y detección de gestoras de Sareb (Hipoges, Aliseda).
- **Búsqueda en portales**: enlaces preparados para cualquier ciudad.
- **Candidatos**: fotos, mapa bajo demanda, Catastro (referencia por dirección) y enlaces a planos.
- **Entidades**: directorio adaptado por comunidad autónoma con mensajes listos.
- **Grupo y favoritos** (desde el 11/10/2026, aún no desplegado): cualquier grupo puede darse de alta con contraseña de grupo y contraseñas personales, sin correo ni OAuth. Cada persona marca ofertas con un corazón en la búsqueda en vivo y el grupo ve todos los favoritos con el nombre de quien los marcó, con filtro «todos / solo los míos». Aviso de privacidad visible y borrado del propio perfil. Ver [ADR-0001](05-adr-0001-grupos-y-favoritos-con-supabase.md).
- **Preguntas frecuentes y glosario.**

## Arquitectura

```text
Navegador (ruta, calculadoras y candidatos en localStorage; cookie de sesión del grupo)
  → Next.js 16 en Vercel (Hobby)
      ├ /api/buscar   → Firecrawl → Fotocasa, Pisos.com, yaencontre
      │                 (lista blanca, caché 24 h, tope diario, límite por IP, enfriamiento)
      ├ /api/catastro → Sede Electrónica del Catastro
      └ /api/{grupos,miembros,favoritos,sesion}
                      → Supabase (Postgres en la UE; RLS sin políticas, solo clave de servidor)
```

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, componentes estilo shadcn/ui, Lucide, Vitest, Supabase (grupos y favoritos) y bcryptjs. Sin cuentas externas ni OAuth: el acceso es por contraseña de grupo y personal.

## Forma de trabajo

Desarrollo con sesiones de Claude (Cowork) que publican directamente en GitHub (`vi100mira/cami-cooperatiu`, rama `main`). Cada push a `main` despliega en Vercel. Copia local en `OneDrive\Documents\02_Profesional\01_Proyectos\CamiCooperatiu`, que debe actualizarse con `git pull` antes de trabajar en ella.
