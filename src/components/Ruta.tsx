"use client";
import { PH, REGIONS, entitiesFor, TERMS } from "@/lib/content";
import { useStore } from "@/lib/store";
import { Rich, useHelp } from "./Rich";
import { plain } from "@/lib/format";
import { ChevronDown, ArrowRight, Check, Users } from "lucide-react";
import { Card, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { NativeSelect } from "./ui/select";
import { Field } from "./ui/field";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export const stats = (done: Record<string, boolean>, i: number) => {
  const p = PH[i], n = p.tasks.length, d = p.tasks.filter((t) => done[t.id]).length;
  return { n, d, full: d === n };
};
export const curIdx = (done: Record<string, boolean>) => { const i = PH.findIndex((_, k) => !stats(done, k).full); return i < 0 ? PH.length - 1 : i; };

/** El edificio de la cooperativa: 6 plantas = 6 fases, 5 ventanas por planta = 5 pasos. Cada paso hecho enciende una ventana. */
function Edificio({ done, total, count }: { done: Record<string, boolean>; total: number; count: number }) {
  const W = 260, H = 236, x0 = 22, bw = 216, top = 50, fh = 26, nF = PH.length, base = top + fh * nF;
  const floors = PH.map((p, i) => ({ y: base - fh * (i + 1), full: stats(done, i).full, tasks: p.tasks }));
  const plantas = floors.filter((f) => f.full).length;
  return (
    <div className="bld">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Vuestro edificio: ${count} de ${total} pasos hechos, ${plantas} de ${nF} plantas completas`}>
        <defs>
          <linearGradient id="glow" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--sun)" stopOpacity=".28" /><stop offset="1" stopColor="var(--sun)" stopOpacity="0" /></linearGradient>
        </defs>
        {count > 0 && <ellipse cx={W / 2} cy={base} rx="120" ry="34" fill="url(#glow)" />}
        {/* cubierta a dos aguas con chimenea */}
        <rect x="176" y="14" width="14" height="26" className="b-wall" />
        <path d={`M${x0 - 8} ${top} L${W / 2} 16 L${W - x0 + 8} ${top} Z`} className="b-roof" />
        <rect x={x0 - 4} y={top - 3} width={bw + 8} height="6" rx="1.5" className="b-roof" />
        {/* fachada */}
        <rect x={x0} y={top} width={bw} height={fh * nF} className="b-wall" />
        {floors.map((f, i) => (
          <g key={i}>
            {i < nF - 1 && <line x1={x0} x2={x0 + bw} y1={f.y} y2={f.y} className="b-line" />}
            {f.tasks.map((t, j) => {
              const on = !!done[t.id], wx = x0 + 10 + j * 42, wy = f.y + 5;
              return <g key={t.id}><rect x={wx} y={wy} width="26" height="16" rx="2" className={on ? "b-win on" : "b-win"} />{on && <line x1={wx + 13} x2={wx + 13} y1={wy} y2={wy + 16} className="b-mull" />}</g>;
            })}
          </g>
        ))}
        {/* calle */}
        <rect x="0" y={base} width={W} height="4" className="b-ground" />
        <rect x={W / 2 - 9} y={base - 20} width="18" height="20" rx="2" className="b-door" />
        <text x={W / 2} y={base + 26} textAnchor="middle" className="b-cap">{count}/{total} pasos</text>
      </svg>
    </div>
  );
}

export function Hero({ s }: { s: ReturnType<typeof useStore>["s"] }) {
  const all = PH.reduce((a, p) => a + p.tasks.length, 0);
  const done = PH.reduce((a, _, i) => a + stats(s.done, i).d, 0);
  const pct = done / all, cur = curIdx(s.done), fin = done === all, C = 2 * Math.PI * 34;
  const nx = PH[cur].tasks.find((t) => !s.done[t.id]);
  return (
    <section className="hero" aria-label="Presentación">
      <svg className="tiles" aria-hidden="true"><defs><pattern id="az" width="44" height="44" patternUnits="userSpaceOnUse"><path className="tp" d="M22 3L41 22L22 41L3 22Z" /><circle className="tpf" cx="22" cy="22" r="5" /><path className="tp" d="M0 0h7M0 0v7M44 0h-7M44 0v7M0 44h7M0 44v-7M44 44h-7M44 44v-7" /></pattern></defs><rect width="100%" height="100%" fill="url(#az)" /></svg>
      <div className="hero-t">
        <p className="eyebrow">Vivienda cooperativa en cesión de uso · España</p>
        <h1>Techo Común</h1>
        <p className="lead">De un grupo de familias a las llaves de un edificio que nadie podrá especular. Sigue la ruta, simula las cuentas y busca oportunidades.</p>
        <p className="next">{fin ? <><b>Ruta completada.</b> Ya podéis vivir en común.</> : <><b>Siguiente paso:</b> {plain(nx!.t)}</>}</p>
      </div>
      <Edificio done={s.done} total={all} count={done} />
    </section>
  );
}

export default function Ruta({ goTo }: { goTo: (k: string) => void }) {
  const { s, set } = useStore();
  const help = useHelp();
  const cur = curIdx(s.done);
  const fin = PH.every((_, i) => stats(s.done, i).full);
  const open = (i: number) => set((x) => ({ ...x, open: x.open === i ? -1 : i }));
  const openAt = s.open != null && s.open >= -1 && s.open < PH.length ? s.open : cur;
  return (
    <section className="grid gap-5">
      <Card>
        <CardTitle className="flex items-center gap-2 text-2xl"><Users className="size-5 text-primary" aria-hidden /> Tu grupo</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Comunidad autónoma" htmlFor="g-region"><NativeSelect id="g-region" value={s.group.region} onChange={(e) => set((x) => ({ ...x, group: { ...x.group, region: e.target.value } }))}><option value="">Elige tu comunidad…</option>{REGIONS.map((r) => <option key={r[0]} value={r[0]}>{r[1]}</option>)}</NativeSelect></Field>
          <Field label="Ciudad o municipio" htmlFor="g-ciudad"><Input id="g-ciudad" type="text" autoComplete="off" placeholder="Por ejemplo, Bilbao o València" value={s.group.ciudad} onChange={(e) => set((x) => ({ ...x, group: { ...x.group, ciudad: e.target.value } }))} /></Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_2fr]">
          <Field label="Nombre de la cooperativa" htmlFor="g-name"><Input id="g-name" type="text" autoComplete="off" placeholder="Por ejemplo, Llar del Barri" value={s.group.name} onChange={(e) => set((x) => ({ ...x, group: { ...x.group, name: e.target.value } }))} /></Field>
          <Field label="Familias" htmlFor="g-fam"><Input id="g-fam" type="number" min={1} max={200} inputMode="numeric" value={s.group.fam} onChange={(e) => { const v = parseInt(e.target.value, 10); if (isNaN(v)) return; set((x) => ({ ...x, group: { ...x.group, fam: Math.max(1, Math.min(200, v)) } })); }} /></Field>
          <Field label="Barrio o zona de interés" htmlFor="g-barrio"><Input id="g-barrio" type="text" autoComplete="off" placeholder="Por ejemplo, Cabanyal o Patraix" value={s.group.barrio} onChange={(e) => set((x) => ({ ...x, group: { ...x.group, barrio: e.target.value } }))} /></Field>
        </div>
        <p className="text-[13px] text-muted-foreground">Estos datos adaptan las entidades, los enlaces y los mensajes a tu zona, y alimentan las calculadoras. Se guardan solo en este navegador.</p>
      </Card>
      <div className="grid gap-1.5">
        <h2 className="font-heading text-2xl font-bold">La ruta, en seis estaciones</h2>
        <p className="max-w-[68ch] text-muted-foreground">Toca una estación para abrir sus pasos. Marca lo que ya habéis hecho y la línea avanza. Las palabras con <span className="t" style={{ pointerEvents: "none" }}>?</span> abren una explicación.</p>
      </div>
      <div className="metro" style={{ ["--p" as string]: fin ? 1 : cur / (PH.length - 1) }}>
        <span className="fill" />
        {PH.map((p, i) => {
          const f = stats(s.done, i).full;
          return <button key={p.id} type="button" className={"st" + (f ? " done" : "") + (i === cur && !f ? " now" : "")} onClick={() => set((x) => ({ ...x, open: i }))}><span className="dot">{f ? <Check className="size-4" strokeWidth={3} aria-label="Completada" /> : i + 1}</span><span>{p.short}</span></button>;
        })}
      </div>
      <div className="grid gap-2.5">
        {PH.map((p, i) => {
          const st = stats(s.done, i), isOpen = openAt === i, isNow = i === cur && !st.full;
          return (
            <article key={p.id} id={"ph-" + i} className={"overflow-hidden rounded-xl border bg-card shadow-sm transition " + (isNow ? "border-primary ring-1 ring-primary/30" : "")}>
              <button type="button" className="grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left outline-none hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/40" aria-expanded={isOpen} aria-controls={"pb-" + i} onClick={() => open(i)}>
                <span className={"grid size-8 place-items-center rounded-full font-heading text-sm font-bold " + (st.full ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>{st.full ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}</span>
                <span className="grid min-w-0 gap-1.5"><b className="font-heading text-[17px]">{p.title}</b><span className="h-1.5 max-w-56 overflow-hidden rounded-full bg-secondary"><i className="block h-full rounded-full bg-primary transition-all" style={{ width: (st.d / st.n) * 100 + "%" }} /></span></span>
                <span className="flex items-center gap-2 font-mono text-[13px] text-muted-foreground"><span>{st.d}/{st.n}</span><ChevronDown className={"size-4 transition-transform " + (isOpen ? "rotate-180" : "")} aria-hidden /></span>
              </button>
              {isOpen && (
                <div className="grid gap-4 px-4 pb-4" id={"pb-" + i}>
                  {p.hard && <Badge variant="warning">{p.hard}</Badge>}
                  <p className="max-w-[68ch] text-muted-foreground">{p.lead}</p>
                  <div className="grid">
                    {p.tasks.map((t) => (
                      <div key={t.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-t py-2.5">
                        <Checkbox className="mt-0.5" id={"k-" + t.id} checked={!!s.done[t.id]} onCheckedChange={(v) => set((x) => { const d = { ...x.done }; if (v === true) d[t.id] = true; else delete d[t.id]; return { ...x, done: d }; })} />
                        <label htmlFor={"k-" + t.id} className={"cursor-pointer " + (s.done[t.id] ? "text-muted-foreground line-through decoration-border" : "")}><Rich text={t.t} /></label>
                        {t.go ? <Button size="xs" variant="outline" onClick={() => goTo(t.go!)}>{t.goL || "Abrir"} <ArrowRight aria-hidden /></Button> : <span />}
                      </div>
                    ))}
                  </div>
                  <div><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conceptos de esta fase</div><div className="flex flex-wrap gap-2">{p.terms.map((k) => <button key={k} type="button" className="cursor-help rounded-full border bg-card px-3 py-1 text-[13px] font-medium transition hover:border-primary hover:text-primary" onClick={(e) => help(k, e.currentTarget)}>{TERMS[k].t}</button>)}</div></div>
                  {p.ents.length > 0 && <div><div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dónde preguntar</div><div className="flex flex-wrap gap-2">{p.ents.map((id) => { const e = entitiesFor(s.group).find((x) => x.id === id); if (!e) return null; return <a key={id} className="rounded-full border bg-card px-3 py-1 text-[13px] font-medium text-primary transition hover:bg-accent" href={e.url} target="_blank" rel="noopener noreferrer">{e.name} ↗</a>; })}</div></div>}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
