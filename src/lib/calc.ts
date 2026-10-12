export interface CalcInput {
  suelo: number; obra: number; gastos: number; subv: number; aport: number;
  interes: number; plazo: number; mant: number; reserva: number;
  alq: number; sube: number; ipc: number; hor: number;
  ingresos: number; iprem: number; pagas: number; mult: number;
}
export const CDEF: CalcInput = {
  suelo: 1000000, obra: 2200000, gastos: 12, subv: 0, aport: 15000,
  interes: 3.5, plazo: 30, mant: 60, reserva: 25, alq: 900, sube: 3, ipc: 2, hor: 40,
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

// Lo que paga una familia cada mes, año a año (índice 0 = año 1).
// Cooperativa: su parte del préstamo mientras dure, más mantenimiento y reserva.
// Alquiler: la renta de un piso parecido ya reformado (el propietario ya repercute en ella compra y obra).
export function series(c: CalcInput, m: Model) {
  const H = Math.max(1, Math.round(c.hor));
  const coop: number[] = [];
  const alq: number[] = [];
  for (let y = 1; y <= H; y++) {
    const run = ((+c.mant || 0) + (+c.reserva || 0)) * Math.pow(1 + c.ipc / 100, y - 1);
    coop.push((y <= c.plazo ? m.am : 0) + run);
    alq.push(c.alq * Math.pow(1 + c.sube / 100, y - 1));
  }
  let be: number | null = null;
  for (let y = 1; y <= H; y++) if (coop[y - 1] <= alq[y - 1]) { be = y; break; }
  return { H, coop, alq, be, paid: c.plazo < H ? Math.round(c.plazo) : null };
}

export function eligibility(c: CalcInput, m: Model) {
  const lim = c.mult * c.iprem * c.pagas;
  const mens = c.ingresos / 12;
  return { lim, ok: c.ingresos <= lim, mens, maxq: mens * 0.3, fits: m.tot <= mens * 0.3, pc: mens > 0 ? (m.tot / mens) * 100 : 0 };
}

/**
 * Capital orientativo de la cooperativa: lo que cada familia puede aportar al entrar más el préstamo que su cuota
 * podría sostener (hasta el 30 % de los ingresos, una vez descontados el mantenimiento y el fondo de reserva).
 * Es un tope de lo que podría costar el proyecto entero, no un precio de compra.
 */
export function capacidad(c: CalcInput, fam: number) {
  const v = Math.max(1, +fam || 1);
  const cuotaMax = Math.max(0, ((+c.ingresos || 0) / 12) * 0.3 - (+c.mant || 0) - (+c.reserva || 0));
  const n = Math.max(1, Math.round((+c.plazo || 0) * 12));
  const r = (+c.interes || 0) / 1200;
  const prestamoPorFamilia = cuotaMax === 0 ? 0 : r === 0 ? cuotaMax * n : (cuotaMax * (1 - Math.pow(1 + r, -n))) / r;
  const porFamilia = (+c.aport || 0) + prestamoPorFamilia;
  return { familias: v, cuotaMax, prestamoPorFamilia, porFamilia, total: v * porFamilia + (+c.subv || 0) };
}

export function niceTicks(max: number, n: number) {
  const raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  const s = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  const t: number[] = [];
  for (let k = 0; ; k++) { t.push(k * s); if (k * s >= max) break; }
  return t;
}

/**
 * Qué haría falta para que la cuota quepa en el 30 % de los ingresos de la familia, cambiando UNA sola cosa y dejando el resto igual:
 * la aportación inicial por vivienda, la obra o los ingresos. Lo que no se puede lograr con esa palanca sale como null
 * (por ejemplo, si el mantenimiento y el fondo de reserva ya se comen el 30 %, ninguna aportación ni obra lo arregla).
 */
export function queHariaFalta(c: CalcInput, m: Model) {
  const maxq = ((+c.ingresos || 0) / 12) * 0.3;
  const cuotaPrestamo = maxq - (+c.mant || 0) - (+c.reserva || 0); // lo que cada vivienda puede dedicar al préstamo cada mes
  const n = Math.max(1, Math.round(c.plazo * 12)), r = c.interes / 1200;
  const factor = r === 0 ? n : (1 - Math.pow(1 + r, -n)) / r;
  const gastos = 1 + (+c.gastos || 0) / 100;
  const ingresosNecesarios = m.ing30 * 12;
  if (cuotaPrestamo <= 0) return { cabe: m.tot <= maxq, sinMargen: true, aportacion: null, obraMaxima: null, ingresosNecesarios };
  const financiable = cuotaPrestamo * factor * m.v;
  const aportacion = Math.max(0, (m.total - (+c.subv || 0) - financiable) / m.v);
  const obraMaxima = (financiable + (+c.aport || 0) * m.v + (+c.subv || 0)) / gastos - (+c.suelo || 0);
  return { cabe: m.tot <= maxq, sinMargen: false, aportacion, obraMaxima: obraMaxima > 0 ? obraMaxima : null, ingresosNecesarios };
}
