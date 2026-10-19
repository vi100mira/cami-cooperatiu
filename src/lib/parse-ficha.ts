/** Lo que se puede sacar de la ficha de un anuncio o de su texto pegado a mano. Lo que no se encuentra queda en null. */
export interface DatosFicha { titulo: string | null; precio: number | null; m2: number | null; viv: number | null; fotos: string[]; resumen: string }

/** «Edificio en Calle dels Fusters, Benimàmet, València» → «Benimàmet, València» (sin la calle ni el número). Vacío si no hay «en». */
export function zonaDeTitulo(titulo: string) {
  const tras = titulo.split(/\sen\s/).slice(1).join(" en ");
  const partes = tras.split(",").map((x) => x.trim()).filter((x) => x && !/^\d+$/.test(x) && !/^s\/n$/i.test(x));
  return (partes.length > 2 ? partes.slice(-2) : partes).join(", ");
}

const num = (x: string) => parseInt(x.replace(/\./g, ""), 10);
// Importes con separador de miles (788.000 €) o de 5 cifras o más sin él; nunca los «€/m²».
const PRECIO = /(\d{1,3}(?:\.\d{3})+|\d{5,})\s?(?:€|euros?)(?!\s?\/)/i;
const M2_CONSTRUIDOS = /(\d{1,3}(?:\.\d{3})*|\d+)(?:,\d+)?\s?m(?:²|2)\s*(?:construidos|const\.?)/i;
const M2 = /(\d{1,3}(?:\.\d{3})*|\d+)(?:,\d+)?\s?m(?:²|2)(?![\w/])/i;
const VIV = /(\d{1,3})\s+(?:viviendas|pisos|apartamentos)\b/i;
const IMG = /!\[[^\]]*\]\((https:\/\/[^)\s]+\.(?:jpe?g|png|webp)[^)\s]*)\)/gi;

/**
 * Lee precio, m², viviendas, título y fotos de la ficha de un anuncio (markdown) o del texto que alguien copia de la web
 * del portal. Es tolerante a propósito: sirve para rellenar el formulario, que la persona revisa antes de usarlo.
 */
export function parseFicha(texto: string): DatosFicha {
  const lines = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const h1 = lines.find((l) => /^#\s/.test(l));
  const primera = lines.find((l) => l.length >= 8 && l.length <= 140 && !/^[!\[]/.test(l) && !PRECIO.test(l));
  const titulo = (h1 ? h1.replace(/^#+\s*/, "") : primera ?? null)?.replace(/\*/g, "").trim() || null;
  const p = texto.match(PRECIO);
  const m = texto.match(M2_CONSTRUIDOS) ?? texto.match(M2);
  const v = texto.match(VIV);
  const fotos = [...new Set([...texto.matchAll(IMG)].map((x) => x[1]))].slice(0, 6);
  const resumen = lines.find((l) => l.length > 60 && l !== h1 && l !== primera && !/^[!\[#-]/.test(l))?.slice(0, 220) ?? "";
  return { titulo, precio: p ? num(p[1]) : null, m2: m ? num(m[1]) : null, viv: v ? parseInt(v[1], 10) : null, fotos, resumen };
}
