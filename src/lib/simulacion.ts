import type { State } from "./store";
import { viviendasEstimadas, M2_POR_VIVIENDA } from "./fit";
import { calcTerreno, valoresDe, type TerrenoInput } from "./terreno";
import { normativaPara } from "./normativa";

/**
 * Obra o rehabilitación supuesta por m² construido cuando el anuncio no la indica. Sale del ejemplo de las calculadoras
 * (2.200.000 € para 20 viviendas de unos 80 m²) y es solo un punto de partida: depende del estado del edificio, y se puede cambiar.
 */
export const OBRA_POR_M2 = 1375;
/** Lo mismo expresado por vivienda, para cuando solo se conoce el número de viviendas y no los m². */
export const OBRA_POR_VIVIENDA = OBRA_POR_M2 * M2_POR_VIVIENDA;

/** Viviendas con las que calculan las calculadoras de cuota: las de la simulación en curso o, si no hay, las familias de la cooperativa. */
export const viviendasDeCalculo = (s: Pick<State, "sim" | "group">) => s.sim?.viv ?? s.group.fam;

interface Anuncio { titulo: string; zona?: string; precio?: number | null; m2?: number | null; viv?: number; url?: string; fuente?: string; foto?: string }

// Los valores de antes de simular se guardan una sola vez (aunque se simule varias veces seguidas) para poder volver a ellos.
function previos(s: State) {
  return s.sim?.previo ?? { suelo: s.calc.suelo, obra: s.calc.obra, precioTerreno: s.terreno.precio, superficieTerreno: s.terreno.superficie };
}
const ficha = (a: Anuncio) => ({ titulo: a.titulo, zona: a.zona, foto: a.foto, url: a.url, fuente: a.fuente });
const acotar = (v: number) => Math.max(1, Math.min(200, Math.round(v)));

/**
 * Simula un edificio de un anuncio: precio como «suelo o edificio», viviendas estimadas por sus m² y una obra supuesta
 * por m² (o por vivienda si solo se conocen las viviendas). No toca el número de familias de la cooperativa, que se
 * comparte con el grupo: las viviendas viven en la simulación.
 */
export function simularEdificio(s: State, a: Anuncio): State {
  const previo = previos(s);
  const viv = (a.viv && a.viv > 0 ? acotar(a.viv) : undefined) ?? (viviendasEstimadas({ m2: a.m2 ?? null }, "edificios") ?? undefined);
  const vivAcotadas = viv != null ? acotar(viv) : undefined;
  const suelo = a.precio ? a.precio : s.calc.suelo;
  const m2 = a.m2 && a.m2 > 0 ? a.m2 : undefined;
  const obra = Math.round(m2 && !a.viv ? m2 * OBRA_POR_M2 : (vivAcotadas ?? s.group.fam) * OBRA_POR_VIVIENDA);
  return { ...s, calc: { ...s.calc, suelo, obra }, sim: { ...ficha(a), tipo: "edificios", viv: vivAcotadas, m2: m2 && !a.viv ? m2 : undefined, previo, puesto: { suelo, obra } } };
}

// Viviendas posibles, coste del suelo ya urbanizado y techo construible de un terreno, con la normativa de la comunidad elegida.
function resultadoTerreno(s: State, terreno: TerrenoInput) {
  const r = calcTerreno(terreno, valoresDe(normativaPara(s.group.region), terreno), s.calc.interes);
  return { viviendas: r.viviendas, coste: r.costes.total, techo: r.techoCooperativa };
}

/**
 * Simula un terreno de un anuncio: carga precio y superficie en «Del terreno a las viviendas» y, con la clase de suelo y la
 * edificabilidad que haya ahí (el anuncio no las dice), calcula las viviendas posibles y lo lleva a las calculadoras de cuota,
 * con una obra supuesta por m² construido. Si el suelo no permite viviendas, solo se cargan precio y superficie.
 */
export function simularTerrenoAnuncio(s: State, a: Anuncio): State {
  const previo = previos(s);
  const precioTerreno = a.precio ? Math.round(a.precio) : s.terreno.precio;
  const superficieTerreno = a.m2 && a.m2 >= 1 ? Math.round(a.m2) : s.terreno.superficie;
  const terreno = { ...s.terreno, precio: precioTerreno, superficie: superficieTerreno };
  const r = resultadoTerreno(s, terreno);
  const sinSuperficie = !(a.m2 && a.m2 >= 1);
  if (r.viviendas < 1) {
    return { ...s, terreno, sim: { ...ficha(a), tipo: "terrenos", sinSuperficie, sinViviendas: true, previo, puesto: { precioTerreno, superficieTerreno } } };
  }
  const suelo = Math.round(r.coste), obra = Math.round(r.techo * OBRA_POR_M2);
  return { ...s, terreno, calc: { ...s.calc, suelo, obra }, sim: { ...ficha(a), tipo: "terrenos", sinSuperficie, viv: acotar(r.viviendas), m2: r.techo, previo, puesto: { precioTerreno, superficieTerreno, suelo, obra } } };
}

/** «Usar en las calculadoras de cuota» desde la calculadora del terreno: carga el coste del suelo urbanizado, las viviendas posibles y una obra supuesta. */
export function simularTerrenoCalculado(s: State, o: { coste: number; viviendas: number; techo: number }): State {
  const previo = previos(s);
  const suelo = Math.round(o.coste), obra = Math.round(o.techo * OBRA_POR_M2);
  return { ...s, calc: { ...s.calc, suelo, obra }, sim: { titulo: "El terreno de «Del terreno a las viviendas»", tipo: "terreno-calculado", viv: acotar(o.viviendas), m2: o.techo, previo, puesto: { suelo, obra } } };
}

/** Cambia la obra supuesta de la simulación expresándola por m² construido. Sin m² de referencia no hace nada. */
export function ajustarObraPorM2(s: State, eurPorM2: number): State {
  if (!s.sim?.m2 || !(eurPorM2 >= 0)) return s;
  const obra = Math.round(s.sim.m2 * eurPorM2);
  return { ...s, calc: { ...s.calc, obra }, sim: { ...s.sim, puesto: { ...s.sim.puesto, obra } } };
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
