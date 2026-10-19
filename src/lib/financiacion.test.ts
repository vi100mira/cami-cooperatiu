import { describe, it, expect } from "vitest";
import { CDEF } from "./calc";
import { financiacionSinAhorro, cuotaPrestamo } from "./financiacion";

// Ejemplo del enunciado: 100.000 € por vivienda, el banco presta el 80 % y las familias no tienen ahorro.
const c = { ...CDEF, suelo: 400_000, obra: 600_000, gastos: 0, subv: 0, aport: 25_000, ahorro: 0, ltv: 80 };

describe("financiación sin ahorro", () => {
  it("el hueco es lo que no presta el banco, aunque la calculadora tenga una aportación puesta", () => {
    const f = financiacionSinAhorro(c, 10);
    expect(f.total).toBe(1_000_000);
    expect(f.banco).toBe(800_000);
    expect(f.familias).toBe(0);
    expect(f.hueco).toBe(200_000);
  });

  it("el ahorro que sí tienen las familias y las ayudas reducen el hueco", () => {
    expect(financiacionSinAhorro({ ...c, ahorro: 5_000 }, 10).hueco).toBe(150_000);
    const conAyuda = financiacionSinAhorro({ ...c, subv: 300_000 }, 10);
    expect(conAyuda.banco).toBe(700_000);
    expect(conAyuda.hueco).toBe(0);
  });

  it("préstamo puente: suma su cuota a la del banco y deja de pesar al devolverse", () => {
    const f = financiacionSinAhorro(c, 10);
    const p = f.propuestas.find((x) => x.id === "puente")!;
    const banco = cuotaPrestamo(800_000, c.interes, c.plazo), puente = cuotaPrestamo(200_000, c.i2, c.p2);
    expect(p.cuotaInicial).toBeCloseTo((banco + puente) / 10 + c.mant + c.reserva, 6);
    expect(p.desdeAnio).toBe(c.p2 + 1);
    expect(p.cuotaDespues).toBeCloseTo(banco / 10 + c.mant + c.reserva, 6);
  });

  it("la mixta reparte el hueco a medias", () => {
    const p = financiacionSinAhorro(c, 10).propuestas.find((x) => x.id === "mixta")!;
    expect(p.tramos.map((t) => t.importe)).toEqual([800_000, 100_000, 100_000]);
  });

  it("derecho de superficie: no se paga el suelo y se añade el canon", () => {
    const f = financiacionSinAhorro({ ...c, canon: 30 }, 10);
    const p = f.propuestas.find((x) => x.id === "superficie")!;
    expect(p.total).toBe(600_000);
    expect(p.hueco).toBe(120_000);
    expect(p.cuotaInicial).toBeLessThan(f.propuestas.find((x) => x.id === "colaboradoras")!.cuotaInicial + 30);
    expect(financiacionSinAhorro({ ...c, suelo: 0 }, 10).propuestas.some((x) => x.id === "superficie")).toBe(false);
  });

  it("ayudas: dice cuánta subvención haría falta", () => {
    const p = financiacionSinAhorro(c, 10).propuestas.find((x) => x.id === "ayudas")!;
    expect(p.ayudaNecesaria).toBe(200_000);
    expect(p.tramos).toHaveLength(1);
  });

  it("recomienda la cuota más baja que cabe y ninguna si no cabe ninguna", () => {
    const f = financiacionSinAhorro(c, 10);
    const cabenSinAyuda = f.propuestas.filter((p) => p.cabe && p.id !== "ayudas");
    expect(f.recomendada).toBe(cabenSinAyuda.sort((a, b) => a.cuotaInicial - b.cuotaInicial)[0]?.id ?? null);
    expect(financiacionSinAhorro({ ...c, ingresos: 5_000 }, 10).recomendada).toBeNull();
  });

  it("si el banco no presta nada, todo es hueco", () => {
    expect(financiacionSinAhorro({ ...c, ltv: 0 }, 10).hueco).toBe(1_000_000);
  });
});
