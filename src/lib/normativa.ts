import { fnum } from "./format";
import { regionName } from "./content";

/**
 * Registro de normativa urbanística por comunidad autónoma, para la calculadora de terreno.
 * Cada cifra lleva su fuente, la fecha en que se consultó y su fiabilidad. Añadir una comunidad es añadir datos
 * a REGISTRO, sin tocar el cálculo ni la interfaz. Ver docs/00-gobierno/06-adr-0002-normativa-por-comunidad.md.
 *
 * Regla de oro: una cifra de una comunidad nunca se presenta como si fuera de otra. Si falta, se cae al marco
 * estatal y, en último término, a una referencia orientativa que se marca como tal.
 */

export type Verificacion = "verificada" | "comprobar" | "estimacion";
export type Origen = "comunidad" | "estado" | "referencia" | "referencia-cv";

export interface Fuente {
  norma: string;
  articulo: string;
  url: string;
  consultada: string;
  /** El texto se leyó en un portal que reproduce la norma consolidada, no en el diario oficial. */
  secundaria?: boolean;
}
export interface Param { valor: number; verif: Verificacion; fuente: Fuente; rango?: [number, number]; nota?: string }
export interface Resuelto extends Param { origen: Origen }

export type ParamKey =
  | "dotPublica" | "dotVerde" | "edifMax" | "densMax"
  | "cesionUrbanizable" | "cesionUrbanoUE" | "reservaVPP"
  | "vialesPor100" | "costeViales" | "costeVerdes";

export const PARAM_KEYS: ParamKey[] = ["dotPublica", "dotVerde", "edifMax", "densMax", "cesionUrbanizable", "cesionUrbanoUE", "reservaVPP", "vialesPor100", "costeViales", "costeVerdes"];

/** Estimaciones que la persona puede cambiar. El resto son reglas legales y no se editan. */
export const EDITABLES: ParamKey[] = ["vialesPor100", "costeViales", "costeVerdes"];

export const PARAMS: Record<ParamKey, { etiqueta: string; regla: (v: number) => string }> = {
  dotPublica: { etiqueta: "Dotación pública no viaria", regla: (v) => `al menos ${fnum(v, 0)} m² de suelo por cada 100 m² de techo` },
  dotVerde: { etiqueta: "Zonas verdes dentro de esa dotación", regla: (v) => `al menos ${fnum(v, 0)} m² por cada 100 m² de techo` },
  edifMax: { etiqueta: "Edificabilidad máxima", regla: (v) => `como máximo ${fnum(v, 2)} m² de techo por m² de suelo` },
  densMax: { etiqueta: "Densidad máxima", regla: (v) => `como máximo ${fnum(v, 0)} viviendas por hectárea` },
  cesionUrbanizable: { etiqueta: "Cesión a la administración (suelo urbanizable)", regla: (v) => `${fnum(v, 0)} % del aprovechamiento` },
  cesionUrbanoUE: { etiqueta: "Cesión a la administración (suelo urbano por urbanizar)", regla: (v) => `${fnum(v, 0)} % del aprovechamiento` },
  reservaVPP: { etiqueta: "Reserva para vivienda protegida", regla: (v) => `${fnum(v, 0)} % de la edificabilidad residencial` },
  vialesPor100: { etiqueta: "Superficie de viales", regla: (v) => `${fnum(v, 0)} m² por cada 100 m² de techo` },
  costeViales: { etiqueta: "Coste de urbanizar viales", regla: (v) => `${fnum(v, 0)} € por m²` },
  costeVerdes: { etiqueta: "Coste de urbanizar zonas verdes", regla: (v) => `${fnum(v, 0)} € por m²` },
};

const D11 = "2026-10-11";
const D12 = "2026-10-12";
const BOE_TRLOTUP = "https://www.boe.es/buscar/act.php?id=DOGV-r-2021-90283";
const BOE_TRLS = "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11723";
const PEPRI_VALENCIA = "https://mhv.valencia.es/ayuntamiento/urbanismo2.nsf/0/CA6E7A9E264EC5E0C1258E12002B63A9/$FILE/2IP.%208_PEPRI%20SMR.%20MEMORIA%20VIABILIDAD%20ECON%C3%93MICA_firmado_firmado.pdf?OpenElement";
const LOTUP = "LOTUP, texto refundido (Decreto Legislativo 1/2021), texto consolidado del BOE actualizado el 10/08/2026";

