import { describe, it, expect, beforeEach, vi } from "vitest";

const almacen = new Map<string, string>();
beforeEach(() => {
  almacen.clear();
  vi.resetModules();
  vi.stubGlobal("sessionStorage", { getItem: (k: string) => almacen.get(k) ?? null, setItem: (k: string, v: string) => void almacen.set(k, v), removeItem: (k: string) => void almacen.delete(k) });
});

describe("apartados dentro de cada pestaña", () => {
  it("un valor guardado que ya no existe vuelve al apartado por defecto", async () => {
    const { subValida } = await import("./subpestana");
    expect(subValida("cuota", ["terreno", "cuota"], "terreno")).toBe("cuota");
    expect(subValida("borrado", ["terreno", "cuota"], "terreno")).toBe("terreno");
    expect(subValida("", ["terreno", "cuota"], "terreno")).toBe("terreno");
  });
  it("irASub guarda el apartado y se recuerda tras recargar la página", async () => {
    const a = await import("./subpestana");
    a.irASub("calc", "presupuesto");
    expect(almacen.get("camiSub.calc")).toBe(JSON.stringify("presupuesto"));
    vi.resetModules();
    const { crearMemoria } = await import("./memoria");
    expect(crearMemoria<string>("camiSub.calc", "", (x) => (typeof x === "string" ? x : null)).leer()).toBe("presupuesto");
  });
  it("cada pestaña tiene su propio apartado", async () => {
    const a = await import("./subpestana");
    a.irASub("calc", "alquiler"); a.irASub("opor", "candidatos");
    expect(almacen.get("camiSub.calc")).toBe(JSON.stringify("alquiler"));
    expect(almacen.get("camiSub.opor")).toBe(JSON.stringify("candidatos"));
  });
});
