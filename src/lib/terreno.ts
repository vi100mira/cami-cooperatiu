import { EDITABLES, type NormativaResuelta, type ParamKey } from "./normativa";

export type ClaseSuelo = "urbano-solar" | "urbano-por-urbanizar" | "urbanizable" | "no-urbanizable";

export interface TerrenoInput {
  clase: ClaseSuelo;
  /** Superficie del terreno que se compra, en m². */
  superficie: number;
  precio: number;
  /** Edificabilidad prevista, en m² de techo por m² de suelo. */
  edif: number;
  /** Superficie construida por vivienda, con su parte de zonas comunes. */
  m2Vivienda: number;
  /** Años hasta poder construir: se paga el interés del suelo mientras tanto. */
  anios: number;
  /** Otros costes de urbanización: honorarios, conexiones a redes generales, IVA… */
  otros: number;
  /** Cambios sobre las estimaciones; si no hay valor, se usa la referencia. */
  vialesPor100?: number;
  costeViales?: number;
  costeVerdes?: number;
}

export const TDEF: TerrenoInput = { clase: "urbanizable", superficie: 10000, precio: 600000, edif: 1, m2Vivienda: 90, anios: 3, otros: 0 };

export const CLASES: { id: ClaseSuelo; nombre: string; ayuda: string }[] = [
  { id: "urbano-solar", nombre: "Suelo urbano que ya es solar", ayuda: "Tiene todos los servicios y se puede edificar casi directamente. Es el más caro por m², pero con menos plazo y costes añadidos." },
  { id: "urbano-por-urbanizar", nombre: "Suelo urbano que falta por urbanizar", ayuda: "Está dentro de la ciudad, pero hay que completar la urbanización y ceder parte del aprovechamiento." },
  { id: "urbanizable", nombre: "Suelo urbanizable (sin desarrollar)", ayuda: "Barato por m² porque aún no es edificable. Exige planeamiento, urbanización, cesiones y varios años de espera." },
  { id: "no-urbanizable", nombre: "Suelo no urbanizable (rústico)", ayuda: "Con carácter general no permite construir vivienda colectiva. Solo serviría si se reclasifica, y eso es lento e incierto." },
];

/** Qué reglas importan según la clase de suelo, en el orden en que se muestran. */
export function parametrosRelevantes(clase: ClaseSuelo): ParamKey[] {
  switch (clase) {
    case "urbanizable": return ["edifMax", "densMax", "dotPublica", "dotVerde", "cesionUrbanizable", "reservaVPP", "vialesPor100", "costeViales", "costeVerdes"];
    case "urbano-por-urbanizar": return ["dotPublica", "dotVerde", "cesionUrbanoUE", "reservaVPP", "vialesPor100", "costeViales", "costeVerdes"];
    default: return [];
  }
}

export type Aviso = "no-urbanizable" | "edif-recortada" | "densidad" | "sin-viviendas" | "por-urbanizar" | "solar";

export interface TerrenoResultado {
  clase: ClaseSuelo;
  edificable: boolean;
  sueloBruto: number;
  viales: number; verdes: number; otrasDotaciones: number;
  sueloEdificable: number; pctEdificable: number;
  edifAplicada: number;
  techoTotal: number; cesionTecho: number; cesionPct: number; techoCooperativa: number;
  reservaVPPPct: number; reservaVPPTecho: number;
  viviendasSector: number; viviendas: number;
  costes: { suelo: number; viales: number; verdes: number; urbanizacion: number; otros: number; espera: number; total: number };
  porM2Techo: number | null; sueloPorM2Techo: number | null; porVivienda: number | null;
  avisos: Aviso[];
}

const pos = (x: unknown) => { const n = +(x as number); return Number.isFinite(n) && n > 0 ? n : 0; };

/** Valores numéricos de cada parámetro, con los cambios que la persona haya hecho a las estimaciones. */
export function valoresDe(n: NormativaResuelta, t: TerrenoInput): Record<ParamKey, number> {
  const v = {} as Record<ParamKey, number>;
  for (const k of Object.keys(n.params) as ParamKey[]) {
    const propio = EDITABLES.includes(k) ? (t as unknown as Record<string, number | undefined>)[k] : undefined;
    v[k] = typeof propio === "number" && Number.isFinite(propio) && propio >= 0 ? propio : n.params[k].valor;
  }
  return v;
}

