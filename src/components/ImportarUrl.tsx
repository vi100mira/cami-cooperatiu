"use client";
import { useState } from "react";
import type { Listing } from "@/lib/parse-fotocasa";
import type { Importado } from "@/lib/store";
import { parseFicha, zonaDeTitulo } from "@/lib/parse-ficha";
import { Link2, Loader2, TriangleAlert, Plus, X, ClipboardPaste } from "lucide-react";
import { Button } from "./ui/button";
import { Input, Textarea } from "./ui/input";
import { Field, FormGrid } from "./ui/field";
import { Alert } from "./ui/alert";
import { ToggleChips } from "./ui/toggle-chips";

type Tipo = "edificios" | "terrenos";

const PORTALES = "Idealista, Fotocasa, Pisos.com o yaencontre";
const MSG: Record<string, string> = {
  url_invalida: "Eso no parece un enlace válido. Cópialo entero desde la barra de direcciones del navegador.",
  portal_no_admitido: `De momento solo se pueden leer enlaces de ${PORTALES}.`,
  ficha_bloqueada: "Idealista no deja leer automáticamente la ficha de un anuncio suelto. Dos opciones: pega el enlace de una búsqueda de Idealista (la lista de resultados sí se puede leer y trae precio, m² y zona de cada anuncio) o rellena abajo los datos de este anuncio.",
  desactivada: "La lectura de enlaces está apagada ahora mismo (comparte el límite de la búsqueda en vivo). Rellena abajo los datos del anuncio y se añadirá igual.",
  limite_diario: "Se ha alcanzado el límite diario de lecturas, compartido entre todas las personas que prueban la app. Rellena abajo los datos del anuncio o vuelve a probar mañana.",
  demasiadas_peticiones: "Has hecho demasiadas consultas seguidas desde tu conexión. Espera un rato o rellena los datos abajo.",
  sin_anuncios: "Hemos leído la página, pero no hemos encontrado anuncios con precio o metros. Si es una ficha, rellena abajo sus datos.",
  no_disponible: "El portal no ha respondido o no deja leer esta página. Rellena abajo los datos del anuncio.",
};
const nombrePortal = (url: string) => {
  try { const h = new URL(url).hostname; return h.includes("idealista") ? "Idealista" : h.includes("fotocasa") ? "Fotocasa" : h.includes("pisos.com") ? "Pisos.com" : h.includes("yaencontre") ? "yaencontre" : h.replace(/^www\./, ""); }
  catch { return "Anuncio"; }
};
const tipoDe = (url: string): Tipo => (/terreno|solar|suelo|parcela/i.test(url) ? "terrenos" : "edificios");
const numero = (x: string) => { const n = parseFloat(x.replace(/\./g, "").replace(",", ".")); return Number.isFinite(n) && n > 0 ? Math.round(n) : null; };

