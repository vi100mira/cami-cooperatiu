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
import { Route, Calculator, Building2, CircleHelp, BookOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

const TABS: [string, string][] = [["ruta", "Ruta"], ["calc", "Calculadoras"], ["opor", "Oportunidades"], ["faq", "Preguntas"], ["glos", "Glosario"]];
const ICONS: Record<string, React.ReactNode> = { ruta: <Route aria-hidden />, calc: <Calculator aria-hidden />, opor: <Building2 aria-hidden />, faq: <CircleHelp aria-hidden />, glos: <BookOpen aria-hidden /> };

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
        <Tabs value={tab} onValueChange={(v) => go(v)} className="min-w-0 sticky top-[env(safe-area-inset-top,0px)] z-20 -mx-4 border-b bg-background/90 px-4 py-2 backdrop-blur">
          <TabsList aria-label="Secciones">
            {TABS.map(([k, l]) => <TabsTrigger key={k} value={k}>{ICONS[k]}{l}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <main>
          {tab === "ruta" && <Ruta goTo={goTo} />}
          {tab === "calc" && <Calc />}
          {tab === "opor" && <Opor />}
          {tab === "faq" && <Faq />}
          {tab === "glos" && <Glos />}
        </main>
        <footer className="site-foot">
          <div className="sf-brand"><b>Techo Común</b><span>Guía de vivienda cooperativa en cesión de uso. Sin ánimo de lucro.</span></div>
          <div className="sf-cols">
            <p><b>Orientación, no asesoría.</b> No es asesoría jurídica ni financiera: antes de firmar estatutos, préstamos o compras, consulta con una persona profesional y con una federación como Fecovi.</p>
            <p><b>Datos orientativos.</b> Las cifras de las calculadoras son ejemplos editables. Los anuncios de la búsqueda en vivo proceden de portales externos y pueden no estar actualizados. Las condiciones de cada concurso cambian: lee siempre sus bases.</p>
          </div>
        </footer>
      </div>
      <Sheet term={term} onClose={close} onOpen={setTerm} />
    </HelpCtx.Provider>
  );
}

export default function App() { return <StoreProvider><Shell /></StoreProvider>; }
