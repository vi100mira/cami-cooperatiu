"use client";
import { useState } from "react";
import { FAQ, FAQ_GRUPOS } from "@/lib/faq";
import { norm, plain } from "@/lib/format";
import { Rich } from "./Rich";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Disclosure } from "./ui/disclosure";
import { Field } from "./ui/field";

export default function Faq() {
  const [q, setQ] = useState("");
  const nq = norm(q);
  const items = FAQ.filter((f) => !nq || norm(f.q + " " + plain(f.a)).includes(nq));
  return (
    <section className="grid gap-5">
      <div className="grid gap-1.5"><h2 className="font-heading text-2xl font-bold">Preguntas frecuentes</h2><p className="max-w-[68ch] text-muted-foreground">Dudas habituales sobre financiación, salida, herencia y plazos en una cooperativa en cesión de uso. Son respuestas orientativas sobre el modelo habitual: los estatutos de tu cooperativa y las condiciones de cada entidad mandan.</p></div>
      <Field label={<><Search className="size-3.5" aria-hidden /> Buscar en las preguntas</>} htmlFor="fq-q"><Input id="fq-q" type="text" autoComplete="off" placeholder="Escribe, por ejemplo, aval" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
      {items.length ? FAQ_GRUPOS.map((g) => { const its = items.filter((f) => f.g === g); return its.length ? (
        <div key={g} className="grid gap-2.5"><h3 className="font-heading text-lg font-bold">{g}</h3>
          <div className="grid gap-2">
            {its.map((f) => (
              <Disclosure key={f.q} className="bg-card py-1" summary={<span className="font-heading text-[15.5px] font-bold text-foreground">{f.q}</span>}>
                <div className="grid max-w-[70ch] gap-2 text-sm text-muted-foreground">{f.a.split("\n\n").map((p, i) => <p key={i}><Rich text={p} /></p>)}</div>
              </Disclosure>
            ))}
          </div>
        </div>) : null; }) : <p className="text-[13px] text-muted-foreground">Ninguna pregunta coincide con esa búsqueda.</p>}
      <Card><p className="text-[13px] text-muted-foreground">¿Tienes otra duda? Una federación de cooperativas de vivienda (en la Comunitat Valenciana, Fecovi) y entidades como Sostre Cívic publican guías y estatutos modelo, y una persona profesional puede revisar vuestro caso. Esto no es asesoría jurídica ni financiera.</p></Card>
    </section>
  );
}
