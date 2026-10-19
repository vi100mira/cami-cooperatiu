import { unstable_cache } from "next/cache";
import { parseFotocasa, type Listing } from "./parse-fotocasa";
import { parsePisos } from "./parse-pisos";
import { detectGestora } from "./gestoras";
import { parseYaencontre } from "./parse-yaencontre";
import { unirListados } from "./merge";
import { canSpend, recordCall, recordFailure } from "./guards";

export type Tipo = "edificios" | "terrenos";
/** Lista blanca: la única forma de elegir qué se consulta. */
/**
 * Ciudades con búsqueda en vivo: slug de Fotocasa verificado a mano. Para añadir una ciudad,
 * comprueba primero que la URL devuelve resultados y añade una línea aquí (no se acepta nada más).
 */
export const CITIES: Record<string, { slug: string; pisos: string; yaencontre: string; nombre: string }> = {
  valencia: { slug: "valencia-capital", pisos: "valencia_capital", yaencontre: "valencia", nombre: "València" },
  "valencia-provincia": { slug: "valencia-provincia", pisos: "valencia", yaencontre: "valencia-valencia-provincia", nombre: "provincia de València" },
};
export function isCity(x: unknown): x is string { return typeof x === "string" && Object.prototype.hasOwnProperty.call(CITIES, x); }
export function sourceUrl(tipo: Tipo, ciudad: string) { return `https://www.fotocasa.es/es/comprar/${tipo}/${CITIES[ciudad].slug}/todas-las-zonas/l`; }
export function isTipo(x: unknown): x is Tipo { return x === "edificios" || x === "terrenos"; }

export interface SearchResult { tipo: Tipo; ciudad: string; fuente: string; fuentes: string[]; fallidos: string[]; actualizado: string; items: Listing[]; }

interface Portal { id: string; nombre: string; tipos: Tipo[]; url: (t: Tipo, c: string) => string; parse: (md: string) => Listing[] }
/**
 * Portales verificados a mano para la búsqueda en vivo. Idealista no está aquí: sus fichas sueltas bloquean la lectura
 * automática, aunque sus páginas de resultados se pueden leer cuando alguien pega una (ver importar.ts).
 */
const PORTALES: Portal[] = [
  { id: "fotocasa", nombre: "Fotocasa", tipos: ["edificios", "terrenos"], url: sourceUrl, parse: (md) => parseFotocasa(md, 30).map((l) => ({ ...l, fuente: "Fotocasa" })) },
  { id: "pisos", nombre: "Pisos.com", tipos: ["edificios", "terrenos"], url: (t, c) => `https://www.pisos.com/venta/${t}-${CITIES[c].pisos}/`, parse: (md) => parsePisos(md, 30) },
  { id: "yaencontre", nombre: "yaencontre", tipos: ["edificios", "terrenos"], url: (t, c) => `https://www.yaencontre.com/venta/${t}/${CITIES[c].yaencontre}`, parse: (md) => parseYaencontre(md, 30) },
  // Terrenos que publican bancos y gestoras (filtro «de bancos» de yaencontre). Un crédito más por consulta.
  { id: "yaencontre-bancos", nombre: "yaencontre (de bancos)", tipos: ["terrenos"], url: (t, c) => `https://www.yaencontre.com/venta/${t}/${CITIES[c].yaencontre}/e-de-bancos`, parse: (md) => parseYaencontre(md, 30) },
];

/**
 * Lee una página con Firecrawl: un scrape simple (1 crédito), sin modo JSON (5 créditos) ni proxy "stealth".
 * Cada llamada cuenta para el tope diario; si ya se ha alcanzado, lanza «limit:…» sin gastar nada.
 */
export async function scrapeMarkdown(url: string, id: string): Promise<string> {
  const ok = canSpend();
  if (!ok.ok) throw new Error("limit:" + ok.reason);
  recordCall();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45_000);
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, proxy: "basic" }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`upstream:${id}:${res.status}`);
    const j = (await res.json()) as { success?: boolean; data?: { markdown?: string } };
    const md = j.data?.markdown;
    if (!j.success || !md) throw new Error(`upstream:${id}:empty`);
    return md;
  } finally { clearTimeout(timer); }
}

async function leerPortal(p: Portal, tipo: Tipo, ciudad: string): Promise<Listing[]> {
  const md = await scrapeMarkdown(p.url(tipo, ciudad), p.id);
  const items = p.parse(md).map((l) => (l.gestora ? l : { ...l, gestora: detectGestora(l.url, l.titulo, l.resumen) }));
  if (!items.length) throw new Error(`parse:${p.id}:empty`);
  return items;
}

async function fetchFresh(tipo: Tipo, ciudad: string): Promise<SearchResult> {
  const usar = PORTALES.filter((p) => p.tipos.includes(tipo));
  // Secuencial: así el tope diario se comprueba antes de cada lectura y nunca se sobrepasa.
  const listas: Listing[][] = [], fuentes: string[] = [], fallidos: string[] = [];
  let limite: Error | null = null;
  for (const p of usar) {
    try { listas.push(await leerPortal(p, tipo, ciudad)); fuentes.push(p.nombre); }
    catch (e) {
      if (e instanceof Error && e.message.startsWith("limit:")) { limite = e; break; }
      fallidos.push(p.nombre);
    }
  }
  if (!listas.length) { if (limite) throw limite; recordFailure(); throw new Error("upstream:all"); }
  if (fallidos.length === usar.length) recordFailure();
  const items = unirListados(listas);
  return { tipo, ciudad, fuente: fuentes.join(" + "), fuentes, fallidos: [...fallidos, ...(limite ? ["(límite diario)"] : [])], actualizado: new Date().toISOString(), items };
}

/** Caché de 24 h: un error lanza excepción y NO se cachea. */
export const getListings = (tipo: Tipo, ciudad: string) =>
  unstable_cache(() => fetchFresh(tipo, ciudad), ["listings-v7", ciudad, tipo], { revalidate: 86400, tags: ["listings"] })();