export function ImportarUrl({ importados, onAdd, onRemove }: { importados: Importado[]; onAdd: (i: Importado) => void; onRemove: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [tipo, setTipo] = useState<Tipo>("edificios");
  const [cargando, setCargando] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [texto, setTexto] = useState("");
  const [f, setF] = useState({ titulo: "", precio: "", m2: "", zona: "" });

  const cambiarUrl = (v: string) => { setUrl(v); setTipo(tipoDe(v)); setErr(null); setOk(null); };
  const leer = async () => {
    setCargando(true); setErr(null); setOk(null);
    try {
      const r = await fetch("/api/importar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), tipo }) });
      const j = await r.json();
      if (r.ok) {
        onAdd({ url: j.url, tipo: j.tipo, fuente: j.fuente, actualizado: j.actualizado, items: j.items });
        setOk(`${j.items.length} ${j.items.length === 1 ? "anuncio añadido" : "anuncios añadidos"} desde ${j.fuente}. Aparecen en la lista de abajo, con los mismos filtros, la calculadora y los candidatos.`);
        setManual(false);
      } else {
        setErr(MSG[j.error] ?? MSG.no_disponible);
        if (j.error !== "url_invalida" && j.error !== "portal_no_admitido") setManual(true);
      }
    } catch { setErr(MSG.no_disponible); setManual(true); }
    setCargando(false);
  };
  const rellenarDesdeTexto = () => {
    const d = parseFicha(texto);
    setF((x) => ({ titulo: d.titulo ?? x.titulo, precio: d.precio ? String(d.precio) : x.precio, m2: d.m2 ? String(d.m2) : x.m2, zona: x.zona || (d.titulo ? zonaDeTitulo(d.titulo) : "") }));
  };
  const precio = numero(f.precio), m2 = numero(f.m2);
  const anadirManual = () => {
    const u = url.trim().replace(/^http:\/\//i, "https://");
    const fuente = nombrePortal(u);
    const id = "manual-" + (u.match(/(\d{6,})/)?.[1] ?? Date.now().toString(36));
    const d = texto ? parseFicha(texto) : null;
    const l: Listing = { id, titulo: f.titulo.trim() || `Anuncio de ${fuente}`, url: u, precio, m2, zona: f.zona.trim(), resumen: d?.resumen ?? "", fotos: d?.fotos ?? [], fuente };
    onAdd({ url: u, tipo, fuente: fuente + " (a mano)", actualizado: new Date().toISOString(), items: [l], aMano: true });
    setOk("Anuncio añadido a la lista de abajo. Revisa los datos en el anuncio original.");
    setErr(null); setManual(false); setTexto(""); setF({ titulo: "", precio: "", m2: "", zona: "" });
  };
  const urlValida = /^https?:\/\/\S+\.\S+/.test(url.trim());

  return (
    <div className="grid gap-3 rounded-lg border px-3.5 py-3">
      <div className="grid gap-1">
        <div className="flex items-center gap-1.5 font-heading text-sm font-bold"><Link2 className="size-4" aria-hidden /> Añadir desde un enlace</div>
        <p className="text-[13px] text-muted-foreground">Pega una búsqueda o un anuncio de {PORTALES}. Una búsqueda con tus filtros trae todos sus anuncios; un anuncio suelto, solo ese. Cada enlace se lee como mucho una vez al día.</p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Enlace" htmlFor="imp-url" className="min-w-[240px] flex-1"><Input id="imp-url" type="url" inputMode="url" autoComplete="off" placeholder="https://www.idealista.com/venta-edificios/…" value={url} onChange={(e) => cambiarUrl(e.target.value)} /></Field>
        <Button disabled={!urlValida || cargando} onClick={leer}>{cargando ? <><Loader2 className="animate-spin" aria-hidden /> Leyendo…</> : <>Leer enlace</>}</Button>
      </div>
      <ToggleChips label="Qué hay en el enlace" value={tipo} options={[["edificios", "Edificios"], ["terrenos", "Terrenos"]]} onChange={setTipo} />
      {err && <Alert variant="warning" role="alert"><TriangleAlert aria-hidden /><span>{err}</span></Alert>}
      {ok && <p className="rounded-lg bg-accent px-3 py-2 text-[13px]" role="status">{ok}</p>}
      {!manual && urlValida && !cargando && <button type="button" className="justify-self-start text-[13px] text-primary underline" onClick={() => setManual(true)}>Prefiero escribir los datos a mano</button>}
      {manual && (
        <div className="grid gap-3 rounded-lg bg-accent px-3 py-3">
          <Field label={<><ClipboardPaste className="size-3.5" aria-hidden /> Texto del anuncio (opcional): selecciónalo en la web del portal, cópialo y pégalo aquí</>} htmlFor="imp-texto">
            <Textarea id="imp-texto" rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={"Edificio en Calle …, València\n980.000 €\n456 m² construidos"} />
          </Field>
          <div><Button size="sm" variant="outline" disabled={!texto.trim()} onClick={rellenarDesdeTexto}>Rellenar desde el texto</Button></div>
          <FormGrid>
            <Field label="Título" htmlFor="imp-tit"><Input id="imp-tit" value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Edificio en …" /></Field>
            <Field label="Precio (€)" htmlFor="imp-pre"><Input id="imp-pre" inputMode="numeric" value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} /></Field>
            <Field label="Superficie (m² construidos)" htmlFor="imp-m2"><Input id="imp-m2" inputMode="numeric" value={f.m2} onChange={(e) => setF({ ...f, m2: e.target.value })} /></Field>
            <Field label="Municipio o barrio" htmlFor="imp-zona"><Input id="imp-zona" value={f.zona} onChange={(e) => setF({ ...f, zona: e.target.value })} placeholder="Russafa, València" /></Field>
          </FormGrid>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={!urlValida || (!precio && !m2)} onClick={anadirManual}><Plus aria-hidden /> Añadir a la lista</Button>
            {!urlValida && <span className="text-[13px] text-muted-foreground">Pega arriba el enlace del anuncio para poder volver a él.</span>}
            {urlValida && !precio && !m2 && <span className="text-[13px] text-muted-foreground">Hace falta al menos el precio o los m².</span>}
          </div>
        </div>
      )}
      {!!importados.length && (
        <div className="grid gap-1.5">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Tus enlaces</div>
          <ul className="grid gap-1">
            {importados.map((i) => (
              <li key={i.url} className="flex items-center justify-between gap-2 text-[13px]">
                <a className="min-w-0 truncate text-primary underline" href={i.url} target="_blank" rel="noopener noreferrer" title={i.url}>{i.fuente} · {i.items.length} {i.items.length === 1 ? "anuncio" : "anuncios"} · {i.tipo}</a>
                <Button size="sm" variant="ghost" aria-label={`Quitar ${i.fuente}`} onClick={() => onRemove(i.url)}><X aria-hidden /></Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
