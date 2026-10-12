---
tipo: dossier
estado_documental: vigente
proyecto: Techo Común
fecha: 2026-10-12
ultima_revision: 2026-10-12
---

# Dossier para la revisión jurídica de Techo Común

Resumen para quien revise el aviso de privacidad. No es asesoramiento jurídico: recoge los hechos y las dudas para que un profesional los valide.

## 1. Qué datos se tratan

| Dato | Cuándo | Dónde se guarda |
| --- | --- | --- |
| Nombre o alias de cada persona del grupo | Al unirse a un grupo | Supabase (UE, París) |
| Nombre del grupo cooperativo | Al crear el grupo | Supabase |
| Contraseña del grupo y contraseña personal | Al crear o entrar | Solo su resumen criptográfico (bcrypt, coste 12) |
| Código de recuperación del grupo | Al crear el grupo (se enseña una vez) | Solo su resumen criptográfico (bcrypt) |
| Quién administra el grupo | Al crear el grupo | Supabase (marca en la ficha de la persona) |
| Datos básicos de la cooperativa: comunidad, ciudad, número de familias, barrio, centro de acción (municipio) y distancia máxima en km | Al rellenarlos estando dentro de un grupo | Supabase, en el grupo (ADR-0004) |
| Favoritos (anuncios marcados con el corazón) | Al marcarlos | Supabase |
| Fecha de última actividad del grupo | Al entrar o marcar favoritos | Supabase |
| Dirección IP | En cada petición | Solo en memoria del servidor, para limitar abusos; no se guarda en la base |
| Datos de las calculadoras (ingresos, capital, familias) | Al usarlas | Solo en el navegador de la persona; no se envían |

No se piden correo, teléfono, DNI ni datos de categorías especiales. Tampoco hay analítica ni cookies publicitarias; la única cookie es de sesión (`tc_sesion`, necesaria, 12 horas, `httpOnly`, `sameSite=strict`).

## 2. Quién es el responsable

Leida cooperativa, contacto pilarleida@gmail.com. Consta en el texto del aviso (`src/components/Privacidad.tsx`).

## 3. Encargados y transferencias

- **Supabase**: base de datos en la región `eu-west-3` (París).
- **Vercel**: alojamiento de la web, empresa estadounidense.
- Comprobado el 12/10/2026 en sus contratos de tratamiento de datos (DPA): Vercel (actualizado el 17/03/2026, anexo de mecanismos de transferencia internacional) y Supabase incorporan las **cláusulas contractuales tipo** de la Comisión Europea (Decisión de Ejecución (UE) 2021/914). Ninguno menciona el Marco de Privacidad de Datos UE–EE. UU.
- El aviso lo dice así: puede haber transferencias internacionales y las cubren esas cláusulas.

## 4. Medidas de seguridad aplicadas

Contraseñas con resumen bcrypt; sesión firmada con HMAC-SHA256; errores genéricos para no revelar si un grupo existe; igualación de tiempos de respuesta; límite de intentos por IP; tablas con seguridad a nivel de fila activada y sin políticas públicas (solo accede el servidor con la clave de servicio); funciones de administración sin permiso para la clave pública.

## 5. Conservación

No hay caducidad automática (ADR-0003). Se anota la fecha de última actividad y el responsable puede listar y borrar a mano los grupos inactivos (plazo mínimo de 3 meses). Un grupo se borra también cuando se va su última persona.

## 6. Preguntas para la persona que revise

1. ¿Es válida la base jurídica (consentimiento) y está bien redactada la información de primera capa?
2. ¿Bastan las cláusulas contractuales tipo para las transferencias a Vercel, o hace falta una evaluación de impacto de la transferencia?
3. ¿Es aceptable conservar los datos indefinidamente mientras haya actividad o nadie ejecute la purga, o conviene fijar un plazo automático?
4. ¿Hace falta un registro de actividades de tratamiento o una evaluación de impacto con este volumen y tipo de datos?
5. ¿Debe el aviso mencionar algo más sobre menores, derecho de supresión de una sola persona o el procedimiento de ejercicio de derechos, dado que no hay correo en la base?
6. Los datos de «Tu cooperativa» (comunidad, ciudad, número de familias, barrio, centro de acción y distancia máxima) se comparten desde el 12/10/2026 entre las personas del grupo (ADR-0004). ¿Basta el aviso actual, o junto al nombre del grupo se consideran datos que exigen algo más?
7. Quien administra el grupo puede quitar a una persona y restablecer su contraseña, y existe un código de recuperación de grupo de un solo uso. ¿Es suficiente la información que se da sobre ello y sobre quién puede ver o cambiar qué?

## 7. Dónde está cada cosa

Aviso: `src/components/Privacidad.tsx`. Decisiones: ADR-0001 (grupos y favoritos) y ADR-0003 (conservación). Esquema: `supabase/migrations/`.
