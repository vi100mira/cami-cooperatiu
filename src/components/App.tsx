"use client";
import { useCallback, useEffect, useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { HelpCtx } from "./Rich";
import Sheet from "./Sheet";
import Ruta, { Hero } from "./Ruta";
import Calc from "./Calc";
import Opor from "./Opor";
import Glos from "./Glos";
import Faq from "./Faq";

const TABS: [string, string][] = [["ruta", "Ruta"], ["calc", "Calculadoras"], ["opor", "Oportunidades"], ["faq", "Preguntas"], ["glos", "Glosario"]];

function Shell() {
  const { s } = useStore();
  const [tab, setTab] = useState("ruta");
  const [term, setTerm] = useState<string | null>(null);
  const [from, setFrom] = useState<HTMLElement | null>(null);

  const scrollTo = (id: string) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  const go = useCallback((t: string, id?: string) => {
    setTab(t);
    try { history.replaceState(null, "", "#" + t); } catch {}
    if (id) scrollTo(id); else window.scrollTo({ top: 0 });
  }, []);
  useEffect(() => {
    const h = location.hash.slice(1);
    if (TABS.some((t) => t[0] === h)) setTab(h);
    const ev = (e: Event) => go((e as CustomEvent).detail, "cA");
    window.addEventListener("cami:goto", ev);
    return () => window.removeEventListener("cami:goto", ev);
  }, [go]);

  const help = useCallback((k: string, el?: HTMLElement) => { if (el) setFrom((f) => f ?? el); setTerm(k); }, []);
  const close = useCallback(() => { setTerm(null); setFrom((f) => { f?.focus?.(); return null; }); }, []);
  const goTo = (k: string) => { if (k === "calc") go("calc", "cA"); else if (k === "entidades") go("opor", "entidades"); else if (k === "candidatos") go("opor", "candidatos"); };

  return (
    <HelpCtx.Provider value={help}>
      <div className="wrap">
        <Hero s={s} />
        <nav className="tabs" aria-label="Secciones">
          {TABS.map(([k, l]) => <button key={k} type="button" aria-current={tab === k ? "page" : undefined} onClick={() => go(k)}>{l}</button>)}
        </nav>
        <main>
          {tab === "ruta" && <Ruta goTo={goTo} />}
          {tab === "calc" && <Calc />}
          {tab === "opor" && <Opor />}
          {tab === "faq" && <Faq />}
          {tab === "glos" && <Glos />}
        </main>
        <footer>
          <p>Techo Común es una guía de orientación sin ánimo de lucro. No es asesoría jurídica ni financiera: antes de firmar estatutos, préstamos o compras, consulta con una persona profesional y con una federación como Fecovi.</p>
          <p>Las cifras de las calculadoras son ejemplos editables. Los anuncios de la búsqueda en vivo proceden de un portal externo y pueden no estar actualizados. Las condiciones de cada concurso cambian; lee siempre sus bases.</p>
        </footer>
      </div>
      <Sheet term={term} onClose={close} onOpen={setTerm} />
    </HelpCtx.Provider>
  );
}

export default function App() { return <StoreProvider><Shell /></StoreProvider>; }
