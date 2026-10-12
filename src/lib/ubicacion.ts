import { MUNICIPIOS_DATOS } from "./municipios-datos";

/**
 * Ubicación orientativa de los anuncios y distancia al centro de acción de la cooperativa.
 *
 * Los anuncios no traen coordenadas y su campo «zona» no es fiable (Fotocasa y Pisos.com ponen «València» cuando no lo
 * saben), así que el municipio se deduce, por este orden, de la dirección web del anuncio, de su zona y de frases del texto
 * del tipo «en Alzira». Las coordenadas son las del municipio (Wikidata, ver scripts/generar-municipios.mjs): la distancia es
 * en línea recta entre municipios y solo orientativa. Lo que no se puede ubicar se declara como tal, no se inventa.
 */
export interface Municipio { ine: string; nombre: string; es: string; ca: string; lat: number; lon: number; provincia: "València" | "Castelló" | "Alacant" }

export const MUNICIPIOS: Municipio[] = MUNICIPIOS_DATOS.map(([ine, es, ca, lat, lon]) => ({
  ine, es, ca, lat, lon, nombre: ca || es,
  provincia: ine.startsWith("46") ? "València" : ine.startsWith("12") ? "Castelló" : "Alacant",
}));

/** Minúsculas, sin tildes ni signos, con apóstrofos y guiones como espacios. */
export function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’'`´]/g, " ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

const ARTICULOS = new Set(["la", "el", "les", "els", "l", "los", "las"]);

