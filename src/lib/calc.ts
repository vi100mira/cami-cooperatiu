export interface CalcInput {
  suelo: number; obra: number; gastos: number; subv: number; aport: number;
  interes: number; plazo: number; mant: number; reserva: number;
  alq: number; sube: number; ipc: number; hor: number;
  ingresos: number; iprem: number; pagas: number; mult: number;
}
export const CDEF: CalcInput = {
  suelo: 1000000, obra: 2200000, gastos: 12, subv: 0, aport: 15000,
  interes: 3.5, plazo: 30, mant: 60, reserva: 25, alq: 900, sube: 3, ipc: 2, hor: 25,
  ingresos: 36000, iprem: 600, pagas: 14, mult: 4.5,
};

export function model(c: CalcInput, fam: number) {
  const v = Math.max(1, +fam || 1);
  const total = ((+c.suelo || 0) + (+c.obra || 0)) * (1 + (+c.gastos || 0) / 100);
  const aportT = v * (+c.aport || 0);
  const need = total - (+c.subv || 0) - aportT;
  const fin = Math.max(0, need);
  const n = Math.max(1, Math.round(c.plazo * 12));
  const r = c.interes / 1200;
  const pm = fin <= 0 ? 0 : r === 0 ? fin / n : (fin * r) / (1 - Math.pow(1 + r, -n));
  const am = pm / v;
  const tot = am + (+c.mant || 0) + (+c.reserva || 0);
  return { v, total, aportT, need, fin, pm, am, tot, ing30: tot / 0.3, pct: total > 0 ? fin / total : 0, surplus: need < 0 ? -need : 0 };
}
export type Model = ReturnType<typeof model>;

export function series(c: CalcInput, m: Model) {
  const H = Math.round(c.hor);
  const coop = [+c.aport || 0];
  const alq = [0];
  for (let y = 1; y <= H; y++) {
    const am = y <= c.plazo ? m.am * 12 : 0;
    const run = ((+c.mant || 0) + (+c.reserva || 0)) * 12 * Math.pow(1 + c.ipc / 100, y - 1);
    coop.push(coop[y - 1] + am + run);
    alq.push(alq[y - 1] + c.alq * 12 * Math.pow(1 + c.sube / 100, y - 1));
  }
  let be: number | null = null;
  for (let y = 1; y <= H; y++) if (coop[y] <= alq[y]) { be = y; break; }
  return { H, coop, alq, be };
}

export function eligibility(c: CalcInput, m: Model) {
  const lim = c.mult * c.iprem * c.pagas;
  const mens = c.ingresos / 12;
  return { lim, ok: c.ingresos <= lim, mens, maxq: mens * 0.3, fits: m.tot <= mens * 0.3, pc: mens > 0 ? (m.tot / mens) * 100 : 0 };
}

export function niceTicks(max: number, n: number) {
  const raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  const s = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  const t: number[] = [];
  for (let k = 0; ; k++) { t.push(k * s); if (k * s >= max) break; }
  return t;
}
