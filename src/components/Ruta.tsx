"use client";
import { PH, REGIONS, entitiesFor, TERMS } from "@/lib/content";
import { useStore } from "@/lib/store";
import { Rich, useHelp } from "./Rich";
import { plain } from "@/lib/format";

export const stats = (done: Record<string, boolean>, i: number) => {
  const p = PH[i], n = p.tasks.length, d = p.tasks.filter((t) => done[t.id]).length;
  return { n, d, full: d === n };
};
export const curIdx = (done: Record<string, boolean>) => { const i = PH.findIndex((_, k) => !stats(done, k).full); return i < 0 ? PH.length - 1 : i; };

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
      <div className="ring" role="img" aria-label={`Progreso total: ${done} de ${all} pasos`}>
        <svg viewBox="0 0 84 84" aria-hidden="true">
          <circle cx="42" cy="42" r="34" fill="none" stroke="var(--surface-2)" strokeWidth="8" />
          {done > 0 && <circle cx="42" cy="42" r="34" fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={C.toFixed(2)} strokeDashoffset={(C * (1 - pct)).toFixed(2)} transform="rotate(-90 42 42)" />}
          <text className="tx" x="42" y="42" textAnchor="middle">{Math.round(pct * 100)}%</text>
          <text className="sm" x="42" y="56" textAnchor="middle">{done}/{all}</text>
        </svg>
      </div>
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
    <section className="view">
      <div className="card">
        <h2>Tu grupo</h2>
        <div className="grp-g loc">
          <div className="fld"><label className="lb" htmlFor="g-region">Comunidad autónoma</label><select id="g-region" value={s.group.region} onChange={(e) => set((x) => ({ ...x, group: { ...x.group, region: e.target.value } }))}><option value="">Elige tu comunidad…</option>{REGIONS.map((r) => <option key={r[0]} value={r[0]}>{r[1]}</option>)}</select></div>
          <div className="fld"><label className="lb" htmlFor="g-ciudad">Ciudad o municipio</label><input id="g-ciudad" type="text" autoComplete="off" placeholder="Por ejemplo, Bilbao o València" value={s.group.ciudad} onChange={(e) => set((x) => ({ ...x, group: { ...x.group, ciudad: e.target.value } }))} /></div>
        </div>
        <div className="grp-g">
          <div className="fld"><label className="lb" htmlFor="g-name">Nombre de la cooperativa</label><input id="g-name" type="text" autoComplete="off" placeholder="Por ejemplo, Llar del Barri" value={s.group.name} onChange={(e) => set((x) => ({ ...x, group: { ...x.group, name: e.target.value } }))} /></div>
          <div className="fld"><label className="lb" htmlFor="g-fam">Familias</label><input id="g-fam" type="number" min={1} max={200} inputMode="numeric" value={s.group.fam} onChange={(e) => { const v = parseInt(e.target.value, 10); if (isNaN(v)) return; set((x) => ({ ...x, group: { ...x.group, fam: Math.max(1, Math.min(200, v)) } })); }} /></div>
          <div className="fld"><label className="lb" htmlFor="g-barrio">Barrio o zona de interés</label><input id="g-barrio" type="text" autoComplete="off" placeholder="Por ejemplo, Cabanyal o Patraix" value={s.group.barrio} onChange={(e) => set((x) => ({ ...x, group: { ...x.group, barrio: e.target.value } }))} /></div>
        </div>
        <p className="note">Estos datos adaptan las entidades, los enlaces y los mensajes a tu zona, y alimentan las calculadoras. Se guardan solo en este navegador.</p>
      </div>
      <div className="intro">
        <h2>La ruta, en seis estaciones</h2>
        <p>Toca una estación para abrir sus pasos. Marca lo que ya habéis hecho y la línea avanza. Las palabras con <span className="t" style={{ pointerEvents: "none" }}>?</span> abren una explicación.</p>
      </div>
      <div className="metro" style={{ ["--p" as string]: fin ? 1 : cur / (PH.length - 1) }}>
        <span className="fill" />
        {PH.map((p, i) => {
          const f = stats(s.done, i).full;
          return <button key={p.id} type="button" className={"st" + (f ? " done" : "") + (i === cur && !f ? " now" : "")} onClick={() => set((x) => ({ ...x, open: i }))}><span className="dot">{i + 1}</span><span>{p.short}</span></button>;
        })}
      </div>
      <div className="phases">
        {PH.map((p, i) => {
          const st = stats(s.done, i), isOpen = openAt === i;
          return (
            <article key={p.id} className={"ph" + (isOpen ? " open" : "") + (st.full ? " full" : "") + (i === cur && !st.full ? " now" : "")} id={"ph-" + i}>
              <button type="button" className="ph-h" aria-expanded={isOpen} aria-controls={"pb-" + i} onClick={() => open(i)}>
                <span className="ph-n">{i + 1}</span>
                <span className="ph-t"><b>{p.title}</b><span className="ph-bar"><i style={{ width: (st.d / st.n) * 100 + "%" }} /></span></span>
                <span className="ph-c"><span>{st.d}/{st.n}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></span>
              </button>
              {isOpen && (
                <div className="ph-b" id={"pb-" + i}>
                  {p.hard && <span className="hard">{p.hard}</span>}
                  <p className="lead">{p.lead}</p>
                  <div className="tasks">
                    {p.tasks.map((t) => (
                      <div key={t.id} className={"task" + (s.done[t.id] ? " done" : "")}>
                        <input type="checkbox" id={"k-" + t.id} checked={!!s.done[t.id]} onChange={(e) => set((x) => { const d = { ...x.done }; if (e.target.checked) d[t.id] = true; else delete d[t.id]; return { ...x, done: d }; })} />
                        <label htmlFor={"k-" + t.id}><Rich text={t.t} /></label>
                        {t.go ? <button type="button" className="mini" onClick={() => goTo(t.go!)}>{t.goL || "Abrir"}</button> : <span />}
                      </div>
                    ))}
                  </div>
                  <div><div className="sub">Conceptos de esta fase</div><div className="chips">{p.terms.map((k) => <button key={k} type="button" className="chip term" onClick={(e) => help(k, e.currentTarget)}>{TERMS[k].t}</button>)}</div></div>
                  {p.ents.length > 0 && <div><div className="sub">Dónde preguntar</div><div className="chips">{p.ents.map((id) => { const e = entitiesFor(s.group).find((x) => x.id === id); if (!e) return null; return <a key={id} className="chip ext" href={e.url} target="_blank" rel="noopener noreferrer">{e.name}</a>; })}</div></div>}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
