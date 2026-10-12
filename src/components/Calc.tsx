"use client";
import { useState } from "react";
import { TERMS } from "@/lib/content";
import { useStore, type Sim } from "@/lib/store";
import { viviendasDeCalculo, quitarSimulacion, ajustarObraPorM2, OBRA_POR_VIVIENDA, OBRA_POR_M2 } from "@/lib/simulacion";
import { M2_POR_VIVIENDA } from "@/lib/fit";
import { model, series, eligibility, niceTicks, type CalcInput, type Model } from "@/lib/calc";
import { eur, nf0, fnum, kfmt } from "@/lib/format";
import { useHelp } from "./Rich";
import { TriangleAlert, Check, X } from "lucide-react";
import { Card, CardTitle } from "./ui/card";
import { Alert } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Disclosure } from "./ui/disclosure";
import { Label } from "./ui/field";
import Terreno from "./Terreno";

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
  { k: "alq", l: "Alquiler de un piso parecido, ya reformado", u: "€/mes", step: 10 },
  { k: "sube", l: "Subida anual del alquiler", u: "% al año", step: 0.5 },
  { k: "ipc", l: "Subida anual de mantenimiento y reserva", u: "% al año", step: 0.5 },
  { k: "hor", l: "Horizonte", r: true, min: 5, max: 60, step: 1, fmt: (v) => v + " años" },
];

function Field({ sp }: { sp: Spec }) {
  const { s, set } = useStore();
  const help = useHelp();
  const val = sp.k === "fam" ? viviendasDeCalculo(s) : (s.calc as unknown as Record<string, number>)[sp.k];
  const [txt, setTxt] = useState<string | null>(null);
  const change = (raw: string) => {
    if (!sp.r) setTxt(raw);
    if (raw === "") return;
    let v = parseFloat(raw); if (isNaN(v) || v < 0) v = 0;
    if (sp.k === "fam") {
      const n = Math.max(1, Math.min(200, Math.round(v) || 1));
      // Con una simulación en curso se cambian las viviendas de la simulación, no las familias de la cooperativa.
      set((x) => x.sim?.viv != null ? { ...x, sim: { ...x.sim, viv: n } } : { ...x, group: { ...x.group, fam: n } });
    }
    else set((x) => ({ ...x, calc: { ...x.calc, [sp.k]: v } }));
  };
  const q = sp.t ? <button type="button" className="q" aria-label={"Ayuda: " + TERMS[sp.t].t} onClick={(e) => help(sp.t!, e.currentTarget)}>?</button> : null;
  const id = "ci-" + sp.k;
  if (sp.r) return (
    <div className="grid gap-1"><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5"><Label htmlFor={id}>{sp.l}</Label>{q}</span><output className="font-mono text-sm font-medium">{sp.fmt!(val)}</output></div>
      <input type="range" id={id} min={sp.min} max={sp.max} step={sp.step} value={val} onChange={(e) => change(e.target.value)} className="my-1 w-full cursor-pointer accent-primary" /></div>
  );
  return (
    <div className="grid min-w-0 gap-1.5"><span className="flex items-center gap-1.5"><Label htmlFor={id}>{sp.l}</Label>{q}</span>
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
      <div className="hero-n"><span className="eyebrow">Cuota de cada familia (por vivienda)</span><span className="big">{nf0.format(m.tot)}<small>€ al mes</small></span></div>
      <div className="bar" role="img" aria-label="Reparto de la cuota mensual">{parts.filter((p) => p[1] > 0).map((p) => <i key={p[0]} style={{ flex: `${p[1].toFixed(2)} 1 0`, background: p[2] }} title={`${p[0]}: ${eur(p[1])} al mes`} />)}</div>
      <div className="lg">{parts.map((p) => <div key={p[0]}><span className="sw" style={{ background: p[2] }} /><span>{p[0]}</span><span className="v">{eur(p[1])}</span></div>)}</div>
      {m.need < 0 && <Alert variant="info"><Check aria-hidden /><span>Con estas aportaciones y ayudas no hace falta préstamo y sobrarían {eur(m.surplus)}.</span></Alert>}
      {m.need >= 0 && m.pct > 0.85 && <Alert variant="warning"><TriangleAlert aria-hidden /><span>El préstamo cubre una parte muy grande del coste. Conviene hablar pronto con la entidad financiera sobre el importe máximo que concedería.</span></Alert>}
      <div><div className="sub">De dónde sale el dinero</div>
        <div className="donut">
          <svg viewBox="0 0 104 104" role="img" aria-label="De dónde sale el dinero">
            {src.map((x) => { const len = (C * x[1]) / sum, gap = src.length > 1 ? Math.min(2, len * 0.5) : 0; const el = <circle key={x[0]} cx="52" cy="52" r={R} fill="none" stroke={x[2]} strokeWidth="16" strokeDasharray={`${(len - gap).toFixed(2)} ${(C - len + gap).toFixed(2)}`} strokeDashoffset={(-acc).toFixed(2)} transform="rotate(-90 52 52)"><title>{`${x[0]}: ${eur(x[1])} (${Math.round((x[1] / sum) * 100)}%)`}</title></circle>; acc += len; return el; })}
            <text className="ctr" x="52" y="51" textAnchor="middle">{kfmt(sum)}</text><text className="cs" x="52" y="62" textAnchor="middle">coste total</text>
          </svg>
          <div className="lg">{src.map((x) => <div key={x[0]}><span className="sw" style={{ background: x[2] }} /><span>{x[0]}</span><span className="v">{Math.round((x[1] / sum) * 100)}%</span></div>)}</div>
        </div></div>
      <div><div className="sub">Toda la cooperativa ({m.v} {m.v === 1 ? "vivienda" : "viviendas"})</div>
        <div className="facts">
          <div><span>Coste total del proyecto</span><b>{eur(m.total)}</b></div>
          <div><span>Préstamo necesario</span><b>{eur(m.fin)} ({Math.round(m.pct * 100)}%)</b></div>
          <div><span>Cuota del préstamo</span><b>{eur(m.pm)}/mes</b></div>
        </div></div>
      <div><div className="sub">Cada familia</div>
        <div className="facts">
          <div><span>Su parte del coste del edificio</span><b>{eur(m.total / m.v)}</b></div>
          <div><span>Ingresos mínimos para que la cuota sea el 30%</span><b>{eur(m.ing30)}/mes</b></div>
          <div><span>Frente al alquiler de un piso parecido ({eur(c.alq)}/mes)</span><b>{diff >= 0 ? "ahorra " + eur(diff) : "paga " + eur(-diff) + " más"}/mes</b></div>
        </div></div>
    </>
  );
}

