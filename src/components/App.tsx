"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { StoreProvider, useStore } from "@/lib/store";
import { GrupoProvider, useGrupo } from "@/lib/grupo";
import { SyncDatosGrupo } from "./SyncDatosGrupo";
import { HelpCtx } from "./Rich";
import Sheet from "./Sheet";
import Ruta, { Hero } from "./Ruta";
import Calc from "./Calc";
import Opor from "./Opor";
import Grupo from "./Grupo";
import Glos from "./Glos";
import Faq from "./Faq";
import { Route, Calculator, Building2, CircleHelp, BookOpen, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

const TABS: [string, string][] = [["ruta", "Ruta"], ["calc", "Calculadoras"], ["opor", "Oportunidades"], ["grupo", "Grupo"], ["faq", "Preguntas"], ["glos", "Glosario"]];
const ICONS: Record<string, React.ReactNode> = { ruta: <Route aria-hidden />, calc: <Calculator aria-hidden />, opor: <Building2 aria-hidden />, grupo: <Users aria-hidden />, faq: <CircleHelp aria-hidden />, glos: <BookOpen aria-hidden /> };

function Shell() {
  const { s, set } = useStore();
  const [tab, setTab] = useState("ruta");
  const [term, setTerm] = useState<string | null>(null);
  const [from, setFrom] = useState<HTMLElement | null>(null);
  // Si la cooperativa aún no tiene nombre en Ruta, adopta el del grupo al que se entra. Solo una vez por grupo,
  // para que después se pueda vaciar o cambiar el campo sin que se rellene de nuevo.
  const nombreGrupo = useGrupo().grupo?.nombre;
  const adoptado = useRef<string | null>(null);
  useEffect(() => {
    if (!nombreGrupo || adoptado.current === nombreGrupo) return;
    adoptado.current = nombreGrupo;
    if (!s.group.name.trim()) set((x) => ({ ...x, group: { ...x.group, name: nombreGrupo } }));
  }, [nombreGrupo, s.group.name, set]);

  const scrollTo = (id: string) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  // Cada pestaña recuerda hasta dónde habías bajado, para poder ir y volver (por ejemplo, de Oportunidades a la calculadora)
  // sin perder el sitio. Si se pide una sección concreta, se baja a ella; si no hay posición guardada, se sube arriba.
  const tabActual = useRef("ruta");
  const posiciones = useRef<Record<string, number>>({});
  const go = useCallback((t: string, id?: string) => {
    posiciones.current[tabActual.current] = window.scrollY;
    tabActual.current = t;
    setTab(t);
    try { history.replaceState(null, "", "#" + t); } catch {}
    if (id) scrollTo(id);
    else { const y = posiciones.current[t] ?? 0; setTimeout(() => window.scrollTo({ top: y, behavior: "instant" }), 60); }
  }, []);
  useEffect(() => {
    const h = location.hash.slice(1);
    if (TABS.some((t) => t[0] === h)) { tabActual.current = h; setTab(h); }
    // «calc:terreno» abre las calculadoras y baja hasta la del terreno; «calc» baja hasta la cuota.
    const ev = (e: Event) => { const t = (e as CustomEvent).detail as string; if (t === "calc:terreno") go("calc", "cT"); else go(t, t === "calc" ? "cA" : undefined); };
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
          {tab === "grupo" && <Grupo />}
          {tab === "faq" && <Faq />}
          {tab === "glos" && <Glos />}
        </main>
        <footer className="site-foot">
          <div className="sf-brand"><b>Techo Común</b><span>Guía de vivienda cooperativa en cesión de uso. Sin ánimo de lucro.</span></div>
          <div className="sf-cols">
            <p><b>Orientación, no asesoría.</b> No es asesoría jurídica ni financiera: antes de firmar estatutos, préstamos o compras, consulta con una persona profesional y con una federación como Fecovi.</p>
            <p><b>Datos orientativos.</b> Las cifras de las calculadoras son ejemplos editables. Los anuncios de la búsqueda en vivo proceden de portales externos y pueden no estar actualizados. Las condiciones de cada concurso cambian: lee siempre sus bases.</p>
            <p><b>Privacidad.</b> Solo si creas o entras a un grupo guardamos tu nombre o alias, contraseñas cifradas, los favoritos que marques y los datos básicos de la cooperativa (comunidad, ciudad, familias y barrio). Sin correo, teléfono ni datos bancarios. Responsable: Leida cooperativa. <button type="button" className="font-semibold text-primary underline" onClick={() => go("grupo", "privacidad")}>Leer el aviso completo</button></p>
          </div>
        </footer>
      </div>
      <Sheet term={term} onClose={close} onOpen={setTerm} />
    </HelpCtx.Provider>
  );
}

export default function App() { return <StoreProvider><GrupoProvider><SyncDatosGrupo /><Shell /></GrupoProvider></StoreProvider>; }
