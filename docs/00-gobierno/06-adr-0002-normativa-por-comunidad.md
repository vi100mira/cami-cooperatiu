---
tipo: adr
estado_documental: vigente
proyecto: Techo Común
adr: 0002
estado: aceptada; implementada, verificada en local y desplegada en producción (11/10/2026, commit 3390738)
fecha: 2026-10-11
ultima_revision: 2026-10-11
---

# ADR-0002: Normativa urbanística por comunidad como datos con fuente y fiabilidad

## Contexto

- El coste y la viabilidad de un terreno dependen de su clase de suelo (urbano, urbanizable, no urbanizable) y de reglas que cambian por comunidad autónoma: cesiones, dotaciones, edificabilidad, reserva de vivienda protegida. Hasta el 11/10/2026 las calculadoras trataban el suelo como un precio único.
- El 11/10/2026 se verificó la normativa de la Comunitat Valenciana con fuentes oficiales y se vio que (a) las cifras no son universales, (b) hay conflictos y cambios recientes y (c) parte de los datos son estimaciones y no normas.
- La app es de ámbito estatal y debe poder generalizarse sin reescribir el cálculo.

## Decisión

1. **Registro de normativa por comunidad** en `src/lib/normativa.ts`. Añadir una comunidad es añadir datos a `REGISTRO`; no se toca el cálculo ni la interfaz.
2. **Cada cifra lleva su norma, artículo, enlace, fecha de consulta y una fiabilidad** de tres niveles: *verificada*, *comprobar vigencia* y *estimación*. Si el texto se leyó en un portal que reproduce la norma consolidada y no en el diario oficial, se declara.
3. **Respaldo en cadena:** comunidad, marco estatal, referencias de coste y, en último término, la referencia valenciana. Lo que no es de la comunidad nunca se presenta como suyo: la referencia valenciana se degrada siempre a *estimación* y se etiqueta como «no es tu norma».
4. **El cálculo es una función pura** (`src/lib/terreno.ts`) que recibe valores ya resueltos, con pruebas.
5. **Las reglas legales no se editan; las estimaciones sí** (superficie de viales y costes de urbanización), y el cambio se muestra como «cambiado por ti».
6. **Calculadora nueva**, no ampliación de la de cuota: «Del terreno a las viviendas». El resultado clave (viviendas posibles y el botón que carga el coste del suelo urbanizado y las viviendas en las calculadoras de cuota) está siempre visible arriba, y el detalle va en tres pestañas: *Reparto* (cascadas del suelo bruto al edificable y del techo máximo al techo de la cooperativa), *Costes* y *Normas*. Cada regla de la pestaña de normas ocupa una línea y despliega su artículo, fuente, fecha y nota al pulsarla. El 12/10/2026 se adoptó esta disposición porque la versión inicial, con todo apilado, medía 2.439 px a 1024×768 y la columna de resultados fija quedaba cortada.
7. **Clases de suelo:** solar urbano, urbano por urbanizar, urbanizable y no urbanizable. El no urbanizable no calcula viviendas y lo explica.

## Alternativas descartadas

| Alternativa | Por qué no |
| --- | --- |
| Cifras fijas dentro de la calculadora | No se generaliza y esconde de dónde sale cada número. |
| Extraer la normativa automáticamente de los textos legales | Las leyes cambian, el consolidado puede ir por detrás y el análisis necesita revisión humana. Una cifra legal mal extraída es peor que ninguna. |
| Ampliar la calculadora de cuota existente | Mezcla dos preguntas distintas (qué puedo construir y cuánto cuesta cada cuota) y complica una herramienta que ya funciona. |
| Dejar al usuario editar también las reglas legales | Permite resultados que parecen avalados por la norma sin estarlo. |

## Consecuencias

**Positivas**
- La tabla de normas enseña de dónde sale cada cifra y cuánto fiarse de ella.
- Una comunidad nueva se añade como datos y la prueba de calidad exige artículo, enlace y fecha.
- El aviso de «normativa no cargada» evita aplicar sin avisar las reglas de otra comunidad.

**Riesgos y límites aceptados**
- **La normativa envejece.** El texto refundido de la LOTUP tiene una modificación publicada el 02/07/2026 y existe un anteproyecto de nueva ley del suelo valenciana. La fecha de revisión es visible y hace falta revisarla periódicamente.
- **Fuentes secundarias:** los artículos 36 y 82 de la LOTUP se leyeron en un portal jurídico que reproduce el texto consolidado, no en el diario oficial.
- **Conflicto por aclarar:** la reserva de vivienda protegida valenciana (30 %) es inferior al mínimo estatal (40 % tras la Ley 12/2023). La norma estatal permite reservas inferiores en algunos casos, pero la cifra queda marcada como *comprobar vigencia*.
- **Los costes de urbanización** (240 y 120 €/m²) salen de un informe municipal de València cuyo año no se pudo confirmar, y los 20 m² de viales por cada 100 m² de techo son un método de estimación. Son editables y están marcados como estimación.
- **Los plazos hasta poder construir** no tienen fuente: el valor por defecto es una estimación y se avisa.
- **La edificabilidad real de un terreno la fija el plan del ayuntamiento.** La calculadora es orientación y recomienda pedir el informe o cédula urbanística.
- Solo la Comunitat Valenciana está cargada. Para el resto se usa el marco estatal y referencias, con aviso.

## Estado de implementación (11/10/2026)

| Aspecto | Implementado | Verificado | Desplegado |
| --- | --- | --- | --- |
| Registro de normativa y cálculo | Sí | Pruebas unitarias del cálculo (ejemplo de 1 ha: 45 % edificable, 90 viviendas, 660.000 € de urbanización) y de la calidad de las fuentes | Sí (11/10/2026) |
| Calculadora «Del terreno a las viviendas» | Sí | Navegador en local: suelo no urbanizable, comunidad sin cargar (Andalucía), botón de carga a las calculadoras de cuota y vista de móvil sin desbordamiento. En producción solo se comprobó que el código nuevo está servido; la interfaz no se recorrió en el navegador | Sí (11/10/2026) |

## Pendiente

1. Verificar los artículos 36 y 82 de la LOTUP en el diario oficial y comprobar la reserva del 30 % frente al 40 % estatal.
2. Confirmar el año del informe de València de los módulos de urbanización.
3. Cargar otras comunidades, con revisión de cada fuente.
4. Decidir una revisión periódica de la normativa y qué hacer ante el anteproyecto de ley del suelo valenciana.
5. Valorar guardar la clase de suelo en la ficha de cada candidato y leerla de los anuncios cuando el portal la indique.

## Evidencia en el código

`src/lib/normativa.ts`, `src/lib/terreno.ts`, `src/components/Terreno.tsx` y las pruebas `normativa.test.ts` y `terreno.test.ts`.
