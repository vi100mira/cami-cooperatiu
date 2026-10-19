import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { revisarUrl, tipoDesdeUrl, anunciosDe } from "./importar";

describe("revisarUrl", () => {
  it("admite listados y fichas de los portales conocidos", () => {
    const l = revisarUrl("https://www.idealista.com/venta-edificios/valencia-valencia/?ordenado-por=precios-asc#top");
    expect(l.ok && l.portal.id).toBe("idealista");
    expect(l.ok && l.ficha).toBe(false);
    expect(l.ok && l.url).toBe("https://www.idealista.com/venta-edificios/valencia-valencia/?ordenado-por=precios-asc");
    const f = revisarUrl("https://www.idealista.com/inmueble/109685821/");
    expect(f.ok && f.ficha).toBe(true);
    expect(f.ok && f.portal.fichaBloqueada).toBe(true);
    expect(revisarUrl("https://www.fotocasa.es/es/comprar/edificio/valencia-capital/ascensor/187654321/d").ok).toBe(true);
    expect(revisarUrl("http://www.pisos.com/venta/edificios-valencia/").ok).toBe(true);
  });
  it("rechaza otras webs, trucos de dominio y URLs raras", () => {
    expect(revisarUrl("https://example.com/x")).toEqual({ ok: false, error: "portal_no_admitido" });
    expect(revisarUrl("https://idealista.com.evil.net/x")).toEqual({ ok: false, error: "portal_no_admitido" });
    expect(revisarUrl("https://notidealista.com/x")).toEqual({ ok: false, error: "portal_no_admitido" });
    expect(revisarUrl("https://user:pass@www.idealista.com/x")).toEqual({ ok: false, error: "url_invalida" });
    expect(revisarUrl("https://www.idealista.com:8443/x")).toEqual({ ok: false, error: "url_invalida" });
    expect(revisarUrl("javascript:alert(1)")).toEqual({ ok: false, error: "url_invalida" });
    expect(revisarUrl("no es una url")).toEqual({ ok: false, error: "url_invalida" });
    expect(revisarUrl(42)).toEqual({ ok: false, error: "url_invalida" });
    expect(revisarUrl("https://www.idealista.com/" + "a".repeat(600))).toEqual({ ok: false, error: "url_invalida" });
  });
});

describe("tipoDesdeUrl", () => {
  it("deduce terrenos por la URL", () => {
    expect(tipoDesdeUrl("https://www.idealista.com/venta-terrenos/valencia-valencia/")).toBe("terrenos");
    expect(tipoDesdeUrl("https://www.idealista.com/venta-edificios/valencia-valencia/")).toBe("edificios");
  });
});

describe("anunciosDe", () => {
  it("un listado de Idealista da todos sus anuncios con la fuente", () => {
    const r = revisarUrl("https://www.idealista.com/venta-edificios/valencia-valencia/");
    if (!r.ok) throw new Error();
    const md = readFileSync(join(__dirname, "__fixtures__", "idealista-edificios.md"), "utf8");
    const items = anunciosDe(md, r.url, r.portal, false);
    expect(items).toHaveLength(4);
    expect(items.every((x) => x.fuente === "Idealista")).toBe(true);
  });
  it("una ficha da un solo anuncio, y ninguno si no tiene ni precio ni m²", () => {
    const url = "https://www.fotocasa.es/es/comprar/edificio/valencia-capital/ascensor/187654321/d";
    const r = revisarUrl(url);
    if (!r.ok) throw new Error();
    const [a] = anunciosDe("# Edificio en Russafa\n\n1.250.000 €\n\n640 m²", r.url, r.portal, true);
    expect(a).toMatchObject({ id: "fotocasa-187654321", titulo: "Edificio en Russafa", precio: 1250000, m2: 640, fuente: "Fotocasa", url });
    expect(anunciosDe("# Página sin datos", r.url, r.portal, true)).toEqual([]);
  });
});
