import { describe, it, expect } from "vitest";
import { viviendasEstimadas, precioPorVivienda, filtrar, portalLinks } from "./fit";
import type { Listing } from "./parse-fotocasa";

const L = (id: string, precio: number | null, m2: number | null): Listing => ({ id, titulo: id, url: "https://x/" + id, precio, m2, zona: "", resumen: "", fotos: [] });

describe("fit", () => {
  it("estima viviendas solo para edificios con m² fiables", () => {
    expect(viviendasEstimadas({ m2: 800 }, "edificios")).toBe(10);
    expect(viviendasEstimadas({ m2: 40 }, "edificios")).toBeNull();
    expect(viviendasEstimadas({ m2: 800 }, "terrenos")).toBeNull();
    expect(precioPorVivienda({ m2: 800, precio: 1_000_000 }, "edificios")).toBe(100_000);
  });
  it("filtra y ordena por precio por vivienda", () => {
    const items = [L("a", 1_000_000, 800), L("b", 600_000, 800), L("c", 500_000, 160), L("d", null, 800)];
    const r = filtrar(items, "edificios", { maxPrecio: 0, minViv: 5, maxPv: 0, orden: "pv" });
    expect(r.map((x) => x.id)).toEqual(["b", "a", "d"]);
    expect(filtrar(items, "edificios", { maxPrecio: 700_000, minViv: 0, maxPv: 0, orden: "relevancia" }).map((x) => x.id)).toEqual(["b", "c"]);
    expect(filtrar(items, "edificios", { maxPrecio: 0, minViv: 0, maxPv: 80_000, orden: "relevancia" }).map((x) => x.id)).toEqual(["b"]);
  });
  it("genera enlaces para cualquier ciudad", () => {
    const l = portalLinks("Alcoy", "terrenos", 300000);
    expect(l).toHaveLength(5);
    expect(decodeURIComponent(l[0].url)).toContain("site:idealista.com solar urbano en venta Alcoy hasta 300000 €");
  });
});
