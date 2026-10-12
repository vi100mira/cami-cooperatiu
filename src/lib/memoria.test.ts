import { describe, it, expect, beforeEach, vi } from "vitest";

const almacen = new Map<string, string>();
beforeEach(() => {
  almacen.clear();
  vi.resetModules();
  vi.stubGlobal("sessionStorage", { getItem: (k: string) => almacen.get(k) ?? null, setItem: (k: string, v: string) => void almacen.set(k, v), removeItem: (k: string) => void almacen.delete(k) });
});

type E = { n: number; cargando: boolean };
const normal = (x: unknown): E | null => (x && typeof x === "object" && typeof (x as E).n === "number" ? (x as E) : null);

describe("memoria de estado entre pestañas", () => {
  it("devuelve el valor por defecto y recuerda lo escrito", async () => {
    const { crearMemoria } = await import("./memoria");
    const m = crearMemoria<E>("k", { n: 0, cargando: false }, normal);
    expect(m.leer().n).toBe(0);
    m.escribir({ n: 5, cargando: false });
    expect(m.leer().n).toBe(5);
  });
  it("avisa a quien está suscrito, y deja de avisar al darse de baja", async () => {
    const { crearMemoria } = await import("./memoria");
    const m = crearMemoria<E>("k", { n: 0, cargando: false }, normal);
    const visto: number[] = [];
    const baja = m.suscribir((v) => visto.push(v.n));
    m.escribir({ n: 1, cargando: false });
    baja();
    m.escribir({ n: 2, cargando: false });
    expect(visto).toEqual([1]);
  });
  it("sobrevive a una recarga dentro de la visita (sessionStorage) y no guarda lo que se excluye", async () => {
    const a = await import("./memoria");
    const m1 = a.crearMemoria<E>("k", { n: 0, cargando: false }, normal, (v) => ({ ...v, cargando: false }));
    m1.escribir({ n: 7, cargando: true });
    vi.resetModules();
    const b = await import("./memoria");
    const m2 = b.crearMemoria<E>("k", { n: 0, cargando: false }, normal);
    expect(m2.leer()).toEqual({ n: 7, cargando: false });
  });
  it("ignora datos guardados rotos o con otra forma", async () => {
    almacen.set("k", "{no es json");
    const { crearMemoria } = await import("./memoria");
    expect(crearMemoria<E>("k", { n: 3, cargando: false }, normal).leer().n).toBe(3);
    almacen.set("k2", JSON.stringify({ otra: true }));
    expect(crearMemoria<E>("k2", { n: 4, cargando: false }, normal).leer().n).toBe(4);
  });
  it("sigue funcionando sin sessionStorage", async () => {
    vi.stubGlobal("sessionStorage", { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("bloqueado"); } });
    const { crearMemoria } = await import("./memoria");
    const m = crearMemoria<E>("k", { n: 0, cargando: false }, normal);
    m.escribir({ n: 9, cargando: false });
    expect(m.leer().n).toBe(9);
  });
});