function ResB({ m, c }: { m: Model; c: CalcInput }) {
  const e = eligibility(c, m), fill = Math.min(100, (e.pc / 60) * 100);
  return (
    <>
      <p className="note" style={{ marginTop: 0 }}>Todo este bloque es para <b>una familia</b>. Su cuota, <b>{eur(m.tot)}/mes</b>, viene de la calculadora de arriba: {m.v} {m.v === 1 ? "vivienda" : "viviendas"} y un coste total de {eur(m.total)}.</p>
      <div><div className="sub">1. ¿Puede optar a un concurso de vivienda protegida?</div>
        <div className="hero-n"><span className="eyebrow">Límite de ingresos de referencia</span><span className="big" style={{ fontSize: "clamp(30px,7vw,40px)" }}>{nf0.format(e.lim)}<small>€ al año</small></span></div>
        <div className="facts">
          <div><span>Ingresos de la familia</span><b>{eur(c.ingresos)}/año</b></div>
          <div><span>{e.ok ? "Margen" : "Exceso"}</span><b>{eur(Math.abs(e.lim - c.ingresos))}</b></div>
        </div>
        <Badge variant={e.ok ? "success" : "danger"} className="mt-2 px-3 py-1 text-[13px]">{e.ok ? <><Check aria-hidden /> Sí: sus ingresos están dentro del límite</> : <><X aria-hidden /> No: sus ingresos superan el límite</>}</Badge>
      </div>
      <div><div className="sub">2. ¿Puede pagar la cuota?</div>
      <div className="facts">
        <div><span>Cuota máxima recomendable (30% de sus ingresos)</span><b>{eur(e.maxq)}/mes</b></div>
        <div><span>Cuota de su vivienda en la cooperativa</span><b>{eur(m.tot)}/mes</b></div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ position: "relative", height: 10, background: "var(--line)", borderRadius: 5 }} role="img" aria-label={`La cuota es el ${Math.round(e.pc)}% de los ingresos`}>
          <i style={{ display: "block", height: "100%", width: fill.toFixed(1) + "%", borderRadius: 5, background: e.fits ? "var(--good)" : "var(--bad)" }} />
          <i style={{ position: "absolute", left: "50%", top: -4, width: 2, height: 18, background: "var(--ink)" }} />
        </div>
        <p className="note" style={{ marginTop: 6 }}>La cuota es el {Math.round(e.pc)}% de los ingresos. La marca señala el tope del 30%.</p>
      </div>
      <Badge variant={e.fits ? "success" : "danger"} className="mt-2 px-3 py-1 text-[13px]">{e.fits ? <><Check aria-hidden /> Sí: la cuota cabe en su presupuesto</> : <><X aria-hidden /> No: la cuota supera el 30% de sus ingresos</>}</Badge>
      </div>
      {!e.fits && <Alert variant="warning"><TriangleAlert aria-hidden /><span>Con estos datos el proyecto no es asumible para esta familia. Prueba con más viviendas, un edificio más barato, más ayudas o un plazo de préstamo más largo.</span></Alert>}
      <p className="note">En el concurso de la EVha que sirvió de ejemplo, la mitad de las personas socias debían pertenecer a colectivos preferentes. Las bases de cada concurso mandan.</p>
    </>
  );
}

