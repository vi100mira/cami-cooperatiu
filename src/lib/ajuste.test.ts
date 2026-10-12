import { describe, it, expect } from "vitest";
import { capacidad, CDEF } from "./calc";
import { ajuste, filtrar, filtrarTodo, type Cooperativa } from "./fit";
import type { Listing } from "./parse-fotocasa";

const L = (id: string, precio: number | null, m2: number | null): Listing => ({ id, titulo: id, url: "https://x/" + id, precio, m2, zona: "", resumen: "", fotos: [] });
// Tres familias con un capital total de 585.000 €: el suelo o edificio no debería pasar de 292.500 €.
const tres: Cooperativa = { familias: 3, capital: 585_000, m2Vivienda: 90 };
const base = { maxPrecio: 0, minViv: 0, maxPv: 0, verTodo: true };

describe("capacidad de la cooperativa", () => {
  it("suma la aportación y el préstamo que sostiene el 30 % de los ingresos", () => {
    const c = capacidad(CDEF, 3);
    expect(c.cuotaMax).toBeCloseTo(815, 6); // 36.000 / 12 × 0,3 − 60 − 25
    expect(c.prestamoPorFamilia).toBeGreaterThan(175_000);
    expect(c.prestamoPorFamilia).toBeLessThan(190_000);
    expect(c.porFamilia).toBeCloseTo(15_000 + c.prestamoPorFamilia, 6);
    expect(c.total).toBeCloseTo(3 * c.porFamilia, 6);
  });
  it("crece con el número de familias y con las ayudas", () => {
    expect(capacidad(CDEF, 6).total).toBeCloseTo(2 * capacidad(CDEF, 3).total, 6);
    expect(capacidad({ ...CDEF, subv: 100_000 }, 3).total).toBeCloseTo(capacidad(CDEF, 3).total + 100_000, 6);
  });
  it("sin margen para préstamo solo cuenta la aportación", () => {
    const c = capacidad({ ...CDEF, ingresos: 1_000 }, 2);
    expect(c.prestamoPorFamilia).toBe(0);
    expect(c.total).toBe(2 * 15_000);
  });
  it("con interés cero no divide por cero", () => {
    const c = capacidad({ ...CDEF, interes: 0 }, 1);
    expect(Number.isFinite(c.total)).toBe(true);
    expect(c.prestamoPorFamilia).toBeCloseTo(815 * 360, 6);
  });
});

describe("encaje de un anuncio con la cooperativa", () => {
  it("un edificio de 3 viviendas y precio asumible encaja con 3 familias", () => {
    const a = ajuste(L("a", 250_000, 240), "edificios", tres);
    expect(a.etiquetas).toEqual(["encaja"]);
    expect(a.oculto).toBe(false);
    expect(a.puntos).toBe(0);
  });
  it("un edificio de 10 viviendas para 3 familias se etiqueta como grande, pero no se oculta", () => {
    const a = ajuste(L("g", 250_000, 800), "edificios", tres);
    expect(a.etiquetas).toEqual(["grande"]);
    expect(a.oculto).toBe(false);
  });
  it("uno de 15 viviendas para 3 familias es enorme y se marca para ocultar", () => {
    const a = ajuste(L("e", 250_000, 1_200), "edificios", tres);
    expect(a.etiquetas).toContain("grande");
    expect(a.oculto).toBe(true);
  });
  it("lo más caro que todo el capital se oculta y se etiqueta como caro", () => {
    const a = ajuste(L("c", 700_000, 240), "edificios", tres);
    expect(a.etiquetas).toContain("caro");
    expect(a.oculto).toBe(true);
  });
  it("lo caro pero dentro del capital se etiqueta sin ocultarse", () => {
    const a = ajuste(L("c", 400_000, 240), "edificios", tres);
    expect(a.etiquetas).toEqual(["caro"]);
    expect(a.oculto).toBe(false);
  });
  it("un edificio de una sola vivienda es pequeño para 3 familias", () => {
    const a = ajuste(L("p", 100_000, 90), "edificios", tres);
    expect(a.etiquetas).toContain("pequeno");
    expect(a.oculto).toBe(true);
  });
  it("sin m² fiables no hay dato de tamaño y no se oculta", () => {
    const a = ajuste(L("s", 100_000, null), "edificios", tres);
    expect(a.etiquetas).toEqual(["sin-dato"]);
    expect(a.oculto).toBe(false);
  });
  it("una finca enorme no es relevante para una cooperativa pequeña", () => {
    const finca = ajuste(L("f", 90_000, 100_000), "terrenos", tres);
    expect(finca.etiquetas).toContain("grande");
    expect(finca.oculto).toBe(true);
  });
  it("un terreno del tamaño que necesitan las familias encaja", () => {
    const t = ajuste(L("t", 100_000, 250), "terrenos", tres);
    expect(t.etiquetas).toEqual(["encaja"]);
  });
  it("el mismo anuncio puede encajar con una cooperativa grande y no con una pequeña", () => {
    const veinte: Cooperativa = { familias: 20, capital: 3_900_000, m2Vivienda: 90 };
    const l = L("x", 800_000, 1_600);
    expect(ajuste(l, "edificios", veinte).etiquetas).toEqual(["encaja"]);
    expect(ajuste(l, "edificios", tres).oculto).toBe(true);
  });
});