export interface Normativa { nombre: string; revisada: string; params: Partial<Record<ParamKey, Param>> }

const CV: Normativa = {
  nombre: "Comunitat Valenciana",
  revisada: D12,
  params: {
    dotPublica: { valor: 35, verif: "verificada", fuente: { norma: LOTUP, articulo: "36.2.a", url: BOE_TRLOTUP, consultada: D12 }, nota: "Es la regla para sectores de uso residencial. En suelo industrial o terciario las reglas son otras." },
    dotVerde: { valor: 15, verif: "verificada", fuente: { norma: LOTUP, articulo: "36.2.a", url: BOE_TRLOTUP, consultada: D12 } },
    edifMax: { valor: 1, verif: "verificada", fuente: { norma: LOTUP, articulo: "36.3", url: BOE_TRLOTUP, consultada: D12 }, nota: "Es el tope para sectores de suelo urbanizable residencial." },
    densMax: { valor: 100, verif: "verificada", fuente: { norma: LOTUP, articulo: "36.3", url: BOE_TRLOTUP, consultada: D12 } },
    cesionUrbanizable: { valor: 10, verif: "verificada", fuente: { norma: LOTUP, articulo: "82.1.a", url: BOE_TRLOTUP, consultada: D12 }, nota: "Excepcionalmente puede subir hasta el 20 % si la rentabilidad del sector es sensiblemente superior." },
    cesionUrbanoUE: { valor: 5, verif: "verificada", fuente: { norma: LOTUP, articulo: "82.1.c", url: BOE_TRLOTUP, consultada: D12 }, nota: "Para suelo urbano por urbanizar en unidades de ejecución, sin incremento de aprovechamiento." },
    reservaVPP: {
      valor: 30, verif: "comprobar",
      fuente: { norma: LOTUP, articulo: "33.1.a", url: BOE_TRLOTUP, consultada: D12 },
      nota: "El texto valenciano dice 30 %, pero el Estado fija un mínimo del 40 % (RDL 7/2015, art. 20.1, tras la Ley 12/2023), con posibilidad de una reserva inferior por ley autonómica: la cifra queda por comprobar. Están exentos de esta reserva los planes de municipios de menos de 10.000 habitantes con menos de cinco viviendas autorizadas por cada mil habitantes y año en los dos últimos años, siempre que no ordenen más de 100 viviendas nuevas, y las reformas de la urbanización con menos de 200 viviendas (art. 33.3, en vigor desde el 10/12/2024).",
    },
  },
};

const ESTADO: Normativa = {
  nombre: "Marco estatal",
  revisada: D11,
  params: {
    reservaVPP: { valor: 40, verif: "verificada", fuente: { norma: "Texto refundido de la Ley de Suelo y Rehabilitación Urbana (RDL 7/2015)", articulo: "20.1", url: BOE_TRLS, consultada: D11 }, nota: "Mínimo general en nueva urbanización. La ley de cada comunidad puede fijar una reserva inferior." },
    cesionUrbanizable: {
      valor: 10, rango: [5, 15], verif: "comprobar",
      fuente: { norma: "Texto refundido de la Ley de Suelo y Rehabilitación Urbana (RDL 7/2015)", articulo: "18", url: BOE_TRLS, consultada: D11 },
      nota: "El Estado marca un rango (entre el 5 % y el 15 %, y hasta el 20 % de forma excepcional): el 10 % es un valor intermedio de ejemplo.",
    },
  },
};