function LineChart({ ser }: { ser: ReturnType<typeof series> }) {
  const [hov, setHov] = useState<{ i: number; x: number; y: number } | null>(null);
  const W = 480, HT = 290, ml = 54, mr = 14, mt = 14, mb = 36, H = ser.H, last = H - 1;
  const maxV = Math.max(...ser.coop, ...ser.alq, 1), tk = niceTicks(maxV, 4), top = tk[tk.length - 1];
  // Índice i = año i + 1.
  const x = (i: number) => ml + ((W - ml - mr) * i) / Math.max(1, last), y = (v: number) => mt + (HT - mt - mb) * (1 - v / top);
  const step = H <= 10 ? 1 : H <= 20 ? 2 : 5;
  const xs: number[] = [0]; for (let yr = step; yr <= H; yr += step) xs.push(yr - 1);
  const path = (a: number[]) => a.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + "," + y(v).toFixed(1)).join("");
  const d = hov ? ser.alq[hov.i] - ser.coop[hov.i] : 0;
  return (
    <div style={{ position: "relative" }}>
      <svg className="chart" viewBox={`0 0 ${W} ${HT}`} role="img" aria-label="Lo que paga una familia cada mes: cooperativa frente a alquiler"
        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W; const i = Math.max(0, Math.min(last, Math.round(((px - ml) / (W - ml - mr)) * last))); setHov({ i, x: e.clientX - r.left, y: e.clientY - r.top }); }}
        onPointerLeave={() => setHov(null)}>
        {tk.map((v) => <g key={v}><line className="gr" x1={ml} x2={W - mr} y1={y(v)} y2={y(v)} /><text x={ml - 8} y={y(v) + 4} textAnchor="end">{kfmt(v)}</text></g>)}
        {xs.map((i) => <text key={i} x={x(i)} y={HT - mb + 17} textAnchor="middle">{i + 1}</text>)}
        <text x={ml + (W - ml - mr) / 2} y={HT - 4} textAnchor="middle">año</text>
        <line className="ax" x1={ml} x2={W - mr} y1={y(0)} y2={y(0)} />
        {ser.paid !== null && <g><line x1={x(ser.paid - 0.5)} x2={x(ser.paid - 0.5)} y1={mt} y2={y(0)} stroke="var(--ink)" strokeOpacity="0.35" strokeDasharray="4 4" /><text x={x(ser.paid - 0.5) - 6} y={mt + 12} textAnchor="end">Préstamo pagado</text></g>}
        <path d={path(ser.alq)} fill="none" stroke="var(--s2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path(ser.coop)} fill="none" stroke="var(--s1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(last)} cy={y(ser.alq[last])} r="4" fill="var(--s2)" stroke="var(--surface-2)" strokeWidth="2" />
        <circle cx={x(last)} cy={y(ser.coop[last])} r="4" fill="var(--s1)" stroke="var(--surface-2)" strokeWidth="2" />
        {hov && <g><line className="ax" x1={x(hov.i)} x2={x(hov.i)} y1={mt} y2={y(0)} /><circle cx={x(hov.i)} cy={y(ser.coop[hov.i])} r="4" fill="var(--s1)" stroke="var(--surface-2)" strokeWidth="2" /><circle cx={x(hov.i)} cy={y(ser.alq[hov.i])} r="4" fill="var(--s2)" stroke="var(--surface-2)" strokeWidth="2" /></g>}
      </svg>
      {hov && <div className="tip" style={{ position: "absolute", left: Math.min(hov.x + 14, 200), top: Math.max(0, hov.y - 70) }}>
        <b>Año {hov.i + 1}, cada mes</b><br />Cooperativa: {eur(ser.coop[hov.i])}<br />Alquiler: {eur(ser.alq[hov.i])}<br />{d >= 0 ? "La cooperativa cuesta " + eur(d) + " menos" : "La cooperativa cuesta " + eur(-d) + " más"}
      </div>}
    </div>
  );
}

