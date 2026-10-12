import { describe, it, expect } from "vitest";
import { calcTerreno, valoresDe, parametrosRelevantes, TDEF, type TerrenoInput } from "./terreno";
import { normativaPara } from "./normativa";

const cv = normativaPara("cv");
const run = (t: Partial<TerrenoInput>, interes = 0) => { const i = { ...TDEF, ...t }; return calcTerreno(i, valoresDe(cv, i), interes); };

describe("suelo urbanizable en la Comunitat Valenciana (ejemplo de 1 ha)", () => {
  const r = run({});
  it("reparte el suelo bruto entre dotaciones, viales y parcelas edificables", () => {
    expect(r.sueloBruto).toBe(10000);
    expect(r.techoTotal).toBe(10000);
    expect(r.verdes).toBe(1500);
    expect(r.otrasDotaciones).toBe(2000);
    expect(r.viales).toBe(2000);
    expect(r.sueloEdificable).toBe(4500);
    expect(r.pctEdificable).toBeCloseTo(0.45, 6);
    expect(r.verdes + r.otrasDotaciones + r.viales + r.sueloEdificable).toBe(r.sueloBruto);
  });
  it("cede el 10 % del aprovechamiento y reserva el 30 % para vivienda protegida", () => {
    expect(r.cesionTecho).toBe(1000);
    expect(r.techoCooperativa).toBe(9000);
    expect(r.reservaVPPTecho).toBe(3000);
  });
  it("la densidad máxima recorta las viviendas: 111 en el sector frente a un tope de 100", () => {
    expect(r.viviendasSector).toBeCloseTo(111.11, 1);
    expect(r.avisos).toContain("densidad");
    expect(r.viviendas).toBe(90);
  });
  it("suma el coste de urbanizar viales y zonas verdes con las referencias", () => {
    expect(r.costes.viales).toBe(2000 * 125);
    expect(r.costes.verdes).toBe(1500 * 55);
    expect(r.costes.urbanizacion).toBe(332500);
    expect(r.costes.total).toBe(600000 + 332500);
    expect(r.porM2Techo).toBeCloseTo(932500 / 9000, 6);
    expect(r.porVivienda).toBeCloseTo(932500 / 90, 6);
  });
  it("recorta una edificabilidad superior al tope y lo avisa", () => {
    const x = run({ edif: 2.5 });
    expect(x.edifAplicada).toBe(1);
    expect(x.avisos).toContain("edif-recortada");
  });
  it("el interés del suelo durante la espera se suma al coste", () => {
    const x = run({ anios: 2, precio: 100000 }, 5);
    expect(x.costes.espera).toBeCloseTo(100000 * (1.05 ** 2 - 1), 4);
    expect(x.costes.total).toBeCloseTo(100000 + x.costes.urbanizacion + x.costes.espera, 4);
  });
  it("las estimaciones editadas sustituyen a la referencia", () => {
    const x = run({ costeViales: 100, vialesPor100: 10 });
    expect(x.viales).toBe(1000);
    expect(x.costes.viales).toBe(100000);
  });
});

describe("otras clases de suelo", () => {
  it("el suelo no urbanizable no da viviendas y lo avisa", () => {
    const x = run({ clase: "no-urbanizable" });
    expect(x.edificable).toBe(false);
    expect(x.viviendas).toBe(0);
    expect(x.avisos).toEqual(["no-urbanizable"]);
    expect(x.costes.total).toBe(600000);
  });
  it("el solar no cede suelo, no urbaniza y no tiene tope de edificabilidad", () => {
    const x = run({ clase: "urbano-solar", superficie: 1000, edif: 2.4, m2Vivienda: 80 });
    expect(x.techoTotal).toBe(2400);
    expect(x.cesionTecho).toBe(0);
    expect(x.costes.urbanizacion).toBe(0);
    expect(x.sueloEdificable).toBe(1000);
    expect(x.viviendas).toBe(30);
  });
  it("el suelo urbano por urbanizar cede el 5 % en la Comunitat Valenciana", () => {
    const x = run({ clase: "urbano-por-urbanizar", superficie: 5000, edif: 1.5 });
    expect(x.cesionPct).toBe(5);
    expect(x.cesionTecho).toBeCloseTo(7500 * 0.05, 6);
    expect(x.avisos).toContain("por-urbanizar");
  });
  it("las reglas que se enseñan dependen de la clase", () => {
    expect(parametrosRelevantes("urbano-solar")).toEqual([]);
    expect(parametrosRelevantes("no-urbanizable")).toEqual([]);
    expect(parametrosRelevantes("urbanizable")).toContain("densMax");
    expect(parametrosRelevantes("urbano-por-urbanizar")).not.toContain("densMax");
  });
});

describe("entradas raras", () => {
  it("superficie cero o datos vacíos no producen NaN", () => {
    const x = run({ superficie: 0 });
    for (const v of [x.techoTotal, x.sueloEdificable, x.viviendas, x.costes.total, x.pctEdificable]) expect(Number.isFinite(v)).toBe(true);
    expect(x.porM2Techo).toBeNull();
    expect(x.avisos).toContain("sin-viviendas");
  });
  it("valores negativos o no numéricos se tratan como cero", () => {
    const x = run({ superficie: -5, precio: NaN as unknown as number, otros: -10 });
    expect(x.sueloBruto).toBe(0);
    expect(x.costes.suelo).toBe(0);
    expect(x.costes.otros).toBe(0);
  });
  it("en una comunidad sin cargar el cálculo sigue funcionando con la referencia", () => {
    const n = normativaPara("an");
    const x = calcTerreno(TDEF, valoresDe(n, TDEF), 0);
    expect(x.techoTotal).toBeGreaterThan(0);
  });
});
