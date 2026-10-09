import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { parsePisos } from "./parse-pisos";
describe("parsePisos", () => {
  const md = readFileSync(__dirname + "/__fixtures__/pisos-edificios.md", "utf8");
  const r = parsePisos(md);
  it("extrae anuncios con precio, m², zona y url", () => {
    expect(r.map((x) => x.precio)).toEqual([1000000, 499000, 369000, null]);
    expect(r.map((x) => x.m2)).toEqual([711, 550, 120, 680]);
    expect(r[0].zona).toBe("El Perellonet");
    expect(r[1].zona).toBe("Benimàmet");
    expect(r[0].url).toMatch(/^https:\/\/www\.pisos\.com\/comprar\//);
    expect(r[0].fuente).toBe("Pisos.com");
  });
  it("usa el precio, no el descuento, y no confunde 'Calcula tu hipoteca' con un anuncio", () => {
    expect(r[1].precio).toBe(499000);
    expect(r).toHaveLength(4);
  });
  it("extrae solo fotos del anuncio, no logos ni las del anuncio anterior", () => {
    expect(r[0].fotos).toHaveLength(2);
    expect(r[1].fotos).toHaveLength(2);
    expect(r[2].fotos).toHaveLength(1);
    r.forEach((x) => x.fotos.forEach((f) => expect(f).toMatch(/^https:\/\/fotos\.imghs\.net\/(?!prof)/)));
  });
  it("saca un resumen y respeta el máximo", () => {
    expect(r[1].resumen).toContain("benimamet");
    expect(parsePisos(md, 2)).toHaveLength(2);
  });
});
