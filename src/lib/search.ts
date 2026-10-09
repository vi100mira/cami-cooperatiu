import { unstable_cache } from "next/cache";
import { parseFotocasa, type Listing } from "./parse-fotocasa";
import { canSpend, recordCall, recordFailure } from "./guards";

export type Tipo = "edificios" | "terrenos";
/** Lista blanca: la única forma de elegir qué se consulta. */
export const SOURCES: Record<Tipo, { url: string; label: string }> = {
  edificios: { url: "https://www.fotocasa.es/es/comprar/edificios/valencia-capital/todas-las-zonas/l", label: "Edificios en venta en València" },
  terrenos: { url: "https://www.fotocasa.es/es/comprar/terrenos/valencia-capital/todas-las-zonas/l", label: "Terrenos en venta en València" },
};
export function isTipo(x: unknown): x is Tipo { return x === "edificios" || x === "terrenos"; }

export interface SearchResult { tipo: Tipo; fuente: string; actualizado: string; items: Listing[]; }

async function fetchFresh(tipo: Tipo): Promise<SearchResult> {
  const ok = canSpend();
  if (!ok.ok) throw new Error("limit:" + ok.reason);
  recordCall();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45_000);
  try {
    // Scrape simple (1 crédito). Sin modo JSON (5 créditos) ni proxy "stealth".
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
      body: JSON.stringify({ url: SOURCES[tipo].url, formats: ["markdown"], onlyMainContent: true, proxy: "basic" }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error("upstream:" + res.status);
    const j = (await res.json()) as { success?: boolean; data?: { markdown?: string } };
    const md = j.data?.markdown;
    if (!j.success || !md) throw new Error("upstream:empty");
    const items = parseFotocasa(md, 30);
    if (!items.length) throw new Error("parse:empty");
    return { tipo, fuente: "Fotocasa", actualizado: new Date().toISOString(), items };
  } catch (e) {
    recordFailure();
    throw e;
  } finally { clearTimeout(timer); }
}

/** Caché de 24 h: un error lanza excepción y NO se cachea. */
export const getListings = (tipo: Tipo) =>
  unstable_cache(() => fetchFresh(tipo), ["listings-v1", tipo], { revalidate: 86400, tags: ["listings"] })();
