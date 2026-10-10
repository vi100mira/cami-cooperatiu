---
tipo: memoria-proyecto
estado_documental: vigente
proyecto: Techo Común
ultima_revision: 2026-10-10
---

# Memoria del proyecto Techo Común

## Propósito

Guía web gratuita y sin ánimo de lucro para que un grupo de personas cree una cooperativa de vivienda en cesión de uso en España. Nombre inicial: Camí Cooperatiu (de ahí el repositorio `cami-cooperatiu`); renombrado a Techo Común el 9/10/2026.

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
- **Preguntas frecuentes y glosario.**

## Arquitectura

```text
Navegador (estado en localStorage)
  → Next.js 16 en Vercel (Hobby)
      ├ /api/buscar   → Firecrawl → Fotocasa, Pisos.com, yaencontre
      │                 (lista blanca, caché 24 h, tope diario, límite por IP, enfriamiento)
      └ /api/catastro → Sede Electrónica del Catastro
```

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, componentes estilo shadcn/ui, Lucide, Vitest. Sin base de datos ni cuentas.

## Forma de trabajo

Desarrollo con sesiones de Claude (Cowork) que publican directamente en GitHub (`vi100mira/cami-cooperatiu`, rama `main`). Cada push a `main` despliega en Vercel. Copia local en `OneDrive\Documents\02_Profesional\01_Proyectos\CamiCooperatiu`, que debe actualizarse con `git pull` antes de trabajar en ella.
