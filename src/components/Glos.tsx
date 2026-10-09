"use client";
import { useState } from "react";
import { TERMS, SRC } from "@/lib/content";
import { norm, plain } from "@/lib/format";
import { Rich } from "./Rich";
import { Search, ExternalLink } from "lucide-react";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Disclosure } from "./ui/disclosure";
import { Field } from "./ui/field";

export default function Glos() {
  const [q, setQ] = useState("");
  const nq = norm(q);
  const keys = Object.keys(TERMS).sort((a, b) => TERMS[a].t.localeCompare(TERMS[b].t, "es")).filter((k) => !nq || norm(TERMS[k].t + " " + plain(TERMS[k].d)).includes(nq));
  return (
    <section className="grid gap-5">
      <div className="grid gap-1.5"><h2 className="font-heading text-2xl font-bold">Glosario</h2><p className="max-w-[68ch] text-muted-foreground">Todo el vocabulario de la ruta, en lenguaje llano.</p></div>
      <Field label={<><Search className="size-3.5" aria-hidden /> Buscar un término</>} htmlFor="gl-q"><Input id="gl-q" type="text" autoComplete="off" placeholder="Escribe, por ejemplo, superficie" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
      <div className="grid gap-2">
        {keys.length ? keys.map((k) => { const t = TERMS[k]; return (
          <Disclosure key={k} className="bg-card py-1" summary={<span className="font-heading text-[15.5px] font-bold text-foreground">{t.t}</span>}>
            <div className="grid max-w-[70ch] gap-2 text-sm text-muted-foreground">{t.d.split("\n\n").map((p, i) => <p key={i}><Rich text={p} /></p>)}{t.link && <p><a className="inline-flex items-center gap-1 font-medium text-primary hover:underline" href={t.link[1]} target="_blank" rel="noopener noreferrer">{t.link[0]} <ExternalLink className="size-3.5" aria-hidden /></a></p>}</div>
          </Disclosure>
        ); }) : <p className="text-[13px] text-muted-foreground">Ningún término coincide con esa búsqueda.</p>}
      </div>
      <Card><h3 className="font-heading text-lg font-bold">De dónde sale la información</h3><ul className="grid list-disc gap-1.5 pl-5 text-sm">{SRC.map((x) => <li key={x[1]}><a className="text-primary hover:underline" href={x[1]} target="_blank" rel="noopener noreferrer">{x[0]}</a></li>)}</ul></Card>
    </section>
  );
}
