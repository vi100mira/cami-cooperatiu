"use client";
import { useState } from "react";
import { FAQ, FAQ_GRUPOS } from "@/lib/faq";
import { norm, plain } from "@/lib/format";
import { Rich } from "./Rich";

export default function Faq() {
  const [q, setQ] = useState("");
  const nq = norm(q);
  const items = FAQ.filter((f) => !nq || norm(f.q + " " + plain(f.a)).includes(nq));
  return (
    <section className="view">
      <div className="intro"><h2>Preguntas frecuentes</h2><p>Dudas habituales sobre financiación, salida, herencia y plazos en una cooperativa en cesión de uso. Son respuestas orientativas sobre el modelo habitual: los estatutos de tu cooperativa y las condiciones de cada entidad mandan.</p></div>
      <div className="fld"><label className="lb" htmlFor="fq-q">Buscar en las preguntas</label><input id="fq-q" type="text" autoComplete="off" placeholder="Escribe, por ejemplo, aval" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {items.length ? FAQ_GRUPOS.map((g) => { const its = items.filter((f) => f.g === g); return its.length ? (
        <div key={g}><h3>{g}</h3>
          <div className="gl-list" style={{ marginTop: 10 }}>
            {its.map((f) => (
              <details className="gl" key={f.q}><summary>{f.q}</summary><div className="gb">{f.a.split("\n\n").map((p, i) => <p key={i}><Rich text={p} /></p>)}</div></details>
            ))}
          </div>
        </div>) : null; }) : <p className="note">Ninguna pregunta coincide con esa búsqueda.</p>}
      <div className="card"><p className="note">¿Tienes otra duda? Una federación de cooperativas de vivienda (en la Comunitat Valenciana, Fecovi) y entidades como Sostre Cívic publican guías y estatutos modelo, y una persona profesional puede revisar vuestro caso. Esto no es asesoría jurídica ni financiera.</p></div>
    </section>
  );
}