// «Pobla del Duc (la)» → «la Pobla del Duc», como lo escriben algunos portales.
const moverArticuloFinal = (s: string) => s.replace(/^(.*?)\s*\((la|el|les|els|l'|los|las)\)\s*$/i, "$2 $1");
const tokens = (s: string) => normalizar(moverArticuloFinal(s)).split(" ").filter(Boolean);

type Indice = Map<string, Municipio | null>;

function anadir(indice: Indice, clave: string, m: Municipio) {
  if (!clave) return;
  const previo = indice.get(clave);
  if (previo === undefined) indice.set(clave, m);
  else if (previo !== null && previo.ine !== m.ine) indice.set(clave, null); // nombre ambiguo: no se usa
}

const VALENCIA = MUNICIPIOS.find((m) => m.ine === "46250")!;
const porIne = new Map(MUNICIPIOS.map((m) => [m.ine, m]));

// Nombres de municipios, con y sin artículo («la Pobla del Duc» y «Pobla del Duc»), en castellano y en valenciano.
const INDICE_MUNICIPIOS: Indice = (() => {
  const idx: Indice = new Map();
  for (const m of MUNICIPIOS) {
    for (const nombre of [m.es, m.ca]) {
      for (const parte of nombre.split("/")) {
        const t = tokens(parte);
        anadir(idx, t.join(" "), m);
        if (t.length > 1 && ARTICULOS.has(t[0])) anadir(idx, t.slice(1).join(" "), m);
      }
    }
  }
  // Formas habituales en los anuncios que no coinciden con el nombre oficial.
  const extra: [string, string][] = [
    ["valencia capital", "46250"], ["puerto de sagunto", "46220"], ["port de sagunt", "46220"], ["puerto sagunto", "46220"],
    ["sagunto", "46220"], ["benipeixcar", "46131"], ["grau de gandia", "46131"], ["playa de gandia", "46131"], ["platja de gandia", "46131"],
  ];
  for (const [alias, ine] of extra) { const m = porIne.get(ine); if (m) idx.set(alias, m); }
  return idx;
})();

// Barrios y pedanías de València ciudad: lista orientativa, solo se usa si no sale ningún municipio.
const BARRIOS_VALENCIA = [
  "ciutat vella", "la seu", "la xerea", "el carme", "el pilar", "el mercat", "sant francesc", "l eixample", "eixample", "russafa", "ruzafa",
  "el pla del remei", "pla del remei", "gran via", "extramurs", "el botanic", "la roqueta", "la petxina", "arrancapins", "campanar", "la saidia",
  "el pla del real", "pla del real", "l olivereta", "olivereta", "nou moles", "patraix", "quatre carreres", "na rovella", "la fonteta", "en corts",
  "malilla", "poblats maritims", "el grau", "el cabanyal", "cabanyal", "canyamelar", "la malva rosa", "malva rosa", "malvarrosa", "natzaret",
  "camins al grau", "la creu del grau", "creu del grau", "penya roja", "algiros", "l illa perduda", "ciutat jardi", "la carrasca", "benimaclet",
  "rascanya", "orriols", "torrefiel", "marxalenes", "benicalap", "ciutat fallera", "benifaraig", "carpesa", "cases de barcena", "mahuella",
  "massarrojos", "borboto", "benimamet", "beniferri", "el forn d alcedo", "castellar l oliveral", "pinedo", "el saler", "el palmar", "el perellonet",
  "pobles de l oest", "pobles del sud", "pobles del nord", "faitanar", "trinitat", "jaume roig", "mestalla", "soternes", "la creu coberta", "hort de senabre",
];
const INDICE_BARRIOS: Indice = new Map(BARRIOS_VALENCIA.map((b) => [b, VALENCIA]));

// Nombres de municipio que también son palabras corrientes: no se aceptan a partir del texto libre del anuncio.
const PALABRAS_CORRIENTES = new Set(["real", "tous", "gata", "sot"]);

function mejor(toks: string[], indice: Indice, opciones: { trasEn?: boolean; ignorar?: Set<string> } = {}): Municipio | null {
  for (let n = Math.min(5, toks.length); n >= 1; n--) {
    for (let i = 0; i + n <= toks.length; i++) {
      const clave = toks.slice(i, i + n).join(" ");
      const m = indice.get(clave);
      if (!m) continue;
      if (opciones.trasEn && toks[i - 1] !== "en") continue;
      if (opciones.ignorar?.has(clave)) continue;
      return m;
    }
  }
  return null;
}

/** El municipio de un texto corto (nombre, zona o tramo de dirección web), o null. Prefiere municipios y, si no hay, barrios de València. */
function municipioDe(texto: string): { m: Municipio; barrio: boolean } | null {
  const t = tokens(texto);
  const m = mejor(t, INDICE_MUNICIPIOS);
  if (m) return { m, barrio: false };
  const b = mejor(t, INDICE_BARRIOS);
  return b ? { m: b, barrio: true } : null;
}

export type OrigenUbicacion = "url" | "zona" | "texto";
export interface Ubicacion { municipio: Municipio; origen: OrigenUbicacion }
interface Anuncio { url: string; zona: string; titulo?: string; resumen?: string }

const cache = new WeakMap<object, Ubicacion | null>();

/** Municipio de un anuncio, o null si no se puede saber con seguridad razonable. */
export function ubicar(l: Anuncio): Ubicacion | null {
  const previo = cache.get(l);
  if (previo !== undefined) return previo;
  const r = calcularUbicacion(l);
  cache.set(l, r);
  return r;
}

function calcularUbicacion(l: Anuncio): Ubicacion | null {
  // 1. Dirección web: Fotocasa lleva el municipio, y Pisos.com el nombre de la zona dentro del enlace.
  let segmentos: string[] = [];
  try { segmentos = new URL(l.url).pathname.split("/").filter(Boolean); } catch { /* enlace raro: se sigue con la zona */ }
  const limpios = segmentos.map((s) => s.replace(/[-_]+/g, " ").replace(/\d+/g, " "));
  let barrioUrl: Municipio | null = null;
  for (const s of limpios) {
    const r = municipioDe(s);
    if (!r) continue;
    if (!r.barrio) return { municipio: r.m, origen: "url" };
    barrioUrl ??= r.m;
  }
  // 2. La zona, salvo que sea el «València» que ponen los portales cuando no la conocen.
  const zonaNorm = normalizar(l.zona ?? "");
  if (zonaNorm && zonaNorm !== "valencia") {
    const r = municipioDe(l.zona);
    if (r && !r.barrio) return { municipio: r.m, origen: "zona" };
    if (r) barrioUrl ??= r.m;
  }
  if (barrioUrl) return { municipio: barrioUrl, origen: "zona" };
  // 3. Frases como «edificio en Alzira» del título y del principio del texto.
  const texto = tokens(`${l.titulo ?? ""}. ${(l.resumen ?? "").slice(0, 300)}`);
  const m = mejor(texto, INDICE_MUNICIPIOS, { trasEn: true, ignorar: PALABRAS_CORRIENTES });
  return m ? { municipio: m, origen: "texto" } : null;
}

/** El municipio que corresponde a lo que escribe una persona como centro de acción («València», «Torrent», «Valencia capital»…), o null. */
export function resolverCentro(texto: string): Municipio | null {
  const t = normalizar(moverArticuloFinal(texto ?? ""));
  if (!t) return null;
  const exacto = INDICE_MUNICIPIOS.get(t) ?? INDICE_BARRIOS.get(t);
  if (exacto) return exacto;
  return municipioDe(texto)?.m ?? null;
}

/** Distancia en línea recta, en km, entre dos puntos (fórmula del haversine). */
export function distanciaKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Distancia de un anuncio a un centro, o null si no se sabe dónde está. */
export function distanciaAnuncio(l: Anuncio, centro: { lat: number; lon: number }): number | null {
  const u = ubicar(l);
  return u ? distanciaKm(centro, u.municipio) : null;
}
