import type { State } from "./store";
import { viviendasEstimadas } from "./fit";

/**
 * Obra o rehabilitación supuesta por vivienda al simular un edificio de un anuncio, que no la indica.
 * Sale del ejemplo de las calculadoras (2.200.000 € para 20 viviendas) y es solo un punto de partida editable.
 */
export const OBRA_POR_VIVIENDA = 110_000;

/** Viviendas con las que calculan las calculadoras de cuota: las de la simulación en curso o, si no hay, las familias de la cooperativa. */
export const viviendasDeCalculo = (s: Pick<State, "sim" | "group">) => s.sim?.viv ?? s.group.fam;

interface Anuncio { titulo: string; zona?: string; precio?: number | null; m2?: number | null; viv?: number; url?: string; fuente?: string; foto?: string }

// Los valores de antes de simular se guardan una sola vez (aunque se simule varias veces seguidas) para poder volver a ellos.
function previos(s: State) {
  return s.sim?.previo ?? { suelo: s.calc.suelo, obra: s.calc.obra, precioTerreno: s.terreno.precio, superficieTerreno: s.terreno.superficie };
}
const ficha = (a: Anuncio) => ({ titulo: a.titulo, zona: a.zona, foto: a.foto, url: a.url, fuente: a.fuente });

/**
 * Simula un edificio de un anuncio: precio como «suelo o edificio», viviendas estimadas por sus m² y una obra supuesta.
 * No toca el número de familias de la cooperativa (que se comparte con el grupo): las viviendas viven en la simulación.
 */
export function simularEdificio(s: State, a: Anuncio): State {
  const previo = previos(s);
  const viv = (a.viv && a.viv > 0 ? Math.min(200, Math.round(a.viv)) : undefined) ?? viviendasEstimadas({ m2: a.m2 ?? null }, "edificios") ?? undefined;
  const suelo = a.precio ? a.precio : s.calc.suelo;
  const obra = (viv ?? s.group.fam) * OBRA_POR_VIVIENDA;
  return { ...s, calc: { ...s.calc, suelo, obra }, sim: { ...ficha(a), tipo: "edificios", viv, previo, puesto: { suelo, obra } } };
}

/** Simula un terreno de un anuncio en la calculadora «Del terreno a las viviendas»: precio y superficie. La clase de suelo y la edificabilidad no vienen en el anuncio. */
export function simularTerrenoAnuncio(s: State, a: Anuncio): State {
  const previo = previos(s);
  const precioTerreno = a.precio ? Math.round(a.precio) : s.terreno.precio;
  const superficieTerreno = a.m2 && a.m2 >= 1 ? Math.round(a.m2) : s.terreno.superficie;
  return { ...s, terreno: { ...s.terreno, precio: precioTerreno, superficie: superficieTerreno }, sim: { ...ficha(a), tipo: "terrenos", sinSuperficie: !(a.m2 && a.m2 >= 1), previo, puesto: { precioTerreno, superficieTerreno } } };
}

/** «Usar en las calculadoras de cuota» desde la calculadora del terreno: carga el coste del suelo urbanizado y las viviendas posibles. */
export function simularTerrenoCalculado(s: State, o: { coste: number; viviendas: number }): State {
  const previo = previos(s);
  const suelo = Math.round(o.coste);
  const viv = Math.max(1, Math.min(200, Math.round(o.viviendas)));
  return { ...s, calc: { ...s.calc, suelo }, sim: { titulo: "El terreno de «Del terreno a las viviendas»", tipo: "terreno-calculado", viv, previo, puesto: { suelo } } };
}

/** Quita la simulación y devuelve lo que se cambió, salvo lo que la persona haya vuelto a editar a mano desde entonces. */
export function quitarSimulacion(s: State): State {
  const { sim } = s;
  if (!sim) return s;
  const { previo, puesto } = sim;
  const calc = { ...s.calc }, terreno = { ...s.terreno };
  if (previo && puesto) {
    if (puesto.suelo !== undefined && calc.suelo === puesto.suelo) calc.suelo = previo.suelo;
    if (puesto.obra !== undefined && calc.obra === puesto.obra) calc.obra = previo.obra;
    if (puesto.precioTerreno !== undefined && terreno.precio === puesto.precioTerreno) terreno.precio = previo.precioTerreno;
    if (puesto.superficieTerreno !== undefined && terreno.superficie === puesto.superficieTerreno) terreno.superficie = previo.superficieTerreno;
  }
  return { ...s, calc, terreno, sim: null };
}
