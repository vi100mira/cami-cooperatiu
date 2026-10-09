import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { parseYaencontre } from "./parse-yaencontre";
describe("parseYaencontre", () => {
  const md = readFileSync(__dirname + "/__fixtures__/yaencontre-edificios.md", "utf8");
  const r = parseYaencontre(md);
  it("extrae precio, m², zona y url", () => {
    expect(r.map((x) => x.precio)).toEqual([480000, 2700000, 800000, 499000]);
    expect(r.map((x) => x.m2)).toEqual([150, 811, 280, 550]);
    expect(r[1].zona).toBe("La Xerea");
    expect(r[0].zona).toBe("El Cabanyal- El Canyamelar");
    expect(r[0].fuente).toBe("yaencontre");
    expect(r[0].url).toMatch(/^https:\/\/www\.yaencontre\.com\/venta\//);
  });
  it("usa el precio actual, no el tachado, y no toma las inmobiliarias como anuncios", () => {
    expect(r[3].precio).toBe(499000);
    expect(r).toHaveLength(4);
  });
  it("asocia las fotos a su anuncio y saca resumen", () => {
    expect(r[0].fotos).toHaveLength(2);
    expect(r[1].fotos).toHaveLength(0);
    expect(r[3].fotos).toHaveLength(1);
    expect(r[1].resumen).toContain("EDIFICIO COMPLETO");
  });
  it("respeta el máximo", () => { expect(parseYaencontre(md, 2)).toHaveLength(2); });
});
