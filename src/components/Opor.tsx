"use client";
import { useRef, useState } from "react";
import { VIAS, CRIT, ES, ES_MIX, CHK, entitiesFor, isValenciaCity, tplText, type Entity } from "@/lib/content";
import { useStore, type Cand } from "@/lib/store";
import { eur } from "@/lib/format";
import { Rich } from "./Rich";
import LiveSearch from "./LiveSearch";
import PortalSearch from "./PortalSearch";
import { viviendasEstimadas } from "@/lib/fit";
import { catastroUrl, parseDireccion } from "@/lib/catastro";
import type { Listing } from "@/lib/parse-fotocasa";
import { Photos, MapBox } from "./Media";
import { ExternalLink, Calculator, Trash2, Plus, Mail, Copy, MapPin, FileSearch, Check, TriangleAlert, Search, Loader2, ClipboardList } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input, Textarea } from "./ui/input";
import { NativeSelect } from "./ui/select";
import { Field, FormGrid } from "./ui/field";
import { Checkbox } from "./ui/checkbox";
import { Alert } from "./ui/alert";
import { Disclosure } from "./ui/disclosure";
import { ToggleChips } from "./ui/toggle-chips";

const CASA47 = [
  { nombre: "VALENCIA-7-2026", zona: "Valencia/València", viv: 88, url: "https://portal.casa47.es/#/listado-convocatorias/1005" },
  { nombre: "CASTELLON-7-2026", zona: "Castellón/Castelló", viv: 157, url: "https://portal.casa47.es/#/listado-convocatorias/1004" },
  { nombre: "ALICANTE-7-2026", zona: "Alicante/Alacant", viv: 153, url: "https://portal.casa47.es/#/listado-convocatorias/1006" },
];
/** Sección aparte: no son oportunidades para la cooperativa, sino otra vía de acceso individual. */
function Casa47Socias({ intro }: { intro: React.ReactNode }) {
  return (
    <>
      {intro}
      <Card>
        <CardContent className="gap-3">
          <Alert variant="warning"><TriangleAlert aria-hidden /><span><b>No es una vía para la cooperativa.</b> Son sorteos de alquiler asequible para <b>particulares</b> que cumplan los requisitos. No dan suelo ni edificios a un grupo, no sirven para comprar ni para recibir en cesión de uso, y no se mezclan con los resultados de la búsqueda de edificios y terrenos.</span></Alert>
          <p className="text-sm text-muted-foreground">Cada persona se apunta por su cuenta, dentro de un plazo concreto, y la adjudicación es por sorteo. Lo normal es que no coincida con vuestro proyecto cooperativo, pero puede servir a quien del grupo necesite una solución de alquiler mientras tanto.</p>
          <ul className="grid gap-2">
            {CASA47.map((c) => (
              <li key={c.url} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span><b>{c.nombre}</b> · {c.zona} · {c.viv} viviendas</span>
                <a className="font-medium text-primary underline" href={c.url} target="_blank" rel="noopener noreferrer">Ver convocatoria ↗</a>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-muted-foreground">Datos leídos del portal el 10 de octubre de 2026: las tres convocatorias de la Comunitat Valenciana cerraron solicitudes el 21 de septiembre de 2026 y estaban «en evaluación». No se actualizan solas: consulta siempre el <a className="font-semibold text-primary underline" href="https://portal.casa47.es/#/listado-convocatorias" target="_blank" rel="noopener noreferrer">portal de convocatorias de Casa 47 ↗</a> y su <a className="font-semibold text-primary underline" href="https://portal.casa47.es/#/viviendas/listado" target="_blank" rel="noopener noreferrer">listado de viviendas ↗</a> (se puede filtrar por provincia).</p>
        </CardContent>
      </Card>
    </>
  );
}

function Vias({ onAdd }: { onAdd: (id: string) => void }) {
  const [sortK, setSortK] = useState("sum");
  const sorts: [string, string][] = [["sum", "Mejor equilibrio"], ...CRIT];
  const sc = (v: (typeof VIAS)[number]) => (sortK === "sum" ? v.s.c + v.s.r + v.s.z + v.s.l : v.s[sortK as "c"]);
  const list = VIAS.slice().sort((a, b) => sc(b) - sc(a) || VIAS.indexOf(a) - VIAS.indexOf(b));
  return (
    <>
      <div className="flex flex-wrap items-center gap-2"><span className="text-[13px] text-muted-foreground">Ordenar por</span><ToggleChips label="Ordenar vías" value={sortK} options={sorts as [string, string][]} onChange={setSortK} /></div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
        {list.map((v) => (
          <Card key={v.id} className="content-start">
            <CardHeader><span className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">{v.tag}</span><CardTitle>{v.title}</CardTitle></CardHeader>
            <CardContent className="gap-2.5">
              {CRIT.map((cr) => { const n = v.s[cr[0]]; return (
                <div className="grid grid-cols-[110px_1fr] items-center gap-2 text-[13px] text-muted-foreground" key={cr[0]}>
                  <span>{cr[1]}</span>
                  <span className="flex gap-1" role="img" aria-label={`${n} de 5`}>{[1, 2, 3, 4, 5].map((i) => <i key={i} className={"h-2 flex-1 rounded-full " + (i <= n ? "bg-primary" : "bg-secondary")} />)}</span>
                </div>); })}
            </CardContent>
            <Disclosure summary="Cómo funciona">
              <p className="text-sm"><Rich text={v.que} /></p>
              <div><div className="mb-1 text-xs font-semibold uppercase tracking-wider text-good">A favor</div><ul className="grid list-disc gap-1 pl-5 text-sm marker:text-good">{v.pro.map((x, i) => <li key={i}><Rich text={x} /></li>)}</ul></div>
              <div><div className="mb-1 text-xs font-semibold uppercase tracking-wider text-destructive">En contra</div><ul className="grid list-disc gap-1 pl-5 text-sm marker:text-destructive">{v.con.map((x, i) => <li key={i}><Rich text={x} /></li>)}</ul></div>
              <p className="text-[13px] text-muted-foreground"><b className="text-foreground">Para comprobar:</b> <Rich text={v.ver} /></p>
              {v.link?.map((k) => <p key={k.url} className="text-[13px] text-muted-foreground"><a className="font-semibold text-primary underline" href={k.url} target="_blank" rel="noopener noreferrer">{k.label} ↗</a> {k.nota}</p>)}
            </Disclosure>
            <div><Button size="sm" variant="outline" onClick={() => onAdd(v.id)}><Plus aria-hidden /> Apuntar un candidato de esta vía</Button></div>
          </Card>
        ))}
      </div>
    </>
  );
}

function CatastroLookup({ c, ciudad, onFound }: { c: Cand; ciudad: string; onFound: (ref: string) => void }) {
  const [st, setSt] = useState<{ loading?: boolean; msg?: string; opts?: { refcat: string; direccion: string }[] }>({});
  const posible = !!parseDireccion(c.direccion || "") && !!ciudad;
  const buscar = async () => {
    setSt({ loading: true });
    try {
      const r = await fetch("/api/catastro?" + new URLSearchParams({ direccion: c.direccion || "", municipio: ciudad }));
      const j = await r.json();
      if (!r.ok) return setSt({ msg: j.error === "demasiadas_peticiones" ? "Demasiadas consultas seguidas. Espera un rato." : j.error === "no_disponible" ? "El Catastro no ha respondido. Inténtalo más tarde." : "No he entendido la dirección. Escríbela como «Calle Colón 1»." });
      const p = (j.parcelas ?? []) as { refcat: string; direccion: string }[];
      if (p.length === 1) onFound(p[0].refcat);
      else if (p.length > 1) setSt({ opts: p });
      else setSt({ msg: "El Catastro no ha encontrado esa dirección. Si la conoces, pega la referencia catastral a mano." });
    } catch { setSt({ msg: "El Catastro no ha respondido. Inténtalo más tarde." }); }
  };
  return (
    <div className="grid gap-2 text-[13px] text-muted-foreground">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={!posible || st.loading} onClick={buscar} title={posible ? "Busca la referencia catastral de la dirección" : "Escribe la dirección como «Calle Colón 1» y pon la ciudad del grupo"}>{st.loading ? <><Loader2 className="animate-spin" aria-hidden /> Buscando…</> : <><FileSearch aria-hidden /> Buscar referencia catastral</>}</Button>
        {!posible && <span>Para buscarla, la dirección debe tener tipo de vía y número (por ejemplo «Calle Colón 1»).</span>}
      </div>
      {st.msg && <Alert variant="warning" role="alert"><TriangleAlert aria-hidden /><span>{st.msg}</span></Alert>}
      {st.opts && <div className="grid gap-1.5"><p>Hay varias parcelas con ese número. Elige la tuya:</p>{st.opts.map((o) => <Button key={o.refcat} size="sm" variant="outline" className="justify-start" onClick={() => onFound(o.refcat)}>{o.direccion} · {o.refcat}</Button>)}</div>}
    </div>
  );
}

function CandCard({ c, onSim }: { c: Cand; onSim: (c: Cand) => void }) {
  const { s, set } = useStore();
  const ciudad = s.group.ciudad.trim();
  const via = VIAS.find((v) => v.id === c.via), pv = c.precio > 0 && c.viv > 0 ? eur(c.precio / c.viv) : "—";
  const upd = (f: (x: Cand) => Cand) => set((s) => ({ ...s, cands: s.cands.map((x) => (x.id === c.id ? f(x) : x)) }));
  const n = CHK.filter((_, i) => c.chk && c.chk[i]).length;
  return (
    <Card className="content-start gap-3 p-4 shadow-none transition hover:shadow-md">
      <article className="grid gap-3">
        {c.ejemplo && <Badge variant="warning">Ejemplo, bórralo cuando quieras</Badge>}
        {c.fotos && c.fotos.length > 0 && <Photos fotos={c.fotos} alt={c.nombre} />}
        <div className="grid gap-1">
          <h4 className="font-heading text-base font-bold leading-snug [overflow-wrap:anywhere]">{c.nombre}</h4>
          <div className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">{via ? via.title : "—"}{c.barrio ? " · " + c.barrio : ""}</div>
        </div>
        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-secondary/60 p-2.5 text-center text-xs text-muted-foreground">
          <div><dt>Precio</dt><dd className="font-mono text-sm font-medium text-foreground">{c.precio > 0 ? eur(c.precio) : "—"}</dd></div>
          <div><dt>Viviendas</dt><dd className="font-mono text-sm font-medium text-foreground">{c.viv > 0 ? c.viv : "—"}</dd></div>
          <div><dt>Por vivienda</dt><dd className="font-mono text-sm font-medium text-foreground">{pv}</dd></div>
        </dl>
        <Field label="Estado" htmlFor={"est-" + c.id}>
          <NativeSelect id={"est-" + c.id} value={c.estado} onChange={(e) => upd((x) => ({ ...x, estado: e.target.value }))}>{ES.map((e) => <option key={e}>{e}</option>)}</NativeSelect>
        </Field>
        {c.notas && <p className="text-[13px] text-muted-foreground">{c.notas}</p>}
        {(c.direccion || (!c.ejemplo && c.barrio)) && <MapBox query={((c.direccion || c.nombre + " " + c.barrio) + " " + (ciudad || "")).trim()} refcat={c.refcat} />}
        {c.refcat && <p className="text-[13px] text-muted-foreground">Ref. catastral: <b className="select-all font-mono font-medium text-foreground">{c.refcat}</b>{catastroUrl(c.refcat) ? <> · <a className="font-medium text-primary underline-offset-2 hover:underline" href={catastroUrl(c.refcat)!} target="_blank" rel="noopener noreferrer">Abrir la ficha del edificio ↗</a></> : " · no parece una referencia válida (14 o 20 caracteres)"}</p>}
        {!c.refcat && c.direccion && <CatastroLookup c={c} ciudad={ciudad} onFound={(ref) => upd((x) => ({ ...x, refcat: ref }))} />}
        {((c.url && /^https:\/\//.test(c.url)) || (c.plano && /^https:\/\//.test(c.plano))) && (
          <div className="flex flex-wrap gap-3 text-[13px] font-medium">
            {c.url && /^https:\/\//.test(c.url) && <a className="inline-flex items-center gap-1 text-primary hover:underline" href={c.url} target="_blank" rel="noopener noreferrer">Ver anuncio <ExternalLink className="size-3.5" aria-hidden /></a>}
            {c.plano && /^https:\/\//.test(c.plano) && <a className="inline-flex items-center gap-1 text-primary hover:underline" href={c.plano} target="_blank" rel="noopener noreferrer">Plano o documentos <ExternalLink className="size-3.5" aria-hidden /></a>}
          </div>
        )}
        <Disclosure summary={`Comprobaciones (${n}/${CHK.length})`}>
          <div className="grid gap-1">{CHK.map((t, i) => <label key={i} className="flex cursor-pointer items-start gap-2.5 py-1 text-[13.5px]"><Checkbox className="mt-0.5" checked={!!(c.chk && c.chk[i])} onCheckedChange={(v) => upd((x) => ({ ...x, chk: { ...x.chk, [i]: v === true } }))} /> <span>{t}</span></label>)}</div>
        </Disclosure>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onSim(c)}><Calculator aria-hidden /> Simular en calculadora</Button>
          <Button size="sm" variant="ghost" onClick={() => set((s) => ({ ...s, cands: s.cands.filter((x) => x.id !== c.id) }))}><Trash2 aria-hidden /> Eliminar</Button>
        </div>
      </article>
    </Card>
  );
}

function CandForm({ viaRef, prefill }: { viaRef: React.RefObject<HTMLSelectElement | null>; prefill: Partial<Cand> | null }) {
  const { set } = useStore();
  const ref = useRef<HTMLFormElement>(null);
  return (
    <Card><form className="grid gap-4" id="candForm" ref={ref} key={prefill ? prefill.url ?? prefill.nombre : "f"} onSubmit={(e) => {
      e.preventDefault();
      const f = new FormData(e.currentTarget), g = (k: string) => String(f.get(k) ?? "");
      const url = g("url"), plano = g("plano"), foto = g("foto");
      set((s) => ({ ...s, cands: [{ id: "c" + Date.now(), nombre: g("nombre").trim(), barrio: g("barrio").trim(), via: g("via"), precio: parseFloat(g("precio")) || 0, viv: parseInt(g("viv"), 10) || 0, estado: g("estado"), notas: g("notas").trim(), url: /^https:\/\//.test(url) ? url : undefined, direccion: g("direccion").trim() || undefined, refcat: g("refcat").trim() || undefined, plano: /^https:\/\//.test(plano) ? plano : undefined, fotos: [...(prefill?.fotos ?? []), ...(/^https:\/\//.test(foto) ? [foto] : [])].slice(0, 6), chk: {} }, ...s.cands] }));
      ref.current?.reset();
    }}>
      <CardTitle>Añadir un candidato</CardTitle>
      <input type="hidden" name="url" defaultValue={prefill?.url ?? ""} />
      <FormGrid>
        <Field label="Nombre o dirección" htmlFor="cf-nombre"><Input id="cf-nombre" name="nombre" type="text" required autoComplete="off" defaultValue={prefill?.nombre} /></Field>
        <Field label="Barrio" htmlFor="cf-barrio"><Input id="cf-barrio" name="barrio" type="text" autoComplete="off" defaultValue={prefill?.barrio} /></Field>
        <Field label="Vía" htmlFor="cf-via"><NativeSelect id="cf-via" name="via" ref={viaRef} defaultValue={prefill?.via}>{VIAS.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}</NativeSelect></Field>
        <Field label="Precio o canon (€)" htmlFor="cf-precio"><Input id="cf-precio" name="precio" type="number" min={0} step={1000} inputMode="numeric" defaultValue={prefill?.precio || ""} /></Field>
        <Field label="Viviendas posibles" htmlFor="cf-viv"><Input id="cf-viv" name="viv" type="number" min={1} inputMode="numeric" /></Field>
        <Field label="Estado" htmlFor="cf-estado"><NativeSelect id="cf-estado" name="estado">{ES.map((e) => <option key={e}>{e}</option>)}</NativeSelect></Field>
      </FormGrid>
      <FormGrid>
        <Field label="Dirección (para el mapa)" htmlFor="cf-direccion"><Input id="cf-direccion" name="direccion" type="text" autoComplete="off" /></Field>
        <Field label="Referencia catastral" htmlFor="cf-refcat"><Input id="cf-refcat" name="refcat" type="text" autoComplete="off" /></Field>
        <Field label="Enlace a plano o documentos (https)" htmlFor="cf-plano"><Input id="cf-plano" name="plano" type="url" /></Field>
        <Field label="Enlace a una foto (https)" htmlFor="cf-foto"><Input id="cf-foto" name="foto" type="url" /></Field>
      </FormGrid>
      <Field label="Notas" htmlFor="cf-notas"><Textarea id="cf-notas" name="notas" rows={2} defaultValue={prefill?.notas} /></Field>
      <div><Button type="submit"><Plus aria-hidden /> Añadir a la lista</Button></div>
    </form></Card>
  );
}

function CopyBtn({ text, label, ghost }: { text: string; label: string; ghost?: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  return <Button size="sm" variant={ghost ? "outline" : "default"} onClick={async () => {
    try { await navigator.clipboard.writeText(text); setMsg("Copiado"); } catch { setMsg("Selecciona y copia"); }
    setTimeout(() => setMsg(null), 1500);
  }}>{msg ? <><Check aria-hidden />{msg}</> : <><Copy aria-hidden />{label}</>}</Button>;
}

function EntCard({ e }: { e: Entity }) {
  const { s } = useStore();
  const initial = e.tpl ? tplText(e.tpl, s.group) : "";
  const [edited, setEdited] = useState<string | null>(null);
  const text = edited ?? initial;
  return (
    <Card id={"ent-" + e.id} className="content-start gap-3">
      <article className="grid gap-3">
        <h4 className="font-heading text-[17px] font-bold">{e.name}</h4>
        <p className="text-sm">{e.desc}</p>
        {e.ct && <div className="grid gap-0.5 text-[13px] text-muted-foreground"><div>{e.ct.map((x, i) => <span key={i} className="select-all font-mono text-foreground [overflow-wrap:anywhere]">{i > 0 ? " · " : ""}{x}</span>)}</div>{e.ctn && <div>{e.ctn}</div>}</div>}
        <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" asChild><a href={e.url} target="_blank" rel="noopener noreferrer">{e.ul} <ExternalLink aria-hidden /></a></Button>{e.ct && <CopyBtn ghost text={e.ct[0]} label="Copiar correo" />}</div>
        {e.tpl && <Disclosure summary={<><Mail className="size-4" aria-hidden /> Mensaje listo para enviar</>}>
          <Textarea rows={12} className="text-[13.5px]" aria-label={"Mensaje para " + e.name} value={text} onChange={(ev) => setEdited(ev.target.value)} /><div><CopyBtn text={text} label="Copiar mensaje" /></div></Disclosure>}
      </article>
    </Card>
  );
}

export default function Opor() {
  const { s, set } = useStore();
  const viaRef = useRef<HTMLSelectElement>(null);
  const [prefill, setPrefill] = useState<Partial<Cand> | null>(null);
  const [mixed, setMixed] = useState(0);
  const cnt = ES.map((e) => s.cands.filter((c) => c.estado === e).length);
  const ENT = entitiesFor(s.group);
  const live = isValenciaCity(s.group);
  const gs: string[] = []; ENT.forEach((e) => { if (!gs.includes(e.g)) gs.push(e.g); });
  const toForm = (p: Partial<Cand>) => { setPrefill(p); setMixed((n) => n + 1); setTimeout(() => document.getElementById("candForm")?.scrollIntoView({ behavior: "smooth" }), 50); };
  const simular = (c: Cand) => {
    set((x) => ({ ...x, calc: c.precio > 0 ? { ...x.calc, suelo: c.precio } : x.calc, group: c.viv > 0 ? { ...x.group, fam: c.viv } : x.group, sim: { titulo: c.nombre, zona: c.barrio, foto: c.fotos?.find((f) => /^https:\/\//.test(f)), url: c.url } }));
    window.dispatchEvent(new CustomEvent("cami:goto", { detail: "calc" }));
  };
  const simularListing = (l: Listing, tipo: "edificios" | "terrenos") => {
    const v = viviendasEstimadas(l, tipo);
    set((x) => ({ ...x, calc: l.precio ? { ...x.calc, suelo: l.precio } : x.calc, group: v ? { ...x.group, fam: v } : x.group, sim: { titulo: l.titulo, zona: l.zona, foto: l.fotos?.find((f) => /^https:\/\//.test(f)), url: l.url, fuente: l.fuente } }));
    window.dispatchEvent(new CustomEvent("cami:goto", { detail: "calc" }));
  };
  const Intro = ({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) => (
    <div className="grid gap-1.5" id={id}><h2 className="font-heading text-2xl font-bold">{title}</h2><p className="max-w-[68ch] text-muted-foreground">{children}</p></div>
  );
  return (
    <section className="grid gap-5">
      <Intro id="buscador" title="Buscar edificios y terrenos">Indica en qué ciudad buscáis y usa los portales o, en la provincia de València, la búsqueda en vivo (función en pruebas).</Intro>
      <Card>
        <Field label={<><MapPin className="size-3.5" aria-hidden /> Ciudad o municipio donde buscáis</>} htmlFor="bs-ciudad">
          <Input id="bs-ciudad" type="text" autoComplete="off" placeholder="Por ejemplo, València" value={s.group.ciudad} onChange={(e) => { const v = e.target.value; set((x) => ({ ...x, group: { ...x.group, ciudad: v } })); }} />
        </Field>
        {live
          ? <p className="text-[13px] text-muted-foreground">Hay búsqueda en vivo para València: abajo tienes el botón <b className="text-foreground">Buscar en València</b>. Se actualiza como mucho una vez al día para no gastar recursos compartidos.</p>
          : s.group.ciudad.trim()
            ? <Alert variant="warning"><TriangleAlert aria-hidden /><span>La búsqueda en vivo es una función en pruebas y de momento solo cubre València, así que para <b>{s.group.ciudad.trim()}</b> no hay botón de búsqueda. Usa los botones de portales de aquí abajo: abren la búsqueda ya filtrada en cada portal.</span></Alert>
            : <Alert variant="warning"><TriangleAlert aria-hidden /><span>Escribe una ciudad para activar la búsqueda. Para València aparece la búsqueda en vivo; para el resto, los botones de portales.</span></Alert>}
      </Card>
      {live && <LiveSearch ciudad="valencia" onSim={simularListing} onPick={(l, tipo) => toForm({ fotos: l.fotos, nombre: l.titulo, barrio: l.zona, via: l.gestora ? "parada" : tipo === "terrenos" ? "privado" : "edificio", precio: l.precio ?? 0, url: l.url, notas: `Anuncio encontrado en ${l.fuente ?? "un portal"}.${l.gestora ? ` Lo publica ${l.gestora}, gestora de Sareb: pregunta si es de Sareb, de un banco o una cesión de remate.` : ""} Verifica todos los datos.` })} />}
      <PortalSearch ciudad={s.group.ciudad} />

      <Intro title="Cinco formas de conseguir techo">Una valoración orientativa de este asistente, basada en lo que se ha leído en prensa y guías del sector. No son datos medidos. Ordena según lo que más os importe.</Intro>
      <Vias onAdd={(id) => toForm({ via: id })} />

      <Intro id="candidatos" title="Vuestros candidatos">Apunta cada edificio o solar que encontréis, hazle seguimiento y mándalo a la calculadora con un toque. Las tarjetas marcadas como ejemplo se pueden borrar.</Intro>
      <Card>
        <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-widest text-muted-foreground"><ClipboardList className="size-3.5" aria-hidden /> Embudo de candidatos</div>
        <div className="grid grid-cols-6 gap-1">{ES.map((e, i) => (
          <div key={e} className="grid gap-1 text-center text-[11.5px] leading-tight text-muted-foreground">
            <i className="block h-2 rounded-full" style={{ background: i === 5 ? "color-mix(in srgb,var(--ink-3) 55%,var(--surface))" : `color-mix(in srgb,var(--accent) ${ES_MIX[i]}%,var(--surface-2))` }} />
            <b className="font-heading text-xl text-foreground">{cnt[i]}</b><span>{e}</span>
          </div>))}</div>
      </Card>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]">{s.cands.length ? s.cands.map((c) => <CandCard key={c.id} c={c} onSim={simular} />) : <p className="text-[13px] text-muted-foreground">Todavía no hay candidatos. Añade el primero con el formulario de abajo.</p>}</div>
      <CandForm key={mixed} viaRef={viaRef} prefill={prefill} />

      <Intro id="entidades" title="A quién preguntar y dónde mirar">Cada botón abre la web de la entidad en otra pestaña. Los mensajes ya llevan los datos de vuestro grupo; revísalos y envíalos tú.</Intro>
      <div className="grid gap-5">{gs.map((g) => <div key={g} className="grid gap-2.5"><h3 className="font-heading text-lg font-bold">{g}</h3><div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]">{ENT.filter((e) => e.g === g).map((e) => <EntCard key={e.id} e={e} />)}</div></div>)}</div>
      <Casa47Socias intro={<Intro id="socias" title="Para las personas socias: sorteos de alquiler de Casa 47">Otra forma de acceder a una vivienda, distinta de todo lo anterior.</Intro>} />
    </section>
  );
}
