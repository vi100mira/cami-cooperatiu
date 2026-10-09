"use client";
import { useState } from "react";
import { TERMS } from "@/lib/content";
import { useStore } from "@/lib/store";
import { model, series, eligibility, niceTicks, type CalcInput, type Model } from "@/lib/calc";
import { eur, nf0, fnum, kfmt } from "@/lib/format";
import { useHelp } from "./Rich";

interface Spec { k: string; l: string; u?: string; min?: number; max?: number; step: number; t?: string; r?: boolean; fmt?: (v: number) => string; }
const SPA: Spec[] = [
  { k: "fam", l: "Viviendas (familias socias)", min: 1, max: 200, step: 1 },
  { k: "suelo", l: "Suelo o edificio", u: "€", step: 10000 },
  { k: "obra", l: "Obra o rehabilitación", u: "€", step: 10000 },
  { k: "gastos", l: "Honorarios, licencias e impuestos", u: "% del total", step: 1 },
  { k: "subv", l: "Subvenciones y ayudas", u: "€", step: 10000 },
  { k: "aport", l: "Aportación inicial por vivienda", u: "€", step: 500, t: "aportacion" },
  { k: "interes", l: "Interés del préstamo", r: true, min: 0, max: 8, step: 0.1, fmt: (v) => fnum(v, 1) + " %", t: "banca" },
  { k: "plazo", l: "Plazo del préstamo", r: true, min: 10, max: 40, step: 1, fmt: (v) => v + " años", t: "amortizacion" },
  { k: "mant", l: "Mantenimiento, seguros e impuestos", u: "€/vivienda/mes", step: 5, t: "cuota" },
  { k: "reserva", l: "Fondo de reserva", u: "€/vivienda/mes", step: 5, t: "fondo" },
];
const SPB: Spec[] = [
  { k: "ingresos", l: "Ingresos anuales brutos de la familia", u: "€/año", step: 1000 },
  { k: "iprem", l: "IPREM de referencia (mensual)", u: "€/mes", step: 1, t: "iprem" },
  { k: "pagas", l: "Pagas del IPREM al año", u: "pagas", step: 1 },
  { k: "mult", l: "Veces el IPREM permitidas", u: "veces", step: 0.1, t: "vpo" },
];
const SPC: Spec[] = [
  { k: "alq", l: "Alquiler de mercado equivalente", u: "€/mes", step: 10 },
  { k: "sube", l: "Subida anual del alquiler", u: "% al año", step: 0.5 },
  { k: "ipc", l: "Subida anual de mantenimiento y reserva", u: "% al año", step: 0.5 },
  { k: "hor", l: "Horizonte", r: true, min: 5, max: 40, step: 1, fmt: (v) => v + " años" },
];

function Field({ sp }: { sp: Spec }) {
  const { s, set } = useStore();
  const help = useHelp();
  const val = sp.k === "fam" ? s.group.fam : (s.calc as unknown as Record<string, number>)[sp.k];
  const [txt, setTxt] = useState<string | null>(null);
  const change = (raw: string) => {
    if (!sp.r) setTxt(raw);
    if (raw === "") return;
    let v = parseFloat(raw); if (isNaN(v) || v < 0) v = 0;
    if (sp.k === "fam") set((x) => ({ ...x, group: { ...x.group, fam: Math.max(1, Math.min(200, Math.round(v) || 1)) } }));
    else set((x) => ({ ...x, calc: { ...x.calc, [sp.k]: v } }));
  };
  const q = sp.t ? <button type="button" className="q" aria-label={"Ayuda: " + TERMS[sp.t].t} onClick={(e) => help(sp.t!, e.currentTarget)}>?</button> : null;
  const id = "ci-" + sp.k;
  if (sp.r) return (
    <div className="fld rng"><div className="row"><span className="lb"><label htmlFor={id}>{sp.l}</label>{q}</span><output>{sp.fmt!(val)}</output></div>
      <input type="range" id={id} min={sp.min} max={sp.max} step={sp.step} value={val} onChange={(e) => change(e.target.value)} /></div>
  );
  return (
    <div className="fld"><span className="lb"><label htmlFor={id}>{sp.l}</label>{q}</span>
      <div className="num"><input type="number" id={id} inputMode="decimal" min={sp.min ?? 0} max={sp.max} step={sp.step} value={txt ?? val} onChange={(e) => change(e.target.value)} onBlur={() => setTxt(null)} />{sp.u && <span className="u">{sp.u}</span>}</div></div>
  );
}

