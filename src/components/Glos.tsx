"use client";
import { useState } from "react";
import { TERMS, SRC } from "@/lib/content";
import { norm, plain } from "@/lib/format";
import { Rich } from "./Rich";

export default function Glos() {
  const [q, setQ] = useState("");
  const nq = norm(q);
  const keys = Object.keys(TERMS).sort((a, b) => TERMS[a].t.localeCompare(TERMS[b].t, "es")).filter((k) => !nq || norm(TERMS[k].t + " " + plain(TERMS[k].d)).includes(nq));
  return (
    <section className="view">
      <div className="intro"><h2>Glosario</h2><p>Todo el vocabulario de la ruta, en lenguaje llano.</p></div>
      <div className="fld"><label className="lb" htmlFor="gl-q">Buscar un término</label><input id="gl-q" type="text" autoComplete="off" placeholder="Escribe, por ejemplo, superficie" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="gl-list">
        {keys.length ? keys.map((k) => { const t = TERMS[k]; return (
          <details className="gl" key={k}><summary>{t.t}</summary><div className="gb">{t.d.split("\n\n").map((p, i) => <p key={i}><Rich text={p} /></p>)}{t.link && <p><a href={t.link[1]} target="_blank" rel="noopener noreferrer">{t.link[0]} ↗</a></p>}</div></details>
        ); }) : <p className="note">Ningún término coincide con esa búsqueda.</p>}
      </div>
      <div className="card"><h3>De dónde sale la información</h3><ul className="src">{SRC.map((x) => <li key={x[1]}><a href={x[1]} target="_blank" rel="noopener noreferrer">{x[0]}</a></li>)}</ul></div>
    </section>
  );
}
