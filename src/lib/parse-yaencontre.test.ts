import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { parseYaencontre } from "./parse-yaencontre";
import { detectGestora } from "./gestoras";
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


describe("gestoras de Sareb", () => {
  it("reconoce Hipoges por el id de agencia de yaencontre", () => {
    expect(detectGestora("https://www.yaencontre.com/venta/piso/inmueble-21204-112757163")).toBe("Hipoges");
  });
  it("reconoce Aliseda por su id de agencia (65243)", () => {
    expect(detectGestora("https://www.yaencontre.com/venta/piso/inmueble-65243-111249267")).toBe("Aliseda");
  });
  it("reconoce por el nombre del anunciante y no confunde otras agencias", () => {
    expect(detectGestora("https://x.es/a", "ALISEDA Servicios Inmobiliarios")).toBe("Aliseda");
    expect(detectGestora("https://www.yaencontre.com/venta/edificio/inmueble-69432-1", "SUNSTAY")).toBeUndefined();
  });
  it("el parser marca el anuncio de Hipoges", () => {
    const md = "### [Casa en El Grau, Valencia](https://www.yaencontre.com/venta/casa/inmueble-21204-112778642)     184.000 €\n\n66 m²2.787 €/m²\n\nNO COBRAMOS COMISIÓN DE INTERMEDIACIÓN AL COMPRADOR\n";
    expect(parseYaencontre(md)[0].gestora).toBe("Hipoges");
  });
});