function ResA({ m, c }: { m: Model; c: CalcInput }) {
  const parts: [string, number, string][] = [["Préstamo", m.am, "var(--s1)"], ["Mantenimiento y seguros", +c.mant || 0, "var(--s2)"], ["Fondo de reserva", +c.reserva || 0, "var(--s3)"]];
  const partAp = Math.min(m.aportT, Math.max(0, m.total - (+c.subv || 0))), partSub = Math.min(+c.subv || 0, m.total);
  const src = ([["Aportaciones de las familias", partAp, "var(--s1)"], ["Ayudas", partSub, "var(--s2)"], ["Préstamo", m.fin, "var(--s3)"]] as [string, number, string][]).filter((x) => x[1] > 0);
  const sum = src.reduce((a, x) => a + x[1], 0) || 1;
  const R = 38, C = 2 * Math.PI * R;
  let acc = 0;
  const diff = c.alq - m.tot;
  return (
    <>
      <div className="hero-n"><span className="eyebrow">Cuota por vivienda</span><span className="big">{nf0.format(m.tot)}<small>€ al mes</small></span></div>
      <div className="bar" role="img" aria-label="Reparto de la cuota mensual">{parts.filter((p) => p[1] > 0).map((p) => <i key={p[0]} style={{ flex: `${p[1].toFixed(2)} 1 0`, background: p[2] }} title={`${p[0]}: ${eur(p[1])} al mes`} />)}</div>
      <div className="lg">{parts.map((p) => <div key={p[0]}><span className="sw" style={{ background: p[2] }} /><span>{p[0]}</span><span className="v">{eur(p[1])}</span></div>)}</div>
      {m.need < 0 && <p className="warn">Con estas aportaciones y ayudas no hace falta préstamo y sobrarían {eur(m.surplus)}.</p>}
      {m.need >= 0 && m.pct > 0.85 && <p className="warn">El préstamo cubre una parte muy grande del coste. Conviene hablar pronto con la entidad financiera sobre el importe máximo que concedería.</p>}
      <div><div className="sub">De dónde sale el dinero</div>
        <div className="donut">
          <svg viewBox="0 0 104 104" role="img" aria-label="De dónde sale el dinero">
            {src.map((x) => { const len = (C * x[1]) / sum, gap = src.length > 1 ? Math.min(2, len * 0.5) : 0; const el = <circle key={x[0]} cx="52" cy="52" r={R} fill="none" stroke={x[2]} strokeWidth="16" strokeDasharray={`${(len - gap).toFixed(2)} ${(C - len + gap).toFixed(2)}`} strokeDashoffset={(-acc).toFixed(2)} transform="rotate(-90 52 52)"><title>{`${x[0]}: ${eur(x[1])} (${Math.round((x[1] / sum) * 100)}%)`}</title></circle>; acc += len; return el; })}
            <text className="ctr" x="52" y="51" textAnchor="middle">{kfmt(sum)}</text><text className="cs" x="52" y="62" textAnchor="middle">coste total</text>
          </svg>
          <div className="lg">{src.map((x) => <div key={x[0]}><span className="sw" style={{ background: x[2] }} /><span>{x[0]}</span><span className="v">{Math.round((x[1] / sum) * 100)}%</span></div>)}</div>
        </div></div>
      <div className="facts">
        <div><span>Coste total del proyecto</span><b>{eur(m.total)}</b></div>
        <div><span>Préstamo necesario</span><b>{eur(m.fin)} ({Math.round(m.pct * 100)}%)</b></div>
        <div><span>Cuota del préstamo, toda la cooperativa</span><b>{eur(m.pm)}/mes</b></div>
        <div><span>Ingresos mínimos para que la cuota sea el 30%</span><b>{eur(m.ing30)}/mes</b></div>
        <div><span>Frente al alquiler de mercado</span><b>{diff >= 0 ? "ahorras " + eur(diff) : "pagas " + eur(-diff) + " más"}/mes</b></div>
      </div>
    </>
  );
}

