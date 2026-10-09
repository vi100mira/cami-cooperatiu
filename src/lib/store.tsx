"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { CDEF, type CalcInput } from "./calc";
import type { Group } from "./content";

export interface Cand { id: string; ejemplo?: boolean; nombre: string; barrio: string; via: string; precio: number; viv: number; estado: string; notas: string; url?: string; direccion?: string; refcat?: string; plano?: string; fotos?: string[]; chk: Record<number, boolean>; }
export interface State { group: Group; done: Record<string, boolean>; cands: Cand[]; calc: CalcInput; open: number | null; }
const KEY = "camiCooperatiu.v1";

export function examples(): Cand[] {
  return [
    { id: "ex1", ejemplo: true, nombre: "Finca de 12 viviendas por rehabilitar", barrio: "Barrio a elegir", via: "edificio", precio: 1100000, viv: 12, estado: "Detectado", notas: "Datos inventados para ver cómo funciona la lista.", chk: {} },
    { id: "ex2", ejemplo: true, nombre: "Promoción inacabada de 20 viviendas", barrio: "Barrio a elegir", via: "parada", precio: 1800000, viv: 20, estado: "Contactado", notas: "Datos inventados para ver cómo funciona la lista.", chk: { 0: true } },
  ];
}
export const initial = (): State => ({ group: { name: "", fam: 20, barrio: "", ciudad: "", region: "" }, done: {}, cands: examples(), calc: { ...CDEF }, open: null });

function load(): State {
  const base = initial();
  try {
    const sv = JSON.parse(localStorage.getItem(KEY) || "null");
    if (sv && typeof sv === "object") {
      return {
        group: { ...base.group, ...sv.group },
        done: sv.done && typeof sv.done === "object" ? sv.done : {},
        cands: Array.isArray(sv.cands) ? sv.cands : base.cands,
        calc: { ...base.calc, ...sv.calc },
        open: typeof sv.open === "number" ? sv.open : null,
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
