---
tipo: decisiones-riesgos
estado_documental: vigente
proyecto: Techo Común
ultima_revision: 2026-10-10
---

# Decisiones, riesgos y deuda

## Decisiones e invariantes

- **Coste cero**: Vercel Hobby (se pausa en vez de facturar) y Firecrawl en plan gratuito sin recarga automática. La búsqueda está apagada salvo `SEARCH_ENABLED=true`.
- **Búsqueda acotada**: lista blanca de URLs y ciudades, caché de 24 h, tope `SEARCH_DAILY_CAP` (12 por defecto, máximo 50), 20 consultas/hora por IP, enfriamiento de 10 min tras fallo, solo scrapes simples de 1 crédito.
- **Sin Idealista**: bloquea la lectura automática; solo se usaría su API oficial.
- **Sin cuentas en fase 1**: los datos del grupo quedan en su navegador; sin datos personales en servidor (RGPD).
- **Fase 2 con RLS**: si llegan las cuentas, el aislamiento entre grupos vive en la base de datos.
- **Enlazar siempre al anuncio original** y presentar todo como orientación, no asesoría jurídica ni financiera.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Términos de uso de los portales | Revisar antes de abrir al público; se puede apagar la búsqueda sin afectar al resto |
| Cambios en el HTML de los portales | Parsers con fixtures y tests; detectar fallos en uso real |
| Gasto en Firecrawl | La garantía real es la caché y el plan gratuito sin recarga; los contadores en memoria son por instancia |
| Datos de entidades desactualizados | Revisión periódica, sobre todo de la Comunitat Valenciana |
| Pérdida de datos del grupo al limpiar el navegador | Fase 1b: exportar/importar JSON |

## Deuda

- No hay CI que ejecute los tests antes del despliegue.
- Aviso de Vitest por usar `__dirname` en `vitest.config.mts`.
- Varios commits de arreglo directamente en producción (p. ej. «Arreglo de sintaxis»): no hay comprobación previa al push desde Cowork.
