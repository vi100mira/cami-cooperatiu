import type { Listing } from "./parse-fotocasa";

const HEAD = /^###\s+\[([^\]]+)\]\((https:\/\/www\.yaencontre\.com\/venta\/[^)\s]+)\)\s+(\d{1,3}(?:\.\d{3})*)\s?€/;
const IMG = /!\[[^\]]*\]\((https:\/\/media\.yaencontre\.com\/img\/photo\/[^)\s]+)\)/;
const M2 = /^(\d{1,3}(?:\.\d{3})*|\d+)\s?m²/;

/** Convierte el markdown de yaencontre.com (listado de edificios/terrenos) en anuncios. Pura y testeable. */
export function parseYaencontre(md: string, max = 30): Listing[] {
  const lines = md.split("\n");
  const heads: number[] = [];
  lines.forEach((l, i) => { if (HEAD.test(l.trim())) heads.push(i); });
  const out: Listing[] = [];
  const seen = new Set<string>();
  heads.forEach((h, k) => {
    if (out.length >= max) return;
    const m = lines[h].trim().match(HEAD)!;
    const url = m[2].split("?")[0];
    const id = url.match(/inmueble-(\d+-\d+)/)?.[1] ?? url;
    if (seen.has(id)) return;
    seen.add(id);
    const prev = k > 0 ? heads[k - 1] : 0;
    const fotos: string[] = [];
    for (let i = h - 1; i > prev && fotos.length < 6; i--) {
      const im = lines[i].match(IMG);
      if (im && !fotos.includes(im[1])) fotos.unshift(im[1]);
    }
    const end = k + 1 < heads.length ? heads[k + 1] : Math.min(lines.length, h + 30);
    let m2: number | null = null, resumen = "";
    for (let i = h + 1; i < Math.min(end, h + 30); i++) {
      const t = lines[i].trim();
      if (!t) continue;
      if (/^## /.test(t)) break;
      const a = t.match(M2);
      if (a && m2 == null) { m2 = parseInt(a[1].replace(/\./g, ""), 10); continue; }
      if (m2 != null && !resumen && t.length > 25 && !t.startsWith("[") && !t.startsWith("!")) { resumen = t.slice(0, 220); break; }
    }
    const partes = m[1].replace(/^(Edificio|Terreno|Solar|Parcela)\s+en\s+/i, "").split(",").map((s) => s.trim());
    if (partes.length > 1 && /^valencia$/i.test(partes[partes.length - 1])) partes.pop();
    const zona = partes[partes.length - 1] || "València";
    out.push({ id: "y" + id, titulo: m[1], url, precio: parseInt(m[3].replace(/\./g, ""), 10), m2, zona, resumen, fotos, fuente: "yaencontre" });
  });
  return out;
}
