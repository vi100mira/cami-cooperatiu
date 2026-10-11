import { describe, it, expect } from "vitest";
import { ofertaIdDe, datosDeListing } from "./favoritos";
import { datosOferta } from "./validate";
import type { Listing } from "./parse-fotocasa";

const L: Listing = { id: "123", titulo: "Edificio en venta", url: "https://www.fotocasa.es/es/x/123/d", precio: 900000, m2: 700, zona: "Russafa", resumen: "", fotos: [], fuente: "Fotocasa" };

describe("ofertaIdDe", () => {
  it("combina portal e id del anuncio", () => { expect(ofertaIdDe(L)).toBe("Fotocasa:123"); });
  it("distingue el mismo id en portales distintos", () => {
    expect(ofertaIdDe({ ...L, fuente: "Pisos.com" })).not.toBe(ofertaIdDe(L));
  });
  it("resume los ids demasiado largos y es estable", () => {
    const largo = { ...L, id: "https://www.fotocasa.es/" + "a".repeat(400) };
    const id = ofertaIdDe(largo);
    expect(id.length).toBeLessThanOrEqual(200);
    expect(ofertaIdDe(largo)).toBe(id);
  });
});

describe("datosDeListing", () => {
  it("produce datos que el servidor acepta", () => {
    expect(datosOferta(datosDeListing(L, "edificios")).ok).toBe(true);
  });
  it("no incluye fotos ni resumen, solo la lista blanca", () => {
    const d = datosDeListing({ ...L, fotos: ["https://x/1.jpg"], resumen: "texto largo" }, "terrenos");
    expect(Object.keys(d).sort()).toEqual(["fuente", "m2", "precio", "tipo", "titulo", "url", "zona"]);
  });
});