function ResB({ m, c }: { m: Model; c: CalcInput }) {
  const e = eligibility(c, m), fill = Math.min(100, (e.pc / 60) * 100);
  return (
    <>
      <div className="hero-n"><span className="eyebrow">Límite de ingresos de referencia</span><span className="big" style={{ fontSize: "clamp(30px,7vw,40px)" }}>{nf0.format(e.lim)}<small>€ al año</small></span></div>
      <span className={"pill " + (e.ok ? "ok" : "no")}>{e.ok ? "✓ Cumple el límite" : "✕ Supera el límite"}</span>
      <div className="facts">
        <div><span>Ingresos de la familia</span><b>{eur(c.ingresos)}/año</b></div>
        <div><span>{e.ok ? "Margen" : "Exceso"}</span><b>{eur(Math.abs(e.lim - c.ingresos))}</b></div>
        <div><span>Cuota máxima al 30% de los ingresos</span><b>{eur(e.maxq)}/mes</b></div>
        <div><span>Cuota de esta cooperativa</span><b>{eur(m.tot)}/mes</b></div>
      </div>
      <div>
        <div style={{ position: "relative", height: 10, background: "var(--line)", borderRadius: 5 }} role="img" aria-label={`La cuota es el ${Math.round(e.pc)}% de los ingresos`}>
          <i style={{ display: "block", height: "100%", width: fill.toFixed(1) + "%", borderRadius: 5, background: e.fits ? "var(--good)" : "var(--bad)" }} />
          <i style={{ position: "absolute", left: "50%", top: -4, width: 2, height: 18, background: "var(--ink)" }} />
        </div>
        <p className="note" style={{ marginTop: 6 }}>La cuota es el {Math.round(e.pc)}% de los ingresos. La marca señala el tope del 30%.</p>
      </div>
      <span className={"pill " + (e.fits ? "ok" : "no")}>{e.fits ? "✓ La cuota cabe" : "✕ La cuota supera el 30%"}</span>
      <p className="note">En el concurso de la EVha que sirvió de ejemplo, la mitad de las personas socias debían pertenecer a colectivos preferentes. Las bases de cada concurso mandan.</p>
    </>
  );
}

function LineChart({ ser }: { ser: ReturnType<typeof series> }) {
  const [hov, setHov] = useState<{ i: number; x: number; y: number } | null>(null);
  const W = 480, HT = 290, ml = 54, mr = 14, mt = 14, mb = 36, H = ser.H;
  const maxV = Math.max(ser.coop[H], ser.alq[H], 1), tk = niceTicks(maxV, 4), top = tk[tk.length - 1];
  const x = (i: number) => ml + ((W - ml - mr) * i) / H, y = (v: number) => mt + (HT - mt - mb) * (1 - v / top);
  const step = H <= 10 ? 1 : H <= 20 ? 2 : 5;
  const xs: number[] = []; for (let i = 0; i <= H; i += step) xs.push(i);
  const path = (a: number[]) => a.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + "," + y(v).toFixed(1)).join("");
  const d = hov ? ser.alq[hov.i] - ser.coop[hov.i] : 0;
  return (
    <div style={{ position: "relative" }}>
      <svg className="chart" viewBox={`0 0 ${W} ${HT}`} role="img" aria-label="Gasto acumulado por vivienda: cooperativa frente a alquiler"
        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W; const i = Math.max(0, Math.min(H, Math.round(((px - ml) / (W - ml - mr)) * H))); setHov({ i, x: e.clientX - r.left, y: e.clientY - r.top }); }}
        onPointerLeave={() => setHov(null)}>
        {tk.map((v) => <g key={v}><line className="gr" x1={ml} x2={W - mr} y1={y(v)} y2={y(v)} /><text x={ml - 8} y={y(v) + 4} textAnchor="end">{kfmt(v)}</text></g>)}
        {xs.map((i) => <text key={i} x={x(i)} y={HT - mb + 17} textAnchor="middle">{i}</text>)}
        <text x={ml + (W - ml - mr) / 2} y={HT - 4} textAnchor="middle">años</text>
        <line className="ax" x1={ml} x2={W - mr} y1={y(0)} y2={y(0)} />
        <path d={path(ser.alq)} fill="none" stroke="var(--s2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path(ser.coop)} fill="none" stroke="var(--s1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(H)} cy={y(ser.alq[H])} r="4" fill="var(--s2)" stroke="var(--surface-2)" strokeWidth="2" />
        <circle cx={x(H)} cy={y(ser.coop[H])} r="4" fill="var(--s1)" stroke="var(--surface-2)" strokeWidth="2" />
        {hov && <g><line className="ax" x1={x(hov.i)} x2={x(hov.i)} y1={mt} y2={y(0)} /><circle cx={x(hov.i)} cy={y(ser.coop[hov.i])} r="4" fill="var(--s1)" stroke="var(--surface-2)" strokeWidth="2" /><circle cx={x(hov.i)} cy={y(ser.alq[hov.i])} r="4" fill="var(--s2)" stroke="var(--surface-2)" strokeWidth="2" /></g>}
      </svg>
      {hov && <div className="tip" style={{ position: "absolute", left: Math.min(hov.x + 14, 200), top: Math.max(0, hov.y - 70) }}>
        <b>Año {hov.i}</b><br />Cooperativa: {eur(ser.coop[hov.i])}<br />Alquiler: {eur(ser.alq[hov.i])}<br />{d >= 0 ? "La cooperativa lleva " + eur(d) + " menos" : "La cooperativa lleva " + eur(-d) + " más"}
      </div>}
    </div>
  );
}

