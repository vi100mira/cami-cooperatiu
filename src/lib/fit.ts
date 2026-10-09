import type { Listing } from "./parse-fotocasa";

/** m² construidos por vivienda incluyendo zonas comunes (supuesto orientativo para edificios). */
export const M2_POR_VIVIENDA = 80;

/** Viviendas estimadas de un edificio a partir de sus m². Solo orientativo; null si no hay dato fiable. */
export function viviendasEstimadas(l: Pick<Listing, "m2">, tipo: "edificios" | "terrenos"): number | null {
  if (tipo !== "edificios" || !l.m2 || l.m2 < 80) return null;
  return Math.max(1, Math.round(l.m2 / M2_POR_VIVIENDA));
}

export function precioPorVivienda(l: Pick<Listing, "m2" | "precio">, tipo: "edificios" | "terrenos"): number | null {
  const v = viviendasEstimadas(l, tipo);
  return v && l.precio ? l.precio / v : null;
}

export type Etiqueta = "turistico" | "solar";

/** Detecta anuncios que casi nunca encajan con una cooperativa (turísticos, hoteles, traspasos) o que no son edificios (solares). */
export function etiquetas(l: Pick<Listing, "titulo" | "resumen" | "url">, tipo: "edificios" | "terrenos"): Etiqueta[] {
  const t = (l.titulo + " " + l.resumen).toLowerCase();
  const out: Etiqueta[] = [];
  if (/tur[ií]stic|hotel|hostal|apartamentos? tur|traspaso|residencia de estudiantes|uso hotelero/.test(t)) out.push("turistico");
  if (tipo === "edificios" && /solar urbano|\bsolar\b.*parcela|parcela de \d/.test(t)) out.push("solar");
  return out;
}

export const ETIQUETA_TEXTO: Record<Etiqueta, string> = { turistico: "Turístico / hotel / traspaso", solar: "Parece un solar" };

/** Título legible: los portales ponen solo «Edificio». */
export function tituloLegible(l: Pick<Listing, "titulo" | "zona" | "m2">): string {
  const base = l.titulo && l.titulo.length > 12 ? l.titulo : "Edificio";
  return [base, l.zona && l.zona !== "València" ? l.zona : "", l.m2 ? l.m2 + " m²" : ""].filter(Boolean).join(" · ");
}

export type Orden = "relevancia" | "pv" | "precio" | "m2";

export interface Filtros { maxPrecio: number; minViv: number; maxPv: number; orden: Orden; verTodo?: boolean }

export function filtrar(items: Listing[], tipo: "edificios" | "terrenos", f: Filtros): Listing[] {
  const out = items.filter((l) => {
    if (!f.verTodo && etiquetas(l, tipo).length) return false;
    if (f.maxPrecio && !(l.precio != null && l.precio <= f.maxPrecio)) return false;
    if (f.minViv) { const v = viviendasEstimadas(l, tipo); if (v == null || v < f.minViv) return false; }
    if (f.maxPv) { const p = precioPorVivienda(l, tipo); if (p == null || p > f.maxPv) return false; }
    return true;
  });
  const key = (l: Listing): number => {
    if (f.orden === "pv") return precioPorVivienda(l, tipo) ?? Infinity;
    if (f.orden === "precio") return l.precio ?? Infinity;
    if (f.orden === "m2") return -(l.m2 ?? 0);
    return 0;
  };
  return f.orden === "relevancia" ? out : [...out].sort((a, b) => key(a) - key(b));
}

const PORTALES = [
  { id: "idealista", nombre: "Idealista", site: "idealista.com" },
  { id: "fotocasa", nombre: "Fotocasa", site: "fotocasa.es" },
  { id: "habitaclia", nombre: "Habitaclia", site: "habitaclia.com" },
  { id: "pisos", nombre: "Pisos.com", site: "pisos.com" },
  { id: "yaencontre", nombre: "yaencontre", site: "yaencontre.com" },
] as const;

/** Enlaces de búsqueda por portal para cualquier municipio. No consulta nada: solo abre una búsqueda en Google restringida al portal. */
export function portalLinks(ciudad: string, tipo: "edificios" | "terrenos", maxPrecio?: number) {
  const que = tipo === "edificios" ? "edificio completo en venta" : "solar urbano en venta";
  const c = ciudad.trim();
  return PORTALES.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    url: "https://www.google.com/search?q=" + encodeURIComponent(`site:${p.site} ${que} ${c}${maxPrecio ? " hasta " + maxPrecio + " €" : ""}`),
  }));
}
