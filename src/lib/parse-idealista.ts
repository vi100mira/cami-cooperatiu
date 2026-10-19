import type { Listing } from "./parse-fotocasa";
import { zonaDeTitulo } from "./parse-ficha";

const HEAD = /\[([^\]]+)\]\((https:\/\/www\.idealista\.com\/inmueble\/(\d+)\/)[^)]*\)/;
const IMG = /!\[[^\]]*\]\((https:\/\/img\d*\.idealista\.com\/[^)\s]+)\)/;
const PRECIO = /^(\d{1,3}(?:\.\d{3})+|\d+)\s?€$/;
const M2 = /^(\d{1,3}(?:\.\d{3})*|\d+)\s?m²/;
const num = (x: string) => parseInt(x.replace(/\./g, ""), 10);

/**
 * Convierte el markdown de una página de resultados de Idealista en anuncios. Las fichas sueltas de Idealista no se
 * pueden leer (bloquea la lectura automática), pero las páginas de resultados sí, y ya traen precio, m², zona y foto.
 */
export function parseIdealista(md: string, max = 30): Listing[] {
  const lines = md.split("\n");
  const heads: number[] = [];
  lines.forEach((l, i) => { if (HEAD.test(l)) heads.push(i); });
  const out: Listing[] = [];
  const seen = new Set<string>();
  heads.forEach((h, k) => {
    if (out.length >= max) return;
    const m = lines[h].match(HEAD)!;
    const id = m[3];
    if (seen.has(id)) return;
    seen.add(id);
    const prev = k > 0 ? heads[k - 1] : 0;
    const fotos: string[] = [];
    for (let i = h - 1; i > prev && fotos.length < 1; i--) { const im = lines[i].match(IMG); if (im) fotos.push(im[1]); }
    const end = k + 1 < heads.length ? heads[k + 1] : Math.min(lines.length, h + 40);
    let precio: number | null = null, m2: number | null = null, resumen = "";
    for (let i = h + 1; i < end; i++) {
      const t = lines[i].trim();
      if (!t) continue;
      if (precio == null) { const p = t.match(PRECIO); if (p) { precio = num(p[1]); continue; } }
      if (m2 == null) { const a = t.match(M2); if (a) { m2 = num(a[1]); continue; } }
      if (!resumen && t.length > 40 && !/^[!\[#-]/.test(t)) resumen = t.slice(0, 220);
    }
    out.push({ id: "idealista-" + id, titulo: m[1], url: m[2], precio, m2, zona: zonaDeTitulo(m[1]), resumen, fotos, fuente: "Idealista" });
  });
  return out;
}
