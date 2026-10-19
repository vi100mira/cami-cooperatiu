import type { Listing } from "./parse-fotocasa";
import { parseFotocasa } from "./parse-fotocasa";
import { parsePisos } from "./parse-pisos";
import { parseYaencontre } from "./parse-yaencontre";
import { parseIdealista } from "./parse-idealista";
import { parseFicha, zonaDeTitulo } from "./parse-ficha";
import { detectGestora } from "./gestoras";
import type { Tipo } from "./search";

/**
 * Anuncios desde una URL que pega la persona: una página de resultados (con sus filtros) o la ficha de un anuncio.
 * Solo se aceptan portales conocidos, con un lector probado para cada uno: así nadie puede usar la app para leer
 * cualquier web, y cada lectura pasa por las mismas protecciones de coste que la búsqueda en vivo.
 */
export interface PortalUrl {
  id: string;
  nombre: string;
  host: RegExp;
  /** Reconoce la URL de la ficha de un anuncio (frente a una página de resultados). */
  ficha: RegExp;
  /** La ficha no se puede leer automáticamente: se pide el formulario sin gastar créditos. */
  fichaBloqueada?: boolean;
  listado: (md: string) => Listing[];
}

export const PORTALES_URL: PortalUrl[] = [
  { id: "idealista", nombre: "Idealista", host: /(^|\.)idealista\.com$/, ficha: /\/inmueble\/\d+/, fichaBloqueada: true, listado: (md) => parseIdealista(md, 30) },
  { id: "fotocasa", nombre: "Fotocasa", host: /(^|\.)fotocasa\.es$/, ficha: /\/\d+\/d\/?$/, listado: (md) => parseFotocasa(md, 30).map((l) => ({ ...l, fuente: "Fotocasa" })) },
  { id: "pisos", nombre: "Pisos.com", host: /(^|\.)pisos\.com$/, ficha: /\/comprar\//, listado: (md) => parsePisos(md, 30) },
  { id: "yaencontre", nombre: "yaencontre", host: /(^|\.)yaencontre\.com$/, ficha: /\/inmueble-\d/, listado: (md) => parseYaencontre(md, 30) },
];

export type UrlRevisada = { ok: true; url: string; portal: PortalUrl; ficha: boolean } | { ok: false; error: "url_invalida" | "portal_no_admitido" };

/** Comprueba y limpia la URL: https, sin fragmento ni credenciales, de un portal admitido. */
export function revisarUrl(raw: unknown): UrlRevisada {
  if (typeof raw !== "string" || raw.length > 500) return { ok: false, error: "url_invalida" };
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return { ok: false, error: "url_invalida" }; }
  if (u.protocol === "http:") u.protocol = "https:";
  if (u.protocol !== "https:" || u.username || u.password || u.port) return { ok: false, error: "url_invalida" };
  const portal = PORTALES_URL.find((p) => p.host.test(u.hostname));
  if (!portal) return { ok: false, error: "portal_no_admitido" };
  u.hash = "";
  return { ok: true, url: u.toString(), portal, ficha: portal.ficha.test(u.pathname) };
}

/** Terrenos si la URL lo dice (terreno, solar, suelo, parcela); si no, edificios. La persona lo puede cambiar. */
export const tipoDesdeUrl = (url: string): Tipo => (/terreno|solar|suelo|parcela/i.test(url) ? "terrenos" : "edificios");

/** Convierte el markdown leído en anuncios. Una ficha da un solo anuncio y necesita al menos precio o m². */
export function anunciosDe(md: string, url: string, portal: PortalUrl, ficha: boolean): Listing[] {
  if (ficha) {
    const f = parseFicha(md);
    if (f.precio == null && f.m2 == null) return [];
    const id = portal.id + "-" + (url.match(/(\d{6,})/)?.[1] ?? url);
    return [{ id, titulo: f.titulo ?? "Anuncio de " + portal.nombre, url, precio: f.precio, m2: f.m2, zona: f.titulo ? zonaDeTitulo(f.titulo) : "", resumen: f.resumen, fotos: f.fotos, fuente: portal.nombre }];
  }
  return portal.listado(md).map((l) => ({ ...l, fuente: l.fuente ?? portal.nombre, gestora: l.gestora ?? detectGestora(l.url, l.titulo, l.resumen) }));
}
