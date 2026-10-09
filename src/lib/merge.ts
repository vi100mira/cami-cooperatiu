import type { Listing } from "./parse-fotocasa";

/**
 * Une listas de varios portales. Un mismo inmueble suele estar en varios: se considera el mismo
 * si coinciden precio y m² (ambos conocidos). Se conserva el primero y se anotan los otros portales.
 */
export function unirListados(listas: Listing[][]): Listing[] {
  const out: Listing[] = [];
  const idx = new Map<string, Listing>();
  for (const lista of listas) {
    for (const l of lista) {
      const key = l.precio && l.m2 ? `${l.precio}|${l.m2}` : null;
      const dup = key ? idx.get(key) : undefined;
      if (dup) {
        if (l.fuente && dup.fuente !== l.fuente && !(dup.otras ?? []).some((o) => o.fuente === l.fuente)) {
          dup.otras = [...(dup.otras ?? []), { fuente: l.fuente, url: l.url }];
        }
        if (!dup.gestora && l.gestora) dup.gestora = l.gestora;
        if (dup.fotos.length < 2 && l.fotos.length > dup.fotos.length) dup.fotos = l.fotos;
        continue;
      }
      const copia = { ...l };
      out.push(copia);
      if (key) idx.set(key, copia);
    }
  }
  return out;
}