function ResC({ m, c }: { m: Model; c: CalcInput }) {
  const ser = series(c, m), H = ser.H;
  const rows: number[] = []; for (let y = 0; y <= H; y += H > 20 ? 5 : H > 10 ? 2 : 1) rows.push(y);
  if (rows[rows.length - 1] !== H) rows.push(H);
  const msg = ser.be ? `Con estos datos, la cooperativa acumula menos gasto que el alquiler a partir del año ${ser.be}.` : `Con estos datos, en ${H} años la cooperativa cuesta ${eur(ser.coop[H] - ser.alq[H])} más que el alquiler acumulado.`;
  return (
    <>
      <div><span className="eyebrow">Gasto acumulado por vivienda</span><p style={{ font: "700 20px var(--font-display)", marginTop: 4 }}>{msg}</p></div>
      <LineChart ser={ser} />
      <div className="lg">
        <div><span className="sw" style={{ background: "var(--s1)" }} /><span>Cooperativa: aportación y cuotas</span><span className="v">{eur(ser.coop[H])}</span></div>
        <div><span className="sw" style={{ background: "var(--s2)" }} /><span>Alquiler de mercado</span><span className="v">{eur(ser.alq[H])}</span></div>
      </div>
      {c.plazo < H && <p className="note">Al acabar el préstamo, en el año {c.plazo}, la cuota baja a solo mantenimiento y reserva: unos {eur((+c.mant + +c.reserva) * Math.pow(1 + c.ipc / 100, c.plazo))} al mes.</p>}
      <p className="note">La aportación inicial ({eur(c.aport)}) se devuelve actualizada al salir. Aquí cuenta como gasto desde el primer día para ser prudentes.</p>
      <details className="dd"><summary>Ver los datos en tabla</summary><div className="scroll"><table><thead><tr><th>Año</th><th>Cooperativa</th><th>Alquiler</th><th>Diferencia</th></tr></thead><tbody>
        {rows.map((y) => <tr key={y}><td>{y}</td><td>{eur(ser.coop[y])}</td><td>{eur(ser.alq[y])}</td><td>{eur(ser.alq[y] - ser.coop[y])}</td></tr>)}
      </tbody></table></div></details>
    </>
  );
}

export default function Calc() {
  const { s } = useStore();
  const m = model(s.calc, s.group.fam);
  return (
    <section className="view">
      <div className="intro"><h2>Calculadoras</h2><p>Todos los valores iniciales son ejemplos que puedes cambiar; no son precios de mercado. Cambia un dato y las tres calculadoras se actualizan juntas.</p></div>
      <article className="card" id="cA"><h3>Cuota mensual de cada vivienda</h3>
        <div className="calc-grid"><div className="inputs">{SPA.map((sp) => <Field key={sp.k} sp={sp} />)}</div><div className="res" aria-live="polite"><ResA m={m} c={s.calc} /></div></div></article>
      <article className="card" id="cB"><h3>¿Cabe en el presupuesto de cada familia?</h3>
        <div className="calc-grid"><div className="inputs">{SPB.map((sp) => <Field key={sp.k} sp={sp} />)}<p className="note">Los límites de cada concurso cambian: usa estos valores solo como orientación y revisa las bases.</p></div><div className="res" aria-live="polite"><ResB m={m} c={s.calc} /></div></div></article>
      <article className="card" id="cC"><h3>Cooperativa frente a alquiler</h3>
        <div className="calc-grid wide"><div className="inputs">{SPC.map((sp) => <Field key={sp.k} sp={sp} />)}</div><div className="res" aria-live="polite"><ResC m={m} c={s.calc} /></div></div></article>
    </section>
  );
}
