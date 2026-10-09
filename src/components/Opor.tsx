"use client";
import { useRef, useState } from "react";
import { VIAS, CRIT, ES, ES_MIX, CHK, ENT, tplText } from "@/lib/content";
import { useStore, type Cand } from "@/lib/store";
import { eur } from "@/lib/format";
import { Rich } from "./Rich";
import LiveSearch from "./LiveSearch";

function Vias({ onAdd }: { onAdd: (id: string) => void }) {
  const [sortK, setSortK] = useState("sum");
  const sorts: [string, string][] = [["sum", "Mejor equilibrio"], ...CRIT];
  const sc = (v: (typeof VIAS)[number]) => (sortK === "sum" ? v.s.c + v.s.r + v.s.z + v.s.l : v.s[sortK as "c"]);
  const list = VIAS.slice().sort((a, b) => sc(b) - sc(a) || VIAS.indexOf(a) - VIAS.indexOf(b));
  return (
    <>
      <div className="chips" role="group" aria-label="Ordenar vías">
        <span className="note" style={{ alignSelf: "center" }}>Ordenar por</span>
        {sorts.map((x) => <button key={x[0]} type="button" className={"chip" + (x[0] === sortK ? " on" : "")} aria-pressed={x[0] === sortK} onClick={() => setSortK(x[0])}>{x[1]}</button>)}
      </div>
      <div className="vias">
        {list.map((v) => (
          <article key={v.id} className="card via">
            <header><span className="tag">{v.tag}</span><h3>{v.title}</h3></header>
            {CRIT.map((cr) => { const n = v.s[cr[0]]; return <div className="meter" key={cr[0]}><span>{cr[1]}</span><span className="pips" role="img" aria-label={`${n} de 5`}>{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}</span></div>; })}
            <details className="dd"><summary>Cómo funciona</summary>
              <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                <p><Rich text={v.que} /></p>
                <div><div className="sub">A favor</div><ul className="pro">{v.pro.map((x, i) => <li key={i}><Rich text={x} /></li>)}</ul></div>
                <div><div className="sub">En contra</div><ul className="con">{v.con.map((x, i) => <li key={i}><Rich text={x} /></li>)}</ul></div>
                <p className="note"><b>Para comprobar:</b> <Rich text={v.ver} /></p>
              </div></details>
            <div><button type="button" className="btn ghost sm" onClick={() => onAdd(v.id)}>Apuntar un candidato de esta vía</button></div>
          </article>
        ))}
      </div>
    </>
  );
}

