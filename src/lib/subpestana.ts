import { useEffect, useState } from "react";
import { crearMemoria, type Memoria } from "./memoria";

/**
 * Apartado abierto dentro de cada pestaña grande (por ejemplo, «Cuota» dentro de Calculadoras). Se recuerda al ir a otra
 * pestaña y volver, y también al recargar dentro de la visita. Cualquier parte de la app puede abrir un apartado con `irASub`.
 */
const registro = new Map<string, Memoria<string>>();
function memoria(seccion: string): Memoria<string> {
  let m = registro.get(seccion);
  if (!m) { m = crearMemoria<string>("camiSub." + seccion, "", (x) => (typeof x === "string" ? x : null)); registro.set(seccion, m); }
  return m;
}

export const subValida = (v: string, validas: readonly string[], porDefecto: string) => (validas.includes(v) ? v : porDefecto);

/** Abre un apartado de una pestaña (no cambia de pestaña ni se desplaza). */
export function irASub(seccion: string, sub: string) { memoria(seccion).escribir(sub); }

/**
 * El apartado abierto y cómo cambiarlo. Al cambiarlo con el menú, la pantalla sube hasta ese menú si se había quedado por encima.
 * `validas` debe ser una constante: un valor guardado que ya no exista vuelve al apartado por defecto.
 */
export function useSubPestana(seccion: string, validas: readonly string[], porDefecto: string, idMenu?: string): [string, (v: string) => void] {
  const m = memoria(seccion);
  const [v, setV] = useState(() => subValida(m.leer(), validas, porDefecto));
  useEffect(() => {
    setV(subValida(m.leer(), validas, porDefecto));
    return m.suscribir((x) => setV(subValida(x, validas, porDefecto)));
  }, [m, validas, porDefecto]);
  const cambiar = (n: string) => {
    m.escribir(n);
    if (idMenu) requestAnimationFrame(() => document.getElementById(idMenu)?.scrollIntoView({ block: "nearest" }));
  };
  return [v, cambiar];
}
