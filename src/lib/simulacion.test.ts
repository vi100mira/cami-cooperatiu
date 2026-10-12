import { describe, it, expect } from "vitest";
import { initial } from "./store";
import { simularEdificio, simularTerrenoAnuncio, simularTerrenoCalculado, quitarSimulacion, viviendasDeCalculo, OBRA_POR_VIVIENDA } from "./simulacion";

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
  it("carga precio y superficie en la calculadora del terreno y no toca la cuota", () => {
    const antes = base();
    const s = simularTerrenoAnuncio(antes, { titulo: "Solar", precio: 450000, m2: 3200.4 });
    expect(s.terreno.precio).toBe(450000);
    expect(s.terreno.superficie).toBe(3200);
    expect(s.calc).toEqual(antes.calc);
    expect(s.group.fam).toBe(12);
    expect(s.sim?.tipo).toBe("terrenos");
    expect(s.sim?.sinSuperficie).toBe(false);
  });
  it("sin superficie conserva la anterior y lo avisa", () => {
    const s = simularTerrenoAnuncio(base(), { titulo: "Solar", precio: 450000 });
    expect(s.terreno.superficie).toBe(base().terreno.superficie);
    expect(s.sim?.sinSuperficie).toBe(true);
  });
  it("quitar devuelve precio y superficie", () => {
    const q = quitarSimulacion(simularTerrenoAnuncio(base(), { titulo: "Solar", precio: 450000, m2: 3200 }));
    expect(q.terreno.precio).toBe(base().terreno.precio);
    expect(q.terreno.superficie).toBe(base().terreno.superficie);
  });
});

describe("usar el terreno calculado", () => {
  it("carga el coste y las viviendas posibles sin cambiar las familias de la cooperativa", () => {
    const s = simularTerrenoCalculado(base(), { coste: 1234567.8, viviendas: 90 });
    expect(s.calc.suelo).toBe(1234568);
    expect(viviendasDeCalculo(s)).toBe(90);
    expect(s.group.fam).toBe(12);
    expect(quitarSimulacion(s).calc.suelo).toBe(base().calc.suelo);
  });
  it("acota las viviendas entre 1 y 200", () => {
    expect(simularTerrenoCalculado(base(), { coste: 1, viviendas: 900 }).sim?.viv).toBe(200);
    expect(simularTerrenoCalculado(base(), { coste: 1, viviendas: 0.2 }).sim?.viv).toBe(1);
  });
});
