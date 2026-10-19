/* Service worker de Techo Común: permite instalar la aplicación y abrirla sin conexión.
 *
 * Reglas de prudencia:
 *  - NUNCA toca /api/*: grupos, favoritos, sesión, búsqueda y Catastro van siempre a la red, así que no se guarda nada personal.
 *  - Las páginas se piden primero a la red y solo si no hay conexión se sirve la última copia: tras un despliegue nuevo no se ve nada antiguo.
 *  - Los ficheros de /_next/static/ llevan el hash en el nombre (no cambian nunca): se guardan al verlos y se sirven de la copia.
 *  - Las tipografías de Google se guardan para que la aplicación conserve su aspecto sin conexión.
 * Para forzar una limpieza total, cambia VERSION.
 */
const VERSION = "v1";
const PAGINAS = "techo-paginas-" + VERSION;
const ESTATICO = "techo-estatico-" + VERSION;
const FUENTES = "techo-fuentes-" + VERSION;
const ACTUALES = [PAGINAS, ESTATICO, FUENTES];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  // Guarda la página principal para poder abrir la aplicación sin conexión; si falla (sin red al instalar), no pasa nada.
  e.waitUntil(caches.open(PAGINAS).then((c) => c.add("/")).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((nombres) => Promise.all(nombres.filter((n) => n.startsWith("techo-") && !ACTUALES.includes(n)).map((n) => caches.delete(n)))).then(() => self.clients.claim()),
  );
});

async function primeroLaRed(request) {
  try {
    const r = await fetch(request);
    if (r.ok) { const c = await caches.open(PAGINAS); c.put("/", r.clone()); }
    return r;
  } catch {
    const guardada = await caches.match("/", { cacheName: PAGINAS });
    return guardada || new Response("Sin conexión. Abre la aplicación cuando vuelvas a tener red.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function primeroLaCopia(request, nombre) {
  const c = await caches.open(nombre);
  const guardada = await c.match(request);
  if (guardada) return guardada;
  const r = await fetch(request);
  if (r.ok || r.type === "opaque") c.put(request, r.clone());
  return r;
}

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/api/")) return; // siempre a la red, sin guardar nada
    if (request.mode === "navigate" && url.pathname === "/") { e.respondWith(primeroLaRed(request)); return; }
    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) { e.respondWith(primeroLaCopia(request, ESTATICO)); return; }
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") e.respondWith(primeroLaCopia(request, FUENTES));
});