export function calcTerreno(t: TerrenoInput, p: Record<ParamKey, number>, interes: number): TerrenoResultado {
  const S = pos(t.superficie);
  const precio = pos(t.precio);
  const otros = pos(t.otros);
  const anios = pos(t.anios);
  const m2 = Math.max(1, pos(t.m2Vivienda) || 90);
  const clase = t.clase;
  const avisos: Aviso[] = [];

  const vacio = (): TerrenoResultado => ({
    clase, edificable: false, sueloBruto: S, viales: 0, verdes: 0, otrasDotaciones: 0, sueloEdificable: 0, pctEdificable: 0, edifAplicada: 0,
    techoTotal: 0, cesionTecho: 0, cesionPct: 0, techoCooperativa: 0, reservaVPPPct: 0, reservaVPPTecho: 0, viviendasSector: 0, viviendas: 0,
    costes: { suelo: precio, viales: 0, verdes: 0, urbanizacion: 0, otros, espera: 0, total: precio + otros },
    porM2Techo: null, sueloPorM2Techo: null, porVivienda: null, avisos,
  });
  if (clase === "no-urbanizable") { avisos.push("no-urbanizable"); return vacio(); }

  const urbanizable = clase === "urbanizable";
  const aUrbanizar = urbanizable || clase === "urbano-por-urbanizar";
  const edifPedida = pos(t.edif);
  const edifAplicada = urbanizable ? Math.min(edifPedida, p.edifMax) : edifPedida;
  if (urbanizable && edifPedida > p.edifMax) avisos.push("edif-recortada");
  if (clase === "urbano-por-urbanizar") avisos.push("por-urbanizar");
  if (clase === "urbano-solar") avisos.push("solar");

  const techoTotal = S * edifAplicada;
  const dotTotal = aUrbanizar ? (p.dotPublica * techoTotal) / 100 : 0;
  const verdes = aUrbanizar ? Math.min(dotTotal, (p.dotVerde * techoTotal) / 100) : 0;
  const otrasDotaciones = dotTotal - verdes;
  const viales = aUrbanizar ? (p.vialesPor100 * techoTotal) / 100 : 0;
  const sueloEdificable = aUrbanizar ? Math.max(0, S - dotTotal - viales) : S;

  const cesionPct = urbanizable ? p.cesionUrbanizable : clase === "urbano-por-urbanizar" ? p.cesionUrbanoUE : 0;
  const cesionTecho = (techoTotal * cesionPct) / 100;
  const techoCooperativa = techoTotal - cesionTecho;
  const reservaVPPPct = aUrbanizar ? p.reservaVPP : 0;

  const viviendasSector = techoTotal / m2;
  const capViviendas = urbanizable ? (p.densMax * S) / 10000 : Infinity;
  const factor = viviendasSector > capViviendas && viviendasSector > 0 ? capViviendas / viviendasSector : 1;
  if (factor < 1) avisos.push("densidad");
  const viviendas = Math.floor((techoCooperativa / m2) * factor + 1e-9);
  if (viviendas < 1) avisos.push("sin-viviendas");

  const cViales = viales * p.costeViales;
  const cVerdes = verdes * p.costeVerdes;
  const urbanizacion = cViales + cVerdes;
  const espera = precio * (Math.pow(1 + Math.max(0, +interes || 0) / 100, anios) - 1);
  const total = precio + urbanizacion + otros + espera;

  return {
    clase, edificable: techoTotal > 0, sueloBruto: S, viales, verdes, otrasDotaciones, sueloEdificable, pctEdificable: S > 0 ? sueloEdificable / S : 0,
    edifAplicada, techoTotal, cesionTecho, cesionPct, techoCooperativa, reservaVPPPct, reservaVPPTecho: (techoTotal * reservaVPPPct) / 100,
    viviendasSector, viviendas,
    costes: { suelo: precio, viales: cViales, verdes: cVerdes, urbanizacion, otros, espera, total },
    porM2Techo: techoCooperativa > 0 ? total / techoCooperativa : null,
    sueloPorM2Techo: techoCooperativa > 0 ? precio / techoCooperativa : null,
    porVivienda: viviendas > 0 ? total / viviendas : null,
    avisos,
  };
}
