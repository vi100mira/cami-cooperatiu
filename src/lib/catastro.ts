/** Enlaces y consulta al Catastro. El servicio público de consulta es gratuito y oficial (ovc.catastro.meh.es). */
const REF = /^[0-9A-Z]{14}(?:[0-9A-Z]{6})?$/;

export function normRef(x: string): string { return (x || "").replace(/[\s.-]/g, "").toUpperCase(); }
export function isRefcat(x: string): boolean { return REF.test(normRef(x)); }

/** Ficha de la parcela (el edificio) en la Sede del Catastro. Usa los 14 primeros caracteres: parcela, no vivienda. */
export function catastroUrl(refcat: string): string | null {
  const r = normRef(refcat);
  if (!REF.test(r)) return null;
  return `https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCListaBienes.aspx?rc1=${r.slice(0, 7)}&rc2=${r.slice(7, 14)}`;
}

const SIGLAS: [RegExp, string][] = [
  [/^(calle|carrer|c\/|cl|c)\b\.?/i, "CL"], [/^(avenida|avinguda|avda|av)\b\.?/i, "AV"], [/^(plaza|plaça|placa|pza|pl)\b\.?/i, "PZ"],
  [/^(paseo|passeig|pso|ps)\b\.?/i, "PS"], [/^(camino|camí|cami|cmno)\b\.?/i, "CM"], [/^(ronda)\b\.?/i, "RD"],
  [/^(travesía|travesia|travessera|trva)\b\.?/i, "TR"], [/^(glorieta)\b\.?/i, "GL"], [/^(carretera|ctra)\b\.?/i, "CR"],
];
const quita = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Extrae tipo de vía, nombre y número de una dirección escrita a mano. Devuelve null si no puede. */
export function parseDireccion(d: string): { sigla: string; calle: string; numero: string } | null {
  let t = quita(d || "").replace(/\s+/g, " ").trim();
  const sig = SIGLAS.find(([re]) => re.test(t));
  if (!sig) return null;
  t = t.replace(sig[0], "").trim();
  t = t.replace(/^(de la|de las|del|de los|de l'|d'|de|dels|del la)\s+/i, "").replace(/^l'/i, "");
  const m = t.match(/^(.+?)[\s,]+(?:n[uú]m(?:ero)?\.?|n[º°o]\.?)?\s*(\d{1,4})\b/i);
  if (!m) return null;
  const calle = m[1].replace(/[,.]+$/, "").trim().toUpperCase();
  if (!calle) return null;
  return { sigla: sig[1], calle, numero: m[2] };
}

export interface Parcela { refcat: string; direccion: string }

/** Parcelas distintas (14 caracteres) que aparecen en la respuesta XML de Consulta_DNPLOC. */
export function parseRespuestaCatastro(xml: string): Parcela[] {
  const out: Parcela[] = [];
  const seen = new Set<string>();
  for (const b of xml.split(/<rcdnp>/).slice(1)) {
    const pc1 = b.match(/<pc1>([^<]+)<\/pc1>/)?.[1], pc2 = b.match(/<pc2>([^<]+)<\/pc2>/)?.[1];
    if (!pc1 || !pc2) continue;
    const ref = normRef(pc1 + pc2);
    if (seen.has(ref) || !REF.test(ref)) continue;
    seen.add(ref);
    const tv = b.match(/<tv>([^<]*)<\/tv>/)?.[1] ?? "", nv = b.match(/<nv>([^<]*)<\/nv>/)?.[1] ?? "", pnp = b.match(/<pnp>([^<]*)<\/pnp>/)?.[1] ?? "";
    out.push({ refcat: ref, direccion: [tv, nv, pnp].filter(Boolean).join(" ") });
  }
  return out;
}