function ResC({ m, c }: { m: Model; c: CalcInput }) {
  const ser = series(c, m), H = ser.H, at = (yr: number) => yr - 1;
  const moments: [string, number][] = [["Hoy (año 1)", 1]];
  const pz = Math.round(c.plazo);
  if (pz > 1 && pz <= H) moments.push([`Año ${pz}, último del préstamo`, pz]);
  if (ser.paid !== null) moments.push([`Año ${pz + 1}, préstamo pagado`, pz + 1]);
  if (H > (ser.paid !== null ? pz + 1 : pz)) moments.push([`Año ${H}`, H]);
  const rows: number[] = [1]; for (let yr = 5; yr <= H; yr += 5) rows.push(yr);
  if (ser.paid !== null && !rows.includes(pz + 1)) rows.push(pz + 1);
  if (!rows.includes(H)) rows.push(H);
  rows.sort((a, b) => a - b);
  const msg = ser.be === 1 ? `Con estos datos, cada familia paga menos en la cooperativa que de alquiler desde el primer mes.`
    : ser.be ? `Con estos datos, la cooperativa empieza siendo más cara, pero a partir del año ${ser.be} cada familia paga menos que de alquiler.`
    : `Con estos datos, en ${H} años la cooperativa no llega a ser más barata que el alquiler.`;
  const hint = ser.be !== 1 && m.tot > c.alq ? `Al principio la cuota (${eur(m.tot)}/mes) es más alta que el alquiler (${eur(c.alq)}/mes). Revisa arriba el número de viviendas, el precio o las ayudas.` : null;
  return (
    <>
      <div><span className="eyebrow">Lo que paga una familia cada mes</span><p style={{ font: "700 20px var(--font-display)", marginTop: 4 }}>{msg}</p>{hint && <p className="note" style={{ marginTop: 4 }}>{hint}</p>}</div>
      <div className="scroll"><table><thead><tr><th>Cada mes</th><th>Cooperativa</th><th>Alquiler</th></tr></thead><tbody>
        {moments.map(([l, yr]) => <tr key={l}><td>{l}</td><td><b>{eur(ser.coop[at(yr)])}</b></td><td><b>{eur(ser.alq[at(yr)])}</b></td></tr>)}
      </tbody></table></div>
      <LineChart ser={ser} />
      <div className="lg">
        <div><span className="sw" style={{ background: "var(--s1)" }} /><span>Cooperativa: su parte del préstamo, mantenimiento y reserva</span></div>
        <div><span className="sw" style={{ background: "var(--s2)" }} /><span>Alquiler de un piso parecido, ya reformado</span></div>
      </div>
      <p className="note"><b>¿Por qué se puede comparar?</b> El alquiler también incluye la compra y la reforma del piso: las pagó el propietario y las recupera, con beneficio, cobrando la renta. En la cooperativa hacéis ese papel vosotros y lo pagáis al banco, sin beneficio para nadie. La diferencia es que el préstamo se acaba y el alquiler no.</p>
      {ser.paid === null && <p className="note">El préstamo dura {c.plazo} años: amplía el horizonte por encima de {c.plazo} para ver qué pasa cuando se termina de pagar.</p>}
      <p className="note">Además, al entrar cada familia pone una aportación inicial de {eur(c.aport)}, que se le devuelve actualizada al salir.</p>
      <Disclosure summary="Ver todos los años"><div className="scroll"><table><thead><tr><th>Año</th><th>Cooperativa (€/mes)</th><th>Alquiler (€/mes)</th><th>Diferencia</th></tr></thead><tbody>
        {rows.map((yr) => <tr key={yr}><td>{yr}</td><td>{eur(ser.coop[at(yr)])}</td><td>{eur(ser.alq[at(yr)])}</td><td>{eur(ser.alq[at(yr)] - ser.coop[at(yr)])}</td></tr>)}
      </tbody></table></div></Disclosure>
    </>
  );
}

