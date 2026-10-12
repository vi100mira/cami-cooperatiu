"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { CDEF, type CalcInput } from "./calc";
import type { Group } from "./content";
import { TDEF, CLASES, type TerrenoInput } from "./terreno";

export interface Cand { id: string; ejemplo?: boolean; nombre: string; barrio: string; via: string; precio: number; viv: number; estado: string; notas: string; url?: string; direccion?: string; refcat?: string; plano?: string; fotos?: string[]; chk: Record<number, boolean>; }
export interface State { group: Group; done: Record<string, boolean>; cands: Cand[]; calc: CalcInput; terreno: TerrenoInput; open: number | null; sim?: Sim | null; }
/** Valores de antes de simular (o los que puso la simulación), para poder volver a ellos. */
export interface SimValores { suelo?: number; obra?: number; precioTerreno?: number; superficieTerreno?: number }
export interface Sim {
  titulo: string; zona?: string; foto?: string; url?: string; fuente?: string;
  tipo?: "edificios" | "terrenos" | "terreno-calculado";
  /** Viviendas con las que se calcula mientras dura la simulación; no cambian las familias de la cooperativa. */
  viv?: number;
  sinSuperficie?: boolean;
  /** El suelo no permite viviendas (no urbanizable o sin edificabilidad): solo se cargaron precio y superficie. */
  sinViviendas?: boolean;
  /** m² construidos de referencia para la obra: los del edificio del anuncio o el techo construible del terreno. */
  m2?: number;
  previo?: Required<SimValores>;
  puesto?: SimValores;
}
const KEY = "camiCooperatiu.v1";

export function examples(): Cand[] {
  return [
    { id: "ex1", ejemplo: true, nombre: "Finca de 12 viviendas por rehabilitar", barrio: "Barrio a elegir", via: "edificio", precio: 1100000, viv: 12, estado: "Detectado", notas: "Datos inventados para ver cómo funciona la lista.", chk: {} },
    { id: "ex2", ejemplo: true, nombre: "Promoción inacabada de 20 viviendas", barrio: "Barrio a elegir", via: "parada", precio: 1800000, viv: 20, estado: "Contactado", notas: "Datos inventados para ver cómo funciona la lista.", chk: { 0: true } },
  ];
}
export const initial = (): State => ({ group: { name: "", fam: 20, barrio: "", ciudad: "València", region: "cv" }, done: {}, cands: examples(), calc: { ...CDEF }, terreno: { ...TDEF }, open: null });

// Quien guardó el estado antes de existir la calculadora de terreno no tiene este campo; si falta o es raro, parte del ejemplo.
function terrenoGuardado(x: unknown, base: TerrenoInput): TerrenoInput {
  if (!x || typeof x !== "object") return base;
  const t = { ...base, ...(x as Partial<TerrenoInput>) };
  if (!CLASES.some((c) => c.id === t.clase)) t.clase = base.clase;
  return t;
}

function load(): State {
  const base = initial();
  try {
    const sv = JSON.parse(localStorage.getItem(KEY) || "null");
    if (sv && typeof sv === "object") {
      const g = { ...base.group, ...sv.group };
      // Quien guardó el estado sin ciudad ni comunidad (nunca la eligió) también parte de València.
      if (!String(g.ciudad || "").trim() && !String(g.region || "").trim()) { g.ciudad = base.group.ciudad; g.region = base.group.region; }
      return {
        group: g,
        done: sv.done && typeof sv.done === "object" ? sv.done : {},
        cands: Array.isArray(sv.cands) ? sv.cands : base.cands,
        calc: { ...base.calc, ...sv.calc },
        terreno: terrenoGuardado(sv.terreno, base.terreno),
        open: typeof sv.open === "number" ? sv.open : null,
        sim: sv.sim && typeof sv.sim.titulo === "string" ? sv.sim : null,
      };
    }
  } catch {}
  return base;
}

interface Ctx { s: State; set: (f: (s: State) => State) => void; ready: boolean; }
const C = createContext<Ctx | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { setS(load()); setReady(true); }, []);
  useEffect(() => {
    if (!ready) return;
    clearTimeout(t.current);
    t.current = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }, 250);
  }, [s, ready]);
  const set = useCallback((f: (x: State) => State) => setS(f), []);
  return <C.Provider value={{ s, set, ready }}>{children}</C.Provider>;
}
export function useStore() { const c = useContext(C); if (!c) throw new Error("StoreProvider"); return c; }
