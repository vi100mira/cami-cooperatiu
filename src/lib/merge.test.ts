import { describe, it, expect } from "vitest";
import { unirListados } from "./merge";
import type { Listing } from "./parse-fotocasa";
const L = (id: string, fuente: string, precio: number | null, m2: number | null, fotos: string[] = []): Listing => ({ id, titulo: id, url: "https://x/" + id, precio, m2, zona: "", resumen: "", fotos, fuente });
describe("unirListados", () => {
  it("une el mismo inmueble de dos portales y anota el otro enlace", () => {
    const r = unirListados([[L("a", "Fotocasa", 499000, 593)], [L("b", "Pisos.com", 499000, 593), L("c", "Pisos.com", 369000, 120)]]);
    expect(r.map((x) => x.id)).toEqual(["a", "c"]);
    expect(r[0].otras).toEqual([{ fuente: "Pisos.com", url: "https://x/b" }]);
  });
  it("no une anuncios sin precio o m² conocidos", () => {
    expect(unirListados([[L("a", "Fotocasa", null, 100)], [L("b", "Pisos.com", null, 100)]])).toHaveLength(2);
  });
  it("no repite el mismo portal en 'otras' y completa fotos si faltan", () => {
    const r = unirListados([[L("a", "Fotocasa", 1, 1)], [L("b", "Pisos.com", 1, 1, ["https://f/1", "https://f/2"]), L("c", "Pisos.com", 1, 1)]]);
    expect(r[0].otras).toHaveLength(1);
    expect(r[0].fotos).toHaveLength(2);
  });
});