/** Qué sale del anuncio, qué son supuestos y qué queda por revisar al simular. */
function textoSim(sim: Sim, fam: number) {
  const coop = `Tu cooperativa sigue teniendo ${fam} ${fam === 1 ? "familia" : "familias"}.`;
  const obra = `${nf0.format(OBRA_POR_M2)} €/m²`;
  if (sim.tipo === "terrenos") {
    if (sim.sinViviendas) return "Se han cargado el precio y la superficie, pero con la clase de suelo elegida en «Del terreno a las viviendas» no sale ninguna vivienda (suelo no urbanizable o sin edificabilidad). Cámbiala ahí si el terreno es de otra clase.";
    return `Del anuncio salen el precio${sim.sinSuperficie ? "" : " y la superficie"}${sim.sinSuperficie ? " (no indica la superficie: ponla tú en «Del terreno a las viviendas»)" : ""}. La clase de suelo y la edificabilidad no vienen en el anuncio: se han usado las de «Del terreno a las viviendas», con ellas salen ${sim.viv} viviendas y se ha cargado el suelo ya urbanizado y una obra supuesta de ${obra}. Compruébalas y, si las cambias, pulsa allí «Usar en las calculadoras de cuota». ${coop}`;
  }
  if (sim.tipo === "terreno-calculado") return `Se han cargado el coste del suelo ya urbanizado, las ${sim.viv} viviendas posibles y una obra supuesta de ${obra} sobre el techo construible: ajústala. ${coop}`;
  if (sim.m2) return `Del anuncio salen el precio y los m² (≈ ${sim.viv} ${sim.viv === 1 ? "vivienda" : "viviendas"} a ${M2_POR_VIVIENDA} m²). Lo demás son supuestos: la obra se calcula con ${obra} (cámbiala según el estado del edificio) y el resto, con los datos de las calculadoras. ${coop}`;
  if (sim.viv != null) return `Del anuncio salen el precio y las ${sim.viv} viviendas. Lo demás son supuestos: obra de ${nf0.format(OBRA_POR_VIVIENDA)} € por vivienda (ajústala en «Obra o rehabilitación») y el resto, con los datos de las calculadoras. ${coop}`;
  return `Del anuncio sale el precio. No indica los metros, así que se calcula con las viviendas de tu cooperativa (${fam}) y una obra de ${nf0.format(OBRA_POR_VIVIENDA)} € por vivienda: ajústala en «Obra o rehabilitación».`;
}

/** Cifras de la propiedad simulada de principio a fin, para ver qué sale del anuncio y qué es supuesto. */
function FichaSim({ m, c, sim }: { m: Model; c: CalcInput; sim: Sim }) {
  const { set } = useStore();
  const hechos: [string, string][] = [
    [sim.tipo === "edificios" ? "Precio del edificio" : "Suelo (ya urbanizado)", eur(+c.suelo || 0)],
    ["Obra o rehabilitación", eur(+c.obra || 0)],
    [`Total con gastos (${fnum(+c.gastos || 0, 0)} %)`, eur(m.total)],
    ["Viviendas", String(m.v)],
    ["Coste por vivienda", eur(m.total / m.v)],
    ["Cuota de cada familia", `${nf0.format(m.tot)} €/mes`],
  ];
  return (
    <div className="grid gap-2 rounded-lg bg-accent px-3 py-2.5 text-[13px]">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        {hechos.map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-mono font-medium text-foreground">{v}</dd></div>)}
      </dl>
      {sim.m2 ? (
        <label className="flex flex-wrap items-center gap-2" htmlFor="sim-obra-m2">
          <span className="text-muted-foreground">Obra supuesta, por m² construido ({nf0.format(sim.m2)} m²):</span>
          <input id="sim-obra-m2" type="number" min={0} step={50} inputMode="numeric" className="w-24 rounded-md border bg-card px-2 py-1 text-right font-mono" value={Math.round((+c.obra || 0) / sim.m2)}
            onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) set((x) => ajustarObraPorM2(x, v)); }} /> <span className="text-muted-foreground">€/m²</span>
        </label>
      ) : null}
    </div>
  );
}