const REFERENCIA: Normativa = {
  nombre: "Referencias de coste",
  revisada: D12,
  params: {
    vialesPor100: { valor: 20, verif: "estimacion", fuente: { norma: "Fundación CIEC, método de la superficie de viales", articulo: "parámetro orientativo", url: "https://fundacionciec.net/incec/visorurbanizaciones.wgx", consultada: D11 }, nota: "Es un método de estimación, no una norma: cada plan fija sus viales." },
    costeViales: {
      valor: 125, verif: "estimacion",
      fuente: { norma: "Ayuntamiento de València, PEPRI del ámbito T-1 San Miguel de los Reyes, memoria de viabilidad económica (abril de 2026)", articulo: "coste de urbanización, módulos IVE con coeficiente 1,50", url: PEPRI_VALENCIA, consultada: D12 },
      nota: "125 €/m² para urbanizar (100 €/m² en reurbanización). Contraste: un documento de Olocau de enero de 2018, también con módulos del IVE, daba entre 122 y 161 €/m² de viales; el Ayuntamiento de València usaba 240 €/m² en 2010. Varía mucho según el plan y el ámbito.",
    },
    costeVerdes: {
      valor: 55, verif: "estimacion",
      fuente: { norma: "Ayuntamiento de València, PEPRI del ámbito T-1 San Miguel de los Reyes, memoria de viabilidad económica (abril de 2026)", articulo: "coste de urbanización, módulos IVE con coeficiente 1,50", url: PEPRI_VALENCIA, consultada: D12 },
      nota: "55 €/m² de zona verde (70 la plaza ajardinada). Contraste: Olocau, enero de 2018, entre 44 y 52 €/m². Varía mucho según el plan y el ámbito.",
    },
  },
};

/** Comunidades con normativa cargada, por el id de REGIONS en content.ts. */
export const REGISTRO: Record<string, Normativa> = { cv: CV };
export const comunidadCargada = (region: string) => region in REGISTRO;

/** Un parámetro puede heredar el valor de otro cuando el marco estatal no lo distingue. */
const ALIAS: Partial<Record<ParamKey, ParamKey>> = { cesionUrbanoUE: "cesionUrbanizable" };

export interface NormativaResuelta {
  region: string;
  /** Nombre que se muestra: la comunidad elegida o «tu comunidad». */
  nombre: string;
  cargada: boolean;
  revisada: string | null;
  params: Record<ParamKey, Resuelto>;
}

/**
 * Resuelve cada parámetro con este orden de respaldo: la comunidad, el marco estatal, las referencias de coste y,
 * en último término, la referencia valenciana. Lo que no es de la comunidad nunca queda como «verificada para ti»:
 * la referencia valenciana se degrada siempre a estimación.
 */
export function normativaPara(region: string): NormativaResuelta {
  const propia = REGISTRO[region];
  const params = {} as Record<ParamKey, Resuelto>;
  for (const k of PARAM_KEYS) {
    const deComunidad = propia?.params[k];
    if (deComunidad) { params[k] = { ...deComunidad, origen: "comunidad" }; continue; }
    const deEstado = ESTADO.params[k] ?? (ALIAS[k] ? ESTADO.params[ALIAS[k]!] : undefined);
    if (deEstado) { params[k] = { ...deEstado, origen: "estado" }; continue; }
    const deRef = REFERENCIA.params[k];
    if (deRef) { params[k] = { ...deRef, origen: "referencia" }; continue; }
    const deCv = CV.params[k] ?? (ALIAS[k] ? CV.params[ALIAS[k]!] : undefined);
    if (!deCv) throw new Error(`Sin dato para ${k}`);
    params[k] = {
      ...deCv, verif: "estimacion", origen: "referencia-cv",
      nota: "Referencia de la Comunitat Valenciana: no es la norma de tu comunidad. Úsala solo como ejemplo.",
    };
  }
  return {
    region,
    nombre: propia ? propia.nombre : regionName(region) || "tu comunidad",
    cargada: !!propia,
    revisada: propia?.revisada ?? null,
    params,
  };
}

export const ORIGEN_TEXTO: Record<Origen, string> = {
  comunidad: "Norma de tu comunidad",
  estado: "Marco estatal",
  referencia: "Referencia de coste",
  "referencia-cv": "Referencia valenciana, no es tu norma",
};
export const VERIF_TEXTO: Record<Verificacion, string> = {
  verificada: "Verificada",
  comprobar: "Comprobar vigencia",
  estimacion: "Estimación",
};
