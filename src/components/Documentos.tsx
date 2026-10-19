"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, Copy, Check, FileDown, FileText, Printer } from "lucide-react";
import { MODELOS_INDICE } from "@/lib/modelos-indice";
import { CATALOGO_MD, MODELOS_MD } from "@/lib/modelos-datos";
import { markdownAHtml } from "@/lib/markdown";
import { estacionesDe, paginaHtml } from "@/lib/modelos";
import { useSubPestana } from "@/lib/subpestana";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

const VISTAS = ["catalogo", ...MODELOS_INDICE.map((m) => m.codigo)];

function descargar(nombre: string, tipo: string, contenido: string) {
  const url = URL.createObjectURL(new Blob(["﻿", contenido], { type: tipo }));
  const a = document.createElement("a");
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Imprimir sin abrir ventanas (que los navegadores suelen bloquear): un iframe oculto con la página limpia del modelo.
function imprimir(html: string) {
  const f = document.createElement("iframe");
  f.setAttribute("aria-hidden", "true");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  const d = f.contentDocument;
  if (!d || !f.contentWindow) { f.remove(); return; }
  d.open(); d.write(html); d.close();
  const w = f.contentWindow;
  setTimeout(() => { w.focus(); w.print(); setTimeout(() => f.remove(), 2000); }, 200);
}

function Texto({ md, onModelo, sinTitulo }: { md: string; onModelo: (c: string) => void; sinTitulo?: boolean }) {
  const html = useMemo(() => markdownAHtml(md), [md]);
  return (
    <div className={"md" + (sinTitulo ? " md-sin-h1" : "")} dangerouslySetInnerHTML={{ __html: html }}
      onClick={(e) => { const a = (e.target as HTMLElement).closest("a[data-modelo]"); if (a) { e.preventDefault(); onModelo(a.getAttribute("data-modelo")!); } }} />
  );
}

function Catalogo({ abrir }: { abrir: (c: string) => void }) {
  return (
    <>
      <div className="grid gap-2">
        <h3 className="font-heading text-xl font-bold">Modelos para el grupo</h3>
        <p className="max-w-[68ch] text-sm text-muted-foreground">Doce modelos para los documentos que redacta el propio grupo. Cada uno dice quién lo usa y cuándo, qué exige la ley valenciana y trae un texto con campos por rellenar. Se pueden copiar, descargar para Word o imprimir.</p>
      </div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
        {MODELOS_INDICE.map((m) => (
          <button key={m.codigo} type="button" onClick={() => abrir(m.codigo)} className="grid cursor-pointer content-start gap-1 rounded-xl border bg-card p-3.5 text-left outline-none transition hover:border-primary hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/40">
            <span className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-widest text-primary"><FileText className="size-3.5" aria-hidden /> {m.codigo}</span>
            <span className="font-heading text-base font-bold leading-snug">{m.corto}</span>
            <span className="text-[12.5px] text-muted-foreground">{estacionesDe(m.codigo).length ? "Se usa en: " + estacionesDe(m.codigo).join(", ") : "Para todo el proceso"}</span>
          </button>
        ))}
      </div>
      <h3 className="mt-2 font-heading text-xl font-bold">Qué documentos hay en cada estación y quién los redacta</h3>
      <Card><Texto md={CATALOGO_MD} onModelo={abrir} sinTitulo /></Card>
    </>
  );
}

function Modelo({ codigo, volver, abrir }: { codigo: string; volver: () => void; abrir: (c: string) => void }) {
  const m = MODELOS_INDICE.find((x) => x.codigo === codigo)!;
  const md = MODELOS_MD[codigo];
  const [copiado, setCopiado] = useState<"si" | "no" | null>(null);
  const cuerpo = useMemo(() => markdownAHtml(md), [md]);
  const copiar = async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(md); ok = true; } catch {
      // Algunos navegadores deniegan el portapapeles: se prueba el método antiguo con un campo temporal.
      const t = document.createElement("textarea");
      t.value = md; t.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(t); t.select();
      try { ok = document.execCommand("copy"); } catch { /* sin respaldo */ }
      t.remove();
    }
    setCopiado(ok ? "si" : "no"); setTimeout(() => setCopiado(null), 2500);
  };
  const pagina = () => paginaHtml(`${m.codigo} · ${m.titulo}`, cuerpo);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={volver}><ArrowLeft aria-hidden /> Todos los documentos</Button>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={copiar}>{copiado === "si" ? <><Check aria-hidden /> Copiado</> : copiado === "no" ? "No se pudo copiar" : <><Copy aria-hidden /> Copiar texto</>}</Button>
          <Button size="sm" variant="outline" onClick={() => descargar(m.archivo.replace(/\.md$/, ".doc"), "application/msword;charset=utf-8", pagina())} title="Se abre en Word o en LibreOffice, listo para editar"><FileDown aria-hidden /> Para Word</Button>
          <Button size="sm" variant="outline" onClick={() => descargar(m.archivo, "text/markdown;charset=utf-8", md)}><FileDown aria-hidden /> Texto (.md)</Button>
          <Button size="sm" variant="outline" onClick={() => imprimir(pagina())}><Printer aria-hidden /> Imprimir</Button>
        </div>
      </div>
      <Card><Texto md={md} onModelo={abrir} /></Card>
      <p className="text-[13px] text-muted-foreground">Los campos entre corchetes <b>[ ]</b> son los que hay que rellenar o decidir. Este modelo es orientativo: antes de usarlo con efectos frente a terceras personas, que lo revise una persona abogada especializada en cooperativas.</p>
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="font-semibold text-muted-foreground">Otros modelos:</span>
        {MODELOS_INDICE.filter((x) => x.codigo !== codigo).map((x) => <button key={x.codigo} type="button" onClick={() => abrir(x.codigo)} className="cursor-pointer rounded-full border bg-card px-2.5 py-1 font-medium transition hover:border-primary hover:text-primary">{x.codigo} · {x.corto}</button>)}
      </div>
    </>
  );
}

export default function Documentos() {
  const [vista, irVista] = useSubPestana("docs", VISTAS, "catalogo", "sec-docs");
  const abrir = (c: string) => { irVista(c); window.scrollTo({ top: 0, behavior: "instant" }); };
  return (
    <section id="sec-docs" className="grid scroll-mt-16 gap-5">
      <div className="grid gap-1.5"><h2 className="font-heading text-2xl font-bold">Documentos y modelos</h2><p className="max-w-[68ch] text-muted-foreground">Los papeles que irán apareciendo en el proceso, quién redacta cada uno y modelos para los que redacta el propio grupo.</p></div>
      {vista === "catalogo" ? <Catalogo abrir={abrir} /> : <Modelo codigo={vista} volver={() => abrir("catalogo")} abrir={abrir} />}
    </section>
  );
}