function CandCard({ c, onSim }: { c: Cand; onSim: (c: Cand) => void }) {
  const { set } = useStore();
  const via = VIAS.find((v) => v.id === c.via), pv = c.precio > 0 && c.viv > 0 ? eur(c.precio / c.viv) : "—";
  const upd = (f: (x: Cand) => Cand) => set((s) => ({ ...s, cands: s.cands.map((x) => (x.id === c.id ? f(x) : x)) }));
  const n = CHK.filter((_, i) => c.chk && c.chk[i]).length;
  return (
    <article className="cand">
      {c.ejemplo && <span className="ex">Ejemplo, bórralo cuando quieras</span>}
      <h4>{c.nombre}</h4>
      <div className="tag">{via ? via.title : "—"}{c.barrio ? " · " + c.barrio : ""}</div>
      <div className="nums"><span>Precio <b>{c.precio > 0 ? eur(c.precio) : "—"}</b></span><span>Viviendas <b>{c.viv > 0 ? c.viv : "—"}</b></span><span>Por vivienda <b>{pv}</b></span></div>
      <div className="fld"><label className="lb" htmlFor={"est-" + c.id}>Estado</label>
        <select id={"est-" + c.id} value={c.estado} onChange={(e) => upd((x) => ({ ...x, estado: e.target.value }))}>{ES.map((e) => <option key={e}>{e}</option>)}</select></div>
      {c.notas && <p className="note">{c.notas}</p>}
      {c.url && /^https:\/\//.test(c.url) && <p className="note"><a href={c.url} target="_blank" rel="noopener noreferrer">Ver anuncio ↗</a></p>}
      <details className="dd"><summary>Comprobaciones ({n}/{CHK.length})</summary>
        <div className="chk">{CHK.map((t, i) => <label key={i}><input type="checkbox" checked={!!(c.chk && c.chk[i])} onChange={(e) => upd((x) => ({ ...x, chk: { ...x.chk, [i]: e.target.checked } }))} /> <span>{t}</span></label>)}</div></details>
      <div className="acts"><button type="button" className="btn sm" onClick={() => onSim(c)}>Simular en calculadora</button>
        <button type="button" className="btn ghost sm" onClick={() => set((s) => ({ ...s, cands: s.cands.filter((x) => x.id !== c.id) }))}>Eliminar</button></div>
    </article>
  );
}

function CandForm({ viaRef, prefill }: { viaRef: React.RefObject<HTMLSelectElement | null>; prefill: Partial<Cand> | null }) {
  const { set } = useStore();
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form className="card" id="candForm" ref={ref} key={prefill ? prefill.url ?? prefill.nombre : "f"} onSubmit={(e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget), g = (k: string) => String(f.get(k) ?? "");
      const url = g("url");
      set((s) => ({ ...s, cands: [{ id: "c" + Date.now(), nombre: g("nombre").trim(), barrio: g("barrio").trim(), via: g("via"), precio: parseFloat(g("precio")) || 0, viv: parseInt(g("viv"), 10) || 0, estado: g("estado"), notas: g("notas").trim(), url: /^https:\/\//.test(url) ? url : undefined, chk: {} }, ...s.cands] }));
      ref.current?.reset();
    }}>
      <h3>Añadir un candidato</h3>
      <input type="hidden" name="url" defaultValue={prefill?.url ?? ""} />
      <div className="form-g">
        <div className="fld"><label className="lb" htmlFor="cf-nombre">Nombre o dirección</label><input id="cf-nombre" name="nombre" type="text" required autoComplete="off" defaultValue={prefill?.nombre} /></div>
        <div className="fld"><label className="lb" htmlFor="cf-barrio">Barrio</label><input id="cf-barrio" name="barrio" type="text" autoComplete="off" defaultValue={prefill?.barrio} /></div>
        <div className="fld"><label className="lb" htmlFor="cf-via">Vía</label><select id="cf-via" name="via" ref={viaRef} defaultValue={prefill?.via}>{VIAS.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}</select></div>
        <div className="fld"><label className="lb" htmlFor="cf-precio">Precio o canon (€)</label><input id="cf-precio" name="precio" type="number" min={0} step={1000} inputMode="numeric" defaultValue={prefill?.precio || ""} /></div>
        <div className="fld"><label className="lb" htmlFor="cf-viv">Viviendas posibles</label><input id="cf-viv" name="viv" type="number" min={1} inputMode="numeric" /></div>
        <div className="fld"><label className="lb" htmlFor="cf-estado">Estado</label><select id="cf-estado" name="estado">{ES.map((e) => <option key={e}>{e}</option>)}</select></div>
      </div>
      <div className="fld"><label className="lb" htmlFor="cf-notas">Notas</label><textarea id="cf-notas" name="notas" rows={2} defaultValue={prefill?.notas} /></div>
      <div><button className="btn" type="submit">Añadir a la lista</button></div>
    </form>
  );
}

function CopyBtn({ text, label, ghost }: { text: string; label: string; ghost?: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  return <button type="button" className={"btn sm" + (ghost ? " ghost" : "")} onClick={async () => {
    try { await navigator.clipboard.writeText(text); setMsg("Copiado"); } catch { setMsg("Selecciona y copia"); }
    setTimeout(() => setMsg(null), 1500);
  }}>{msg ?? label}</button>;
}

function EntCard({ e }: { e: (typeof ENT)[number] }) {
  const { s } = useStore();
  const initial = e.tpl ? tplText(e.tpl, s.group) : "";
  const [edited, setEdited] = useState<string | null>(null);
  const text = edited ?? initial;
  return (
    <article className="card ent" id={"ent-" + e.id}>
      <h4 style={{ font: "700 17px var(--font-display)" }}>{e.name}</h4>
      <p>{e.desc}</p>
      {e.ct && <div className="ct"><div>{e.ct.map((x, i) => <span key={i}>{i > 0 ? " · " : ""}{x}</span>)}</div>{e.ctn && <div>{e.ctn}</div>}</div>}
      <div className="btns"><a className="btn ghost sm" href={e.url} target="_blank" rel="noopener noreferrer">{e.ul} ↗</a>{e.ct && <CopyBtn ghost text={e.ct[0]} label="Copiar correo" />}</div>
      {e.tpl && <details className="dd"><summary>Mensaje listo para enviar</summary>
        <div className="fld" style={{ marginTop: 8 }}><textarea rows={12} aria-label={"Mensaje para " + e.name} value={text} onChange={(ev) => setEdited(ev.target.value)} /><div><CopyBtn text={text} label="Copiar mensaje" /></div></div></details>}
    </article>
  );
}

export default function Opor() {
  const { s, set } = useStore();
  const viaRef = useRef<HTMLSelectElement>(null);
  const [prefill, setPrefill] = useState<Partial<Cand> | null>(null);
  const [mixed, setMixed] = useState(0);
  const cnt = ES.map((e) => s.cands.filter((c) => c.estado === e).length);
  const gs: string[] = []; ENT.forEach((e) => { if (!gs.includes(e.g)) gs.push(e.g); });
  const toForm = (p: Partial<Cand>) => { setPrefill(p); setMixed((n) => n + 1); setTimeout(() => document.getElementById("candForm")?.scrollIntoView({ behavior: "smooth" }), 50); };
  const simular = (c: Cand) => {
    set((x) => ({ ...x, calc: c.precio > 0 ? { ...x.calc, suelo: c.precio } : x.calc, group: c.viv > 0 ? { ...x.group, fam: c.viv } : x.group }));
    window.dispatchEvent(new CustomEvent("cami:goto", { detail: "calc" }));
  };
  return (
    <section className="view">
      <div className="intro"><h2>Cinco formas de conseguir techo</h2><p>Una valoración orientativa de este asistente, basada en lo que se ha leído en prensa y guías del sector. No son datos medidos. Ordena según lo que más os importe.</p></div>
      <Vias onAdd={(id) => toForm({ via: id })} />

      <div className="intro" id="buscador"><h2>Buscar en vivo</h2><p>Edificios y terrenos en venta en València. Los resultados se actualizan como mucho una vez al día para no gastar recursos compartidos.</p></div>
      <LiveSearch onPick={(l, tipo) => toForm({ nombre: l.titulo + (l.zona ? " · " + l.zona : ""), barrio: l.zona, via: tipo === "terrenos" ? "privado" : "edificio", precio: l.precio ?? 0, url: l.url, notas: "Anuncio encontrado en Fotocasa. Verifica todos los datos." })} />

      <div className="intro" id="candidatos"><h2>Vuestros candidatos</h2><p>Apunta cada edificio o solar que encontréis, hazle seguimiento y mándalo a la calculadora con un toque. Las tarjetas marcadas como ejemplo se pueden borrar.</p></div>
      <div className="card"><div className="eyebrow">Embudo de candidatos</div>
        <div className="pipe">{ES.map((e, i) => <div key={e}><i style={{ background: i === 5 ? "color-mix(in srgb,var(--ink-3) 55%,var(--surface))" : `color-mix(in srgb,var(--accent) ${ES_MIX[i]}%,var(--surface-2))` }} /><b>{cnt[i]}</b><span>{e}</span></div>)}</div></div>
      <div className="cands">{s.cands.length ? s.cands.map((c) => <CandCard key={c.id} c={c} onSim={simular} />) : <p className="note">Todavía no hay candidatos. Añade el primero con el formulario de abajo.</p>}</div>
      <CandForm key={mixed} viaRef={viaRef} prefill={prefill} />

      <div className="intro" id="entidades"><h2>A quién preguntar y dónde mirar</h2><p>Cada botón abre la web de la entidad en otra pestaña. Los mensajes ya llevan los datos de vuestro grupo; revísalos y envíalos tú.</p></div>
      <div style={{ display: "grid", gap: 18 }}>{gs.map((g) => <div key={g}><h3>{g}</h3><div className="ents" style={{ marginTop: 10 }}>{ENT.filter((e) => e.g === g).map((e) => <EntCard key={e.id} e={e} />)}</div></div>)}</div>
    </section>
  );
}
