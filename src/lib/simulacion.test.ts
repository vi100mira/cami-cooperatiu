import { describe, it, expect } from "vitest";
import { initial } from "./store";
import { simularEdificio, simularTerrenoAnuncio, simularTerrenoCalculado, ajustarObraPorM2, quitarSimulacion, viviendasDeCalculo, OBRA_POR_VIVIENDA, OBRA_POR_M2 } from "./simulacion";

const base = () => ({ ...initial(), group: { ...initial().group, fam: 12 } });

describe("simular un edificio", () => {
  const s = simularEdificio(base(), { titulo: "Edificio", precio: 500000, m2: 480 });
  it("carga el precio y las viviendas estimadas sin tocar las familias de la cooperativa", () => {
    expect(s.calc.suelo).toBe(500000);
    expect(s.sim?.viv).toBe(6);
    expect(s.group.fam).toBe(12);
    expect(viviendasDeCalculo(s)).toBe(6);
  });
  it("ajusta la obra al tamaño del edificio, no al ejemplo de 20 viviendas", () => {
    expect(s.calc.obra).toBe(6 * OBRA_POR_VIVIENDA);
  });
  it("sin m² usa las viviendas de la cooperativa", () => {
    const t = simularEdificio(base(), { titulo: "Edificio", precio: 500000 });
    expect(t.sim?.viv).toBeUndefined();
    expect(viviendasDeCalculo(t)).toBe(12);
    expect(t.calc.obra).toBe(12 * OBRA_POR_VIVIENDA);
  });
  it("quitar devuelve los valores de antes", () => {
    const antes = base();
    const q = quitarSimulacion(s);
    expect(q.calc.suelo).toBe(antes.calc.suelo);
    expect(q.calc.obra).toBe(antes.calc.obra);
    expect(q.sim).toBeNull();
    expect(viviendasDeCalculo(q)).toBe(12);
  });
  it("quitar respeta lo que la persona editó después", () => {
    const editado = { ...s, calc: { ...s.calc, obra: 999 } };
    const q = quitarSimulacion(editado);
    expect(q.calc.obra).toBe(999);
    expect(q.calc.suelo).toBe(base().calc.suelo);
  });
  it("simular dos veces seguidas conserva los valores originales", () => {
    const dos = simularEdificio(s, { titulo: "Otro", precio: 700000, m2: 800 });
    const q = quitarSimulacion(dos);
    expect(q.calc.suelo).toBe(base().calc.suelo);
    expect(q.calc.obra).toBe(base().calc.obra);
  });
});

describe("simular un terreno de un anuncio", () => {
  const anuncio = { titulo: "Solar", precio: 450000, m2: 3200.4 };
  it("carga precio y superficie y calcula las viviendas posibles, el suelo urbanizado y la obra, sin tocar las familias", () => {
    const antes = base();
    const s = simularTerrenoAnuncio(antes, anuncio);
    expect(s.terreno.precio).toBe(450000);
    expect(s.terreno.superficie).toBe(3200);
    expect(s.group.fam).toBe(12);
    expect(s.sim?.tipo).toBe("terrenos");
    expect(s.sim?.sinSuperficie).toBe(false);
    expect(s.sim?.viv).toBeGreaterThan(1);
    expect(s.sim?.m2).toBeGreaterThan(0);
    expect(s.calc.suelo).toBeGreaterThan(450000);
    expect(s.calc.suelo).not.toBe(antes.calc.suelo);
    expect(s.calc.obra).toBe(Math.round((s.sim?.m2 ?? 0) * OBRA_POR_M2));
  });
  it("dos terrenos distintos dan cuotas distintas", () => {
    const a = simularTerrenoAnuncio(base(), { titulo: "A", precio: 200000, m2: 2000 });
    const b = simularTerrenoAnuncio(base(), { titulo: "B", precio: 900000, m2: 2000 });
    expect(a.calc.suelo).not.toBe(b.calc.suelo);
    expect(a.sim?.viv).toBe(b.sim?.viv);
  });
  it("sin superficie conserva la anterior y lo avisa", () => {
    const s = simularTerrenoAnuncio(base(), { titulo: "Solar", precio: 450000 });
    expect(s.terreno.superficie).toBe(base().terreno.superficie);
    expect(s.sim?.sinSuperficie).toBe(true);
  });
  it("si el suelo no permite viviendas, solo carga precio y superficie", () => {
    const b = base();
    const s = simularTerrenoAnuncio({ ...b, terreno: { ...b.terreno, clase: "no-urbanizable" } }, anuncio);
    expect(s.sim?.sinViviendas).toBe(true);
    expect(s.sim?.viv).toBeUndefined();
    expect(s.calc).toEqual(b.calc);
    expect(s.terreno.precio).toBe(450000);
  });
  it("quitar devuelve precio, superficie, suelo y obra", () => {
    const q = quitarSimulacion(simularTerrenoAnuncio(base(), anuncio));
    expect(q.terreno.precio).toBe(base().terreno.precio);
    expect(q.terreno.superficie).toBe(base().terreno.superficie);
    expect(q.calc.suelo).toBe(base().calc.suelo);
    expect(q.calc.obra).toBe(base().calc.obra);
  });
});

describe("usar el terreno calculado", () => {
  it("carga el coste, las viviendas posibles y la obra sin cambiar las familias de la cooperativa", () => {
    const s = simularTerrenoCalculado(base(), { coste: 1234567.8, viviendas: 90, techo: 8100 });
    expect(s.calc.suelo).toBe(1234568);
    expect(s.calc.obra).toBe(Math.round(8100 * OBRA_POR_M2));
    expect(viviendasDeCalculo(s)).toBe(90);
    expect(s.group.fam).toBe(12);
    const q = quitarSimulacion(s);
    expect(q.calc.suelo).toBe(base().calc.suelo);
    expect(q.calc.obra).toBe(base().calc.obra);
  });
  it("acota las viviendas entre 1 y 200", () => {
    expect(simularTerrenoCalculado(base(), { coste: 1, viviendas: 900, techo: 1 }).sim?.viv).toBe(200);
    expect(simularTerrenoCalculado(base(), { coste: 1, viviendas: 0.2, techo: 1 }).sim?.viv).toBe(1);
  });
});

describe("la obra supuesta se puede ajustar por m²", () => {
  it("recalcula la obra con los m² de referencia y quitar la restaura", () => {
    const s = simularEdificio(base(), { titulo: "Edificio", precio: 500000, m2: 480 });
    expect(s.sim?.m2).toBe(480);
    const t = ajustarObraPorM2(s, 400);
    expect(t.calc.obra).toBe(192000);
    expect(quitarSimulacion(t).calc.obra).toBe(base().calc.obra);
  });
  it("sin m² de referencia no cambia nada", () => {
    const s = simularEdificio(base(), { titulo: "Edificio", precio: 500000, viv: 6 });
    expect(s.sim?.m2).toBeUndefined();
    expect(ajustarObraPorM2(s, 400)).toBe(s);
  });
  it("un edificio grande no pasa de 200 viviendas", () => {
    expect(simularEdificio(base(), { titulo: "Enorme", precio: 1, m2: 64000 }).sim?.viv).toBe(200);
  });
});
