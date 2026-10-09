import type { Listing } from "./parse-fotocasa";

const HEAD = /^\[([^\]]+)\]\((https:\/\/www\.pisos\.com\/comprar\/[^)\s]+)\)$/;
const IMG = /!\[[^\]]*\]\((https:\/\/fotos\.imghs\.net\/(?!prof)[^)\s]+)\)/;
const PRICE = /^(\d{1,3}(?:\.\d{3})+)\s?€$/;
const M2 = /^(\d{1,3}(?:\.\d{3})*|\d+)\s?m²$/;

/** Convierte el markdown de una página de resultados de Pisos.com en una lista de anuncios. Pura y testeable. */
export function parsePisos(md: string, max = 30): Listing[] {
  const lines = md.split("\n");
  const heads: number[] = [];
  lines.forEach((l, i) => { if (HEAD.test(l.trim()) && !/calcula/i.test(l)) heads.push(i); });
  const out: Listing[] = [];
  const seen = new Set<string>();
  heads.forEach((h, k) => {
    if (out.length >= max) return;
    const m = lines[h].trim().match(HEAD)!;
    const url = m[2].split("?")[0];
    const idm = url.match(/-(\d{6,})_\d+\/?$/);
    const id = idm ? idm[1] : url;
    if (seen.has(id)) return;
    seen.add(id);
    const prev = k > 0 ? heads[k - 1] : 0;
    let precio: number | null = null;
    for (let i = h - 1; i >= Math.max(prev, h - 14); i--) {
      const p = lines[i].trim().match(PRICE);
      if (p) { precio = parseInt(p[1].replace(/\./g, ""), 10); break; }
    }
    const fotos: string[] = [];
    for (let i = h - 1; i > prev && fotos.length < 6; i--) {
      const im = lines[i].match(IMG);
      if (im && !fotos.includes(im[1])) fotos.unshift(im[1]);
    }
    const end = k + 1 < heads.length ? heads[k + 1] : Math.min(lines.length, h + 40);
    let zona = "València", m2: number | null = null, resumen = "";
    for (let i = h + 1; i < Math.min(end, h + 40); i++) {
      const t = lines[i].trim();
      if (!t) continue;
      if (zona === "València" && !m2 && !resumen) { const z = t.match(/^(.+?)\s*\(/); if (z && !M2.test(t)) { zona = z[1].trim(); continue; } }
      const a = t.match(M2);
      if (a && m2 == null) { m2 = parseInt(a[1].replace(/\./g, ""), 10); continue; }
      if (m2 != null && !resumen && t.length > 25 && !t.startsWith("[") && !t.startsWith("!") && !/^Llamar/.test(t)) { resumen = t.slice(0, 220); break; }
    }
    out.push({ id: "p" + id, titulo: m[1], url, precio, m2, zona, resumen, fotos, fuente: "Pisos.com" });
  });
  return out;
}