describe("orden y filtro ajustados a la cooperativa", () => {
  const items = [L("enorme", 90_000, 3_000), L("encaja", 250_000, 240), L("grande", 280_000, 560), L("caro", 500_000, 240), L("pequeno", 80_000, 90)];
  it("ordena primero lo que encaja y deja al final lo que no", () => {
    const r = filtrar(items, "edificios", { ...base, orden: "ajuste", coop: tres });
    expect(r[0].id).toBe("encaja");
    expect(r[r.length - 1].id).toBe("enorme");
  });
  it("con la casilla activada oculta solo los casos extremos y deja lo caro que aún cabe en el capital", () => {
    const r = filtrar(items, "edificios", { ...base, orden: "ajuste", coop: tres, soloEncaje: true });
    expect(r.map((x) => x.id)).toEqual(["encaja", "grande", "caro"]);
  });
  it("sin la casilla no se oculta nada", () => {
    expect(filtrar(items, "edificios", { ...base, orden: "ajuste", coop: tres, soloEncaje: false })).toHaveLength(5);
  });
  it("sin datos de cooperativa el orden ajustado no rompe y respeta el del portal", () => {
    expect(filtrar(items, "edificios", { ...base, orden: "ajuste" }).map((x) => x.id)).toEqual(items.map((x) => x.id));
  });
  it("a igual encaje, desempata por precio y tolera precios desconocidos", () => {
    const dos = [L("b", 260_000, 240), L("a", 250_000, 240), L("n", null, 240)];
    expect(filtrar(dos, "edificios", { ...base, orden: "ajuste", coop: tres }).map((x) => x.id)).toEqual(["a", "b", "n"]);
  });
  it("los demás órdenes y filtros siguen funcionando igual", () => {
    expect(filtrar(items, "edificios", { ...base, orden: "precio" }).map((x) => x.id)).toEqual(["pequeno", "enorme", "encaja", "grande", "caro"]);
  });
});

describe("filtrarTodo (edificios y terrenos a la vez)", () => {
  const ed = (id: string, m2: number, precio: number) => ({ id, titulo: "Edificio de pisos", url: "https://x.es/" + id, precio, m2, zona: "València", resumen: "", fotos: [] }) as never;
  const te = (id: string, m2: number, precio: number) => ({ id, titulo: "Solar", url: "https://x.es/" + id, precio, m2, zona: "Torrent", resumen: "", fotos: [] }) as never;
  const base = { maxPrecio: 0, minViv: 0, maxPv: 0, orden: "precio" as const };
  const grupos = [{ tipo: "edificios" as const, items: [ed("e1", 480, 600000), ed("e2", 160, 150000)] }, { tipo: "terrenos" as const, items: [te("t1", 1000, 300000)] }];

  it("mezcla los dos tipos y los ordena juntos por precio", () => {
    const r = filtrarTodo(grupos, base);
    expect(r.map((e) => e.l.id)).toEqual(["e2", "t1", "e1"]);
    expect(r.map((e) => e.tipo)).toEqual(["edificios", "terrenos", "edificios"]);
  });
  it("las viviendas mínimas solo se exigen a los edificios", () => {
    const r = filtrarTodo(grupos, { ...base, minViv: 5 });
    expect(r.map((e) => e.l.id).sort()).toEqual(["e1", "t1"]);
  });
  it("con un solo tipo se comporta como filtrar", () => {
    const r = filtrarTodo([grupos[1]], { ...base, minViv: 5 });
    expect(r).toHaveLength(0);
  });
  it("«más barato por vivienda» deja los terrenos al final", () => {
    const r = filtrarTodo(grupos, { ...base, orden: "pv" });
    expect(r[r.length - 1].tipo).toBe("terrenos");
  });
  it("ordenar por ajuste usa el tipo de cada anuncio", () => {
    const coop = { familias: 6, capital: 2_000_000, m2Vivienda: 90 };
    const enorme = [grupos[0], { tipo: "terrenos" as const, items: [te("t2", 20000, 300000)] }];
    const r = filtrarTodo(enorme, { ...base, orden: "ajuste", coop });
    expect(r.map((e) => e.l.id)).toEqual(["e1", "e2", "t2"]);
  });
});
