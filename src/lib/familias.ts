// Familias: texto libre que escribe cada persona al unirse al grupo. Se agrupan sin distinguir mayúsculas,
// tildes ni espacios de más («García», «garcia  » y «GARCÍA» son la misma familia).

export const FAMILIA_MAX = 60;

/** Quita espacios sobrantes y recorta. Devuelve "" si no hay nada que guardar. */
export const limpiarFamilia = (x: unknown): string =>
  typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, FAMILIA_MAX) : "";

/** Clave para comparar familias: sin tildes, en minúsculas y con los espacios normalizados. */
export const claveFamilia = (x: unknown): string =>
  limpiarFamilia(x).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export interface ConFamilia { familia?: string | null }

/** Familias distintas, con la grafía de la primera persona que la escribió. */
export function familiasDistintas(personas: ConFamilia[]): string[] {
  const vistas = new Map<string, string>();
  for (const p of personas) {
    const k = claveFamilia(p.familia);
    if (k && !vistas.has(k)) vistas.set(k, limpiarFamilia(p.familia));
  }
  return [...vistas.values()];
}

/** Si ya existe una familia equivalente, devuelve su grafía; si no, la escrita (limpia). */
export function canonicaFamilia(escrita: unknown, existentes: string[]): string {
  const k = claveFamilia(escrita);
  if (!k) return "";
  return existentes.find((e) => claveFamilia(e) === k) ?? limpiarFamilia(escrita);
}

export interface GrupoFamilia<T> { familia: string | null; personas: T[] }

/** Personas agrupadas por familia (orden alfabético); quienes no la han indicado van al final. */
export function agruparPorFamilia<T extends ConFamilia & { nombre: string }>(personas: T[]): GrupoFamilia<T>[] {
  const mapa = new Map<string, GrupoFamilia<T>>();
  const sin: T[] = [];
  for (const p of personas) {
    const k = claveFamilia(p.familia);
    if (!k) { sin.push(p); continue; }
    if (!mapa.has(k)) mapa.set(k, { familia: limpiarFamilia(p.familia), personas: [] });
    mapa.get(k)!.personas.push(p);
  }
  const porNombre = (a: T, b: T) => a.nombre.localeCompare(b.nombre, "es");
  const grupos = [...mapa.values()].sort((a, b) => a.familia!.localeCompare(b.familia!, "es"));
  grupos.forEach((g) => g.personas.sort(porNombre));
  if (sin.length) grupos.push({ familia: null, personas: sin.sort(porNombre) });
  return grupos;
}

/** Coincidencia entre dos familias escritas (para «solo de mi familia»). */
export const mismaFamilia = (a: unknown, b: unknown): boolean => { const k = claveFamilia(a); return k !== "" && k === claveFamilia(b); };
