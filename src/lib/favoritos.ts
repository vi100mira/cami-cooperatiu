import type { Listing } from "./parse-fotocasa";
import { tituloLegible } from "./fit";

export type Tipo = "edificios" | "terrenos";

/** Lo único que se guarda de una oferta en el servidor. Debe coincidir con la lista blanca de `validate.ts`. */
export interface DatosFav {
  titulo: string; zona: string | null; precio: number | null; m2: number | null;
  url: string; fuente: string | null; tipo: Tipo;
}

/** Identificador estable de una oferta: portal + id del anuncio. Si fuese demasiado largo (id = URL), se resume. */
export function ofertaIdDe(l: Pick<Listing, "id" | "fuente">): string {
  const fuente = l.fuente ?? "portal";
  const base = `${fuente}:${l.id}`;
  if (base.length <= 200) return base;
  let h = 5381;
  for (let i = 0; i < base.length; i++) h = ((h * 33) ^ base.charCodeAt(i)) >>> 0;
  return `${fuente}:h${h.toString(36)}`;
}

export function datosDeListing(l: Listing, tipo: Tipo): DatosFav {
  return {
    titulo: tituloLegible(l).slice(0, 200),
    zona: l.zona ? l.zona.slice(0, 120) : null,
    precio: l.precio,
    m2: l.m2,
    url: l.url,
    fuente: l.fuente ?? null,
    tipo,
  };
}
