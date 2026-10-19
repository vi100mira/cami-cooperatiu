import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseIdealista } from "./parse-idealista";

const md = readFileSync(join(__dirname, "__fixtures__", "idealista-edificios.md"), "utf8");

describe("parseIdealista", () => {
  const items = parseIdealista(md);
  it("lee todos los anuncios del listado", () => {
    expect(items.map((x) => x.id)).toEqual(["idealista-112833579", "idealista-111542651", "idealista-112621322", "idealista-110885676"]);
  });
  it("precio, m², zona, foto y enlace a la ficha", () => {
    const a = items[0];
    expect(a.titulo).toBe("Edificio en Calle dels Fusters, Benimàmet, València");
    expect(a.url).toBe("https://www.idealista.com/inmueble/112833579/");
    expect(a.precio).toBe(788000);
    expect(a.m2).toBe(658);
    expect(a.zona).toBe("Benimàmet, València");
    expect(a.fotos[0]).toMatch(/^https:\/\/img4\.idealista\.com\//);
    expect(a.resumen).toMatch(/^Ofrecemos/);
    expect(a.fuente).toBe("Idealista");
  });
  it("con rebaja, toma el precio actual y no el anterior", () => {
    expect(items[1].precio).toBe(499000);
    expect(items[1].m2).toBe(550);
  });
  it("quita el número de la calle de la zona y respeta los anuncios sin logo de agencia", () => {
    expect(items[2].zona).toBe("El Cabanyal-El Canyamelar, València");
    expect(items[3].zona).toBe("La Roqueta, València");
    expect(items[3].precio).toBe(1500000);
  });
  it("respeta el máximo", () => {
    expect(parseIdealista(md, 2)).toHaveLength(2);
  });
});