export default function Calc() {
  const { s, set } = useStore();
  const m = model(s.calc, viviendasDeCalculo(s));
  return (
    <section className="grid gap-5">
      <div className="grid gap-1.5"><h2 className="font-heading text-2xl font-bold">Calculadoras</h2><p className="max-w-[68ch] text-muted-foreground">Todos los valores iniciales son ejemplos que puedes cambiar; no son precios de mercado. Si aún no tenéis terreno cerrado, empieza por «Del terreno a las viviendas»: te dice cuánto se puede construir y cuánto cuesta, y lo carga en las otras tres, que se actualizan juntas.</p></div>
      {s.sim && (
        <Card className="gap-3 sm:flex-row sm:items-center">
          {s.sim.foto && (/* eslint-disable-next-line @next/next/no-img-element */
            <img src={s.sim.foto} alt={`Foto del inmueble: ${s.sim.titulo}`} className="aspect-[4/3] w-full rounded-lg object-cover sm:w-52" loading="lazy" referrerPolicy="no-referrer" />
          )}
          <div className="grid min-w-0 flex-1 gap-1">
            <div className="text-xs font-semibold text-muted-foreground">Estás calculando</div>
            <div className="font-heading text-lg font-bold">{s.sim.titulo}</div>
            <div className="text-[13px] text-muted-foreground">{[s.sim.zona, s.sim.fuente].filter(Boolean).join(" · ")}{[s.sim.zona, s.sim.fuente].some(Boolean) ? ". " : ""}{textoSim(s.sim, s.group.fam)}</div>
            <FichaSim m={m} c={s.calc} sim={s.sim} />
            <div className="flex flex-wrap gap-3 text-[13px]">
              {s.sim.url && /^https:\/\//.test(s.sim.url) && <a className="font-semibold text-primary underline" href={s.sim.url} target="_blank" rel="noopener noreferrer">Ver anuncio ↗</a>}
              <button type="button" className="font-semibold text-primary underline" onClick={() => window.dispatchEvent(new CustomEvent("cami:goto", { detail: "opor" }))}>← Volver a Oportunidades</button>
              <button type="button" className="text-muted-foreground underline" onClick={() => set((x) => quitarSimulacion(x))}>Quitar y volver a mis datos</button>
            </div>
          </div>
        </Card>
      )}
      <Terreno />
      <Card id="cA" className="gap-5"><CardTitle className="text-xl">Cuota mensual de cada vivienda</CardTitle>
        <div className="calc-grid"><div className="inputs">{SPA.map((sp) => <Field key={sp.k} sp={sp} />)}</div><div className="res" aria-live="polite"><ResA m={m} c={s.calc} /></div></div></Card>
      <Card id="cB" className="gap-5"><CardTitle className="text-xl">¿Cabe en el presupuesto de cada familia?</CardTitle>
        <div className="calc-grid"><div className="inputs">{SPB.map((sp) => <Field key={sp.k} sp={sp} />)}<p className="note">Los límites de cada concurso cambian: usa estos valores solo como orientación y revisa las bases.</p></div><div className="res" aria-live="polite"><ResB m={m} c={s.calc} /></div></div></Card>
      <Card id="cC" className="gap-5"><CardTitle className="text-xl">Cooperativa frente a alquiler</CardTitle>
        <div className="calc-grid wide"><div className="inputs">{SPC.map((sp) => <Field key={sp.k} sp={sp} />)}</div><div className="res" aria-live="polite"><ResC m={m} c={s.calc} /></div></div></Card>
    </section>
  );
}
