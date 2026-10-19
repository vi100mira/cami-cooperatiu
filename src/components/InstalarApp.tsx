"use client";
import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { esIOS } from "@/lib/instalar";

// El evento que el navegador ofrece para mostrar su propio cuadro de instalación (Chrome, Edge, Android).
interface EventoInstalar extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

const yaInstalada = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
const detectarIOS = () => esIOS(navigator.userAgent, navigator.maxTouchPoints);

/** Botón para instalar la aplicación. No aparece si ya está instalada ni si el navegador no permite instalarla. */
export function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [ios, setIos] = useState(false);
  const [oculto, setOculto] = useState(true);
  const [ayuda, setAyuda] = useState(false);

  useEffect(() => {
    if (yaInstalada()) return;
    setOculto(false);
    setIos(detectarIOS());
    const alOfrecer = (e: Event) => { e.preventDefault(); setEvento(e as EventoInstalar); };
    const alInstalar = () => { setEvento(null); setOculto(true); };
    window.addEventListener("beforeinstallprompt", alOfrecer);
    window.addEventListener("appinstalled", alInstalar);
    return () => { window.removeEventListener("beforeinstallprompt", alOfrecer); window.removeEventListener("appinstalled", alInstalar); };
  }, []);

  if (oculto || (!evento && !ios)) return null;
  const boton = "inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground outline-none transition hover:border-primary hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/40";
  if (evento) {
    return (
      <button type="button" className={boton} title="Instala la aplicación en este dispositivo"
        onClick={async () => { await evento.prompt(); const r = await evento.userChoice; if (r.outcome === "accepted") setOculto(true); setEvento(null); }}>
        <Download className="size-3.5" aria-hidden /> Instalar la aplicación
      </button>
    );
  }
  return (
    <div className="grid gap-2">
      <button type="button" className={boton} aria-expanded={ayuda} onClick={() => setAyuda((a) => !a)}><Download className="size-3.5" aria-hidden /> Instalar en el iPhone</button>
      {ayuda && (
        <div role="note" className="relative max-w-[34ch] rounded-lg border bg-card p-3 pr-8 text-[13px] text-muted-foreground">
          <button type="button" aria-label="Cerrar" onClick={() => setAyuda(false)} className="absolute right-1.5 top-1.5 grid size-6 cursor-pointer place-items-center rounded-full hover:bg-accent"><X className="size-3.5" aria-hidden /></button>
          En Safari, pulsa <Share className="mx-0.5 inline size-3.5 align-text-bottom" aria-hidden /> <b className="text-foreground">Compartir</b> y después <b className="text-foreground">«Añadir a pantalla de inicio»</b>.
        </div>
      )}
    </div>
  );
}
