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
  const zona = l.zona && l.zona !== "València" && !base.toLowerCase().includes(l.zona.toLowerCase()) ? l.zona : "";
  return [base, zona, l.m2 ? l.m2 + " m²" : ""].filter(Boolean).join(" · ");
}

export type Orden = "relevancia" | "pv" | "precio" | "m2" | "ajuste";

/** Dimensión de la cooperativa: cuántas familias y cuánto dinero puede reunir en total (ver `capacidad` en calc.ts). */
export interface Cooperativa { familias: number; capital: number; m2Vivienda: number }

/** El suelo o el edificio no debería pasar de esta parte del presupuesto total: el resto es obra y gastos. Es un supuesto orientativo. */
export const PARTE_MAX_SUELO = 0.5;

export type Encaje = "encaja" | "grande" | "pequeno" | "caro" | "sin-dato";
export const ENCAJE_TEXTO: Record<Encaje, string> = {
  encaja: "Encaja con tu cooperativa",
  grande: "Grande para tu cooperativa",
  pequeno: "Pequeño para tu cooperativa",
  caro: "Por encima de tu capital",
  "sin-dato": "Sin datos de tamaño",
};

export interface Ajuste { puntos: number; etiquetas: Encaje[]; oculto: boolean; ratioTamano: number | null; ratioPrecio: number | null }

/**
 * Cuánto encaja un anuncio con la cooperativa. Menos puntos es mejor. «Oculto» solo marca los casos extremos
 * (varias veces más grande o más pequeño de lo necesario, o más caro que todo el capital).
 * Edificios: viviendas estimadas frente a familias. Terrenos: m² frente a lo que necesitarían las familias con
 * una edificabilidad de 1 m² por m² de suelo, con margen de 3 veces porque en ciudad puede ser mayor.
 */
export function ajuste(l: Pick<Listing, "m2" | "precio">, tipo: "edificios" | "terrenos", c: Cooperativa): Ajuste {
  const fam = Math.max(1, c.familias || 1);
  const etiquetas: Encaje[] = [];
  let puntos = 0, oculto = false, ratioTamano: number | null = null;
  if (tipo === "edificios") {
    const v = viviendasEstimadas(l, tipo);
    if (v != null) {
      ratioTamano = v / fam;
      if (ratioTamano > 2) { etiquetas.push("grande"); puntos += Math.log(ratioTamano / 2); }
      else if (ratioTamano < 0.75) { etiquetas.push("pequeno"); puntos += 1.5 * Math.log(0.75 / ratioTamano); }
      if (ratioTamano > 4 || ratioTamano < 0.5) oculto = true;
    } else { etiquetas.push("sin-dato"); puntos += 0.7; }
  } else if (l.m2) {
    ratioTamano = l.m2 / (fam * Math.max(1, c.m2Vivienda || 90));
    if (ratioTamano > 3) { etiquetas.push("grande"); puntos += Math.log(ratioTamano / 3); }
    else if (ratioTamano < 1 / 3) { etiquetas.push("pequeno"); puntos += 1.5 * Math.log(1 / 3 / ratioTamano); }
    if (ratioTamano > 10 || ratioTamano < 0.15) oculto = true;
  } else { etiquetas.push("sin-dato"); puntos += 0.7; }

  let ratioPrecio: number | null = null;
  if (l.precio != null && c.capital > 0) {
    ratioPrecio = l.precio / (PARTE_MAX_SUELO * c.capital);
    if (ratioPrecio > 1) { etiquetas.push("caro"); puntos += Math.log(ratioPrecio); }
    if (l.precio > c.capital) oculto = true;
  }
  if (!etiquetas.length) etiquetas.push("encaja");
  return { puntos, etiquetas, oculto, ratioTamano, ratioPrecio };
}

export interface Filtros { maxPrecio: number; minViv: number; maxPv: number; orden: Orden; verTodo?: boolean; coop?: Cooperativa; soloEncaje?: boolean }

export function filtrar(items: Listing[], tipo: "edificios" | "terrenos", f: Filtros): Listing[] {
  const out = items.filter((l) => {
    if (!f.verTodo && etiquetas(l, tipo).length) return false;
    if (f.soloEncaje && f.coop && ajuste(l, tipo, f.coop).oculto) return false;
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
  if (f.orden === "ajuste" && f.coop) {
    const c = f.coop;
    // Primero lo que mejor encaja; a igualdad, lo más barato.
    const precio = (l: Listing) => l.precio ?? Number.MAX_SAFE_INTEGER;
    return [...out].sort((a, b) => (ajuste(a, tipo, c).puntos - ajuste(b, tipo, c).puntos) || (precio(a) - precio(b)));
  }
  return f.orden === "relevancia" || f.orden === "ajuste" ? out : [...out].sort((a, b) => key(a) - key(b));
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

export type TipoInmueble = "edificios" | "terrenos";
/** Un anuncio con el tipo al que pertenece: la búsqueda «ambos» mezcla edificios y terrenos en una sola lista. */
export interface Entrada { l: Listing; tipo: TipoInmueble }

/**
 * Filtra y ordena uno o varios tipos de inmueble a la vez. Con un solo tipo equivale a `filtrar`. Con varios, los
 * filtros que solo tienen sentido para edificios (viviendas mínimas y máximo por vivienda) no se aplican a los terrenos,
 * y el orden «más barato por vivienda» deja los terrenos al final.
 */
export function filtrarTodo(grupos: { tipo: TipoInmueble; items: Listing[] }[], f: Filtros): Entrada[] {
  const mezcla = grupos.length > 1;
  const out: Entrada[] = grupos.flatMap((g) => {
    const fg: Filtros = { ...f, orden: "relevancia", ...(mezcla && g.tipo === "terrenos" ? { minViv: 0, maxPv: 0 } : {}) };
    return filtrar(g.items, g.tipo, fg).map((l) => ({ l, tipo: g.tipo }));
  });
  if (f.orden === "relevancia") return out;
  const precio = (e: Entrada) => e.l.precio ?? Number.MAX_SAFE_INTEGER;
  if (f.orden === "ajuste") {
    const c = f.coop;
    if (!c) return out;
    return [...out].sort((a, b) => (ajuste(a.l, a.tipo, c).puntos - ajuste(b.l, b.tipo, c).puntos) || (precio(a) - precio(b)));
  }
  const key = (e: Entrada): number => {
    if (f.orden === "pv") return precioPorVivienda(e.l, e.tipo) ?? Infinity;
    if (f.orden === "precio") return e.l.precio ?? Infinity;
    return -(e.l.m2 ?? 0);
  };
  return [...out].sort((a, b) => key(a) - key(b));
}
