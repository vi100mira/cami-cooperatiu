export interface Listing {
  id: string;
  titulo: string;
  url: string;
  precio: number | null;
  m2: number | null;
  zona: string;
  resumen: string;
  fotos: string[];
  /** Portal de origen (se rellena al unir resultados). */
  fuente?: string;
  /** El mismo inmueble en otros portales. */
  otras?: { fuente: string; url: string }[];
}

const JUNK_SLUGS = new Set(["ascensor", "todas-las-zonas", "valencia", "valencia-capital"]);
const IMG = /!\[[^\]]*\]\((https:\/\/static\.fotocasa\.es\/images\/[^)\s]+)\)/;
const GALLERY = /^\[1\/\d+\]\(/;
const HEAD = /^### \[\*\*(.+?)\*\*[^\]]*\]\((https:\/\/www\.fotocasa\.es\/[^)\s]+)\)/;

function pretty(slug: string) {
  return slug.split("-").map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

/** Convierte el markdown de una página de resultados de Fotocasa en una lista de anuncios. Pura y testeable. */
export function parseFotocasa(md: string, max = 30): Listing[] {
  const lines = md.split("\n");
  const heads: number[] = [];
  lines.forEach((l, i) => { if (HEAD.test(l)) heads.push(i); });
  const out: Listing[] = [];
  const seen = new Set<string>();
  heads.forEach((h, k) => {
    if (out.length >= max) return;
    const m = lines[h].match(HEAD)!;
    const url = m[2].split("?")[0];
    const idm = url.match(/\/(\d+)\/d$/);
    const id = idm ? idm[1] : url;
    if (seen.has(id)) return;
    seen.add(id);
    const prev = k > 0 ? heads[k - 1] : 0;
    let precio: number | null = null;
    for (let i = h - 1; i >= Math.max(prev, h - 12); i--) {
      const p = lines[i].trim().match(/^(\d{1,3}(?:\.\d{3})+)\s?€/);
      if (p) { precio = parseInt(p[1].replace(/\./g, ""), 10); break; }
    }
    let start = prev;
    for (let i = h - 1; i > prev; i--) { if (GALLERY.test(lines[i])) { start = i; break; } }
    const fotos: string[] = [];
    for (let i = start; i < h && fotos.length < 6; i++) {
      const im = lines[i].match(IMG);
      if (im && !fotos.includes(im[1])) fotos.push(im[1]);
    }
    const end = k + 1 < heads.length ? heads[k + 1] : Math.min(lines.length, h + 80);
    let m2: number | null = null, resumen = "";
    for (let i = h + 1; i < Math.min(end, h + 80); i++) {
      const t = lines[i].trim();
      if (m2 == null) {
        const a = t.match(/^- (\d{1,3}(?:\.\d{3})*|\d+)\s?m²$/);
        if (a) m2 = parseInt(a[1].replace(/\./g, ""), 10);
      }
      if (!resumen && t.length > 40 && !t.startsWith("-") && !t.startsWith("!") && !t.startsWith("[") && !t.startsWith("#")) {
        resumen = t.slice(0, 220);
      }
    }
    const seg = url.split("/");
    const idx = seg.findIndex((s) => s.startsWith("valencia"));
    const slug = idx >= 0 ? seg[idx + 1] : "";
    out.push({ id, titulo: m[1].replace(/\*/g, ""), url, precio, m2, zona: slug && !JUNK_SLUGS.has(slug) && !/^\d+$/.test(slug) ? pretty(slug) : "València", resumen, fotos });
  });
  return out;
}
