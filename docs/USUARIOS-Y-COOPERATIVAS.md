# Modelo de usuarios y cooperativas (decisión de arquitectura)

## Recomendación

**Fase 1 (MVP, hecho): sin cuentas. Un navegador = un grupo.** Todo se guarda en `localStorage`.
**Fase 2: cuenta = persona, grupo = cooperativa, con pertenencia (membership).** Se construye cuando haya demanda real de trabajar en equipo.

### Por qué no cuentas desde el día 1
- Coste y riesgo cero: sin base de datos no hay factura posible ni datos personales que proteger (RGPD).
- Aislamiento total gratis: los datos de un grupo nunca salen de su navegador; nadie puede ver ni tocar los de otro.
- Las cuentas añaden mantenimiento, correos, soporte y responsabilidad legal antes de saber si hacen falta.
- Límite conocido: sin cuenta no se comparte entre dispositivos ni entre personas del grupo. Mitigación incluida en la fase 1b (abajo).

### Fase 1b (pequeña, sin servidor)
- Exportar/importar los datos del grupo como un archivo JSON (copia de seguridad y paso de un dispositivo a otro o a otra persona del grupo).
- Varios grupos por navegador (cooperativa 1, 2…) con un selector: la clave de `localStorage` pasa a incluir el id del grupo.

### Fase 2: cuentas y colaboración
Modelo de datos (Postgres):
- `profiles(id = auth.uid, nombre)`
- `groups(id, nombre, region, ciudad, created_by)`
- `memberships(group_id, user_id, rol: 'admin' | 'miembro')`
- `group_data(group_id, data jsonb, updated_at)`: progreso, candidatos y calculadoras (el mismo objeto que hoy está en localStorage).

**Aislamiento:** Row Level Security en cada tabla: se puede leer/escribir una fila solo si existe una `membership` del usuario para ese `group_id`. La seguridad vive en la base de datos, no en el código de la app, así un fallo de frontend no abre datos de otros grupos. Invitar a una persona = enlace de invitación de un solo uso que crea su `membership`.

**Autenticación:** enlace mágico por correo (sin contraseñas que custodiar).

**Stack y coste:** Supabase (Auth + Postgres + RLS) en plan gratuito, o Neon + Auth.js. Con el plan gratuito no se factura por excedente: al llegar a los límites el proyecto se limita o pausa. Condiciones para no recibir una factura: no pasar a un plan de pago, no activar complementos de pago y fijar alertas de uso. Un grupo guarda unos pocos KB, así que el límite de almacenamiento queda lejísimos.

**Colaboración simultánea:** en el MVP de fase 2 basta "último en guardar gana" con aviso si hay una versión más reciente; edición en tiempo real solo si se pide.

**Datos personales:** guardar solo lo necesario (correo y datos del grupo). No pedir ingresos individuales de las familias en el servidor: el campo de ingresos de las calculadoras puede seguir siendo local.
