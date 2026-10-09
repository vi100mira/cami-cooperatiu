import { describe, it, expect } from "vitest";
import { CDEF, model, series, eligibility } from "./calc";
describe("calc", () => {
  it("total y préstamo con valores por defecto", () => {
    const m = model(CDEF, 20);
    expect(m.total).toBeCloseTo(3200000 * 1.12, 2);
    expect(m.fin).toBeCloseTo(3584000 - 300000, 2);
  });
  it("cuota de préstamo coincide con fórmula francesa", () => {
    const m = model(CDEF, 20);
    const r = 0.035 / 12, n = 360;
    expect(m.pm).toBeCloseTo((m.fin * r) / (1 - Math.pow(1 + r, -n)), 4);
    expect(m.tot).toBeCloseTo(m.pm / 20 + 85, 4);
  });
  it("interés 0 y sin préstamo", () => {
    expect(model({ ...CDEF, interes: 0 }, 20).pm).toBeCloseTo(model(CDEF, 20).fin / 360, 6);
    expect(model({ ...CDEF, aport: 1e9 }, 20).pm).toBe(0);
  });
  it("serie y elegibilidad", () => {
    const m = model(CDEF, 20), s = series(CDEF, m);
    expect(s.coop.length).toBe(26);
    expect(s.alq[1]).toBe(900 * 12);
    expect(eligibility(CDEF, m).lim).toBe(4.5 * 600 * 14);
  });
});
