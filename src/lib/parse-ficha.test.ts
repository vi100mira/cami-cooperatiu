import { describe, it, expect } from "vitest";
import { parseFicha } from "./parse-ficha";

describe("parseFicha", () => {
  it("texto copiado de una ficha de Idealista", () => {
    const t = `Edificio en Calle de Guillem de Castro s/n, El Pilar, València
980.000 €
456 m² construidos
5 viviendas
2.149 €/m²
Edificio residencial construido en 1910, que ofrece un sinfín de posibilidades para un proyecto de rehabilitación.`;
    const f = parseFicha(t);
    expect(f.titulo).toBe("Edificio en Calle de Guillem de Castro s/n, El Pilar, València");
    expect(f.precio).toBe(980000);
    expect(f.m2).toBe(456);
    expect(f.viv).toBe(5);
    expect(f.resumen).toMatch(/^Edificio residencial construido/);
  });
  it("markdown con encabezado y fotos; prefiere los m² construidos y nunca toma el €/m²", () => {
    const md = `# Terreno urbano en Torrent
![foto](https://static.fotocasa.es/images/1.jpg)
![foto](https://static.fotocasa.es/images/1.jpg)
3.100 €/m²
Precio: 250.000 euros
Parcela de 1.200 m2, 800 m² construidos`;
    const f = parseFicha(md);
    expect(f.titulo).toBe("Terreno urbano en Torrent");
    expect(f.precio).toBe(250000);
    expect(f.m2).toBe(800);
    expect(f.fotos).toEqual(["https://static.fotocasa.es/images/1.jpg"]);
  });
  it("lo que no está queda en null", () => {
    const f = parseFicha("Un texto cualquiera sin datos");
    expect(f.precio).toBeNull();
    expect(f.m2).toBeNull();
    expect(f.viv).toBeNull();
  });
});
