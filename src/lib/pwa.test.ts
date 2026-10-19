import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import vm from "vm";
import manifest from "../app/manifest";

const PUBLIC = join(__dirname, "../../public");

describe("manifiesto de la aplicación instalable", () => {
  const m = manifest();
  it("tiene lo que los navegadores exigen para instalarla", () => {
    expect(m.name).toBe("Techo Común");
    expect(m.short_name!.length).toBeLessThanOrEqual(12);
    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.lang).toBe("es");
    expect(m.background_color).toBe("#0b1324");
    expect(m.theme_color).toBe("#0b1324");
  });
  it("declara iconos de 192 y 512 px y uno «maskable» para Android", () => {
    const tam = (m.icons ?? []).map((i) => i.sizes);
    expect(tam).toContain("192x192");
    expect(tam).toContain("512x512");
    expect((m.icons ?? []).some((i) => i.purpose === "maskable")).toBe(true);
  });
  it("todos los iconos existen como PNG con las medidas que dicen", () => {
    for (const i of [...(m.icons ?? []), ...(m.shortcuts ?? []).flatMap((s) => s.icons ?? [])]) {
      const f = join(PUBLIC, i.src);
      expect(existsSync(f), i.src).toBe(true);
      const b = readFileSync(f);
      expect(b.subarray(1, 4).toString(), i.src).toBe("PNG");
      expect(`${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`, i.src).toBe(i.sizes);
    }
    const apple = readFileSync(join(PUBLIC, "icons/apple-touch-icon.png"));
    expect(apple.readUInt32BE(16)).toBe(180);
  });
  it("los accesos directos abren pestañas que existen", () => {
    for (const s of m.shortcuts ?? []) expect(s.url, s.name).toMatch(/^\/#(calc|opor|docs)$/);
  });
});

// El service worker se ejecuta aquí con un navegador simulado para comprobar qué hace con cada petición.
function cargarSW() {
  const oyentes: Record<string, (e: unknown) => void> = {};
  const almacenes = new Map<string, Map<string, Response>>();
  const abrir = (n: string) => { if (!almacenes.has(n)) almacenes.set(n, new Map()); return almacenes.get(n)!; };
  const clave = (r: string | Request) => (typeof r === "string" ? new URL(r, "https://app.test").pathname : new URL(r.url).pathname + new URL(r.url).search);
  const caches = {
    open: async (n: string) => { const a = abrir(n); return { match: async (r: string | Request) => a.get(clave(r))?.clone(), put: async (r: string | Request, v: Response) => void a.set(clave(r), v), add: async (r: string) => void a.set(clave(r), new Response("inicio")) }; },
    match: async (r: string, o?: { cacheName?: string }) => abrir(o?.cacheName ?? "").get(clave(r))?.clone(),
    keys: async () => [...almacenes.keys()],
    delete: async (n: string) => almacenes.delete(n),
  };
  const estado = { red: true };
  const fetchSim = async (r: Request | string) => { if (!estado.red) throw new Error("sin red"); return new Response("de la red:" + (typeof r === "string" ? r : r.url), { status: 200 }); };
  const self = { addEventListener: (t: string, f: (e: unknown) => void) => { oyentes[t] = f; }, skipWaiting: () => {}, clients: { claim: async () => {} }, location: { origin: "https://app.test" } };
  vm.runInNewContext(readFileSync(join(PUBLIC, "sw.js"), "utf8"), { self, caches, fetch: fetchSim, Response, URL, Promise, Error });
  const pedir = (url: string, opciones: { metodo?: string; navegacion?: boolean } = {}) => {
    let respuesta: Promise<Response> | null = null;
    const request = { method: opciones.metodo ?? "GET", url, mode: opciones.navegacion ? "navigate" : "cors" } as unknown as Request;
    oyentes.fetch({ request, respondWith: (p: Promise<Response>) => { respuesta = p; } });
    return respuesta as Promise<Response> | null;
  };
  return { pedir, estado, almacenes, oyentes };
}

describe("service worker", () => {
  it("nunca toca /api: ni lee ni guarda nada de grupos, favoritos, sesión, búsqueda o Catastro", () => {
    const { pedir, almacenes } = cargarSW();
    for (const u of ["https://app.test/api/sesion", "https://app.test/api/favoritos?filtro=todos", "https://app.test/api/buscar?tipo=edificios", "https://app.test/api/catastro?x=1"]) expect(pedir(u), u).toBeNull();
    expect(pedir("https://app.test/api/favoritos", { metodo: "POST" })).toBeNull();
    expect([...almacenes.values()].every((a) => ![...a.keys()].some((k) => k.startsWith("/api"))), "no hay /api en ninguna caché").toBe(true);
  });

  it("no gestiona las peticiones que no son GET, ni páginas o ficheros que no son suyos, ni otros dominios", () => {
    const { pedir } = cargarSW();
    expect(pedir("https://app.test/", { metodo: "POST", navegacion: true })).toBeNull();
    expect(pedir("https://app.test/sw.js")).toBeNull();
    expect(pedir("https://app.test/manifest.webmanifest")).toBeNull();
    expect(pedir("https://otro-sitio.example/script.js")).toBeNull();
  });

  it("la página principal: primero la red, y guarda la copia", async () => {
    const { pedir, almacenes } = cargarSW();
    const r = await pedir("https://app.test/", { navegacion: true })!;
    expect(await r.text()).toContain("de la red:");
    expect(almacenes.get("techo-paginas-v1")!.has("/")).toBe(true);
  });

  it("sin conexión sirve la última copia de la página principal, y si no hay copia avisa", async () => {
    const { pedir, estado, almacenes } = cargarSW();
    await pedir("https://app.test/", { navegacion: true })!;      // con red: guarda
    estado.red = false;
    expect(await (await pedir("https://app.test/", { navegacion: true })!).text()).toContain("de la red:");
    almacenes.clear();
    const sinCopia = await pedir("https://app.test/", { navegacion: true })!;
    expect(sinCopia.status).toBe(503);
    expect(await sinCopia.text()).toContain("Sin conexión");
  });

  it("los ficheros con hash de /_next/static y los iconos: se guardan al verlos y se sirven de la copia", async () => {
    const { pedir, estado } = cargarSW();
    const url = "https://app.test/_next/static/chunks/abc123.js";
    expect(await (await pedir(url)!).text()).toContain("de la red:");
    expect(await (await pedir("https://app.test/icons/icon-192.png")!).text()).toContain("de la red:");
    estado.red = false;
    expect(await (await pedir(url)!).text()).toContain("de la red:"); // ya sin red, de la copia
    expect(await (await pedir("https://app.test/icons/icon-192.png")!).text()).toContain("de la red:");
  });

  it("las tipografías de Google se guardan para conservar el aspecto sin conexión", () => {
    const { pedir } = cargarSW();
    expect(pedir("https://fonts.gstatic.com/s/x.woff2")).not.toBeNull();
    expect(pedir("https://fonts.googleapis.com/css2?family=X")).not.toBeNull();
  });

  it("al activarse borra las cachés de versiones antiguas y conserva las actuales", async () => {
    const { oyentes, almacenes } = cargarSW();
    almacenes.set("techo-paginas-v0", new Map()); almacenes.set("techo-paginas-v1", new Map()); almacenes.set("otra-aplicacion", new Map());
    let espera: Promise<unknown> = Promise.resolve();
    oyentes.activate({ waitUntil: (p: Promise<unknown>) => { espera = p; } });
    await espera;
    expect([...almacenes.keys()].sort()).toEqual(["otra-aplicacion", "techo-paginas-v1"]);
  });
});
