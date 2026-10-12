// Validación de entrada en servidor. Todo lo que llega del navegador se trata como no fiable.
import { REGIONS } from "./content";

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugDesde(nombre: string): string {
  return nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

const texto = (x: unknown, min: number, max: number): string | null => {
  if (typeof x !== "string") return null;
  const t = x.trim();
  return t.length >= min && t.length <= max ? t : null;
};

export interface Alta {
  nombre: string; slug: string; grupoPassword: string;
  miembro: string; miembroPassword: string;
}

export function validarAlta(b: unknown): { ok: true; v: Alta } | { ok: false; error: string } {
  const o = (b && typeof b === "object" ? b : {}) as Record<string, unknown>;
  const nombre = texto(o.nombre, 2, 120);
  const slug = typeof o.slug === "string" && o.slug.trim() ? o.slug.trim() : slugDesde(String(o.nombre ?? ""));
  const grupoPassword = typeof o.password === "string" && o.password.length >= 8 && o.password.length <= 200 ? o.password : null;
  const miembro = texto(o.miembro, 1, 60);
  const miembroPassword = typeof o.miembroPassword === "string" && o.miembroPassword.length >= 8 && o.miembroPassword.length <= 200 ? o.miembroPassword : null;
  if (!nombre) return { ok: false, error: "Escribe el nombre del grupo (entre 2 y 120 caracteres)." };
  if (!SLUG.test(slug) || slug.length < 3 || slug.length > 60) return { ok: false, error: "El identificador solo admite letras minúsculas, números y guiones (3 a 60 caracteres)." };
  if (!grupoPassword) return { ok: false, error: "La contraseña del grupo debe tener entre 8 y 200 caracteres." };
  if (!miembro) return { ok: false, error: "Escribe tu nombre (hasta 60 caracteres)." };
  if (!miembroPassword) return { ok: false, error: "Tu contraseña personal debe tener entre 8 y 200 caracteres." };
  return { ok: true, v: { nombre, slug, grupoPassword, miembro, miembroPassword } };
}

// Lista blanca de lo que se guarda de una oferta. Cualquier otro campo se descarta.
export interface DatosOferta {
  titulo: string; zona: string | null; precio: number | null; m2: number | null;
  url: string; fuente: string | null; tipo: "edificios" | "terrenos";
}

const num = (x: unknown) => typeof x === "number" && Number.isFinite(x) && x >= 0 && x < 1e10 ? x : null;

export function datosOferta(x: unknown): { ok: true; v: DatosOferta } | { ok: false; error: string } {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const titulo = texto(o.titulo, 1, 200);
  const url = typeof o.url === "string" && /^https:\/\//.test(o.url) && o.url.length <= 500 ? o.url : null;
  const tipo = o.tipo === "edificios" || o.tipo === "terrenos" ? o.tipo : null;
  if (!titulo || !url || !tipo) return { ok: false, error: "La oferta no tiene título, enlace https o tipo válido." };
  return {
    ok: true,
    v: {
      titulo, url, tipo,
      zona: texto(o.zona, 0, 120) || null,
      precio: num(o.precio),
      m2: num(o.m2),
      fuente: texto(o.fuente, 0, 40) || null,
    },
  };
}

// Contraseña nueva (personal o de grupo): mismo criterio que en el alta.
export const passwordValida = (x: unknown): x is string => typeof x === "string" && x.length >= 8 && x.length <= 200;

// Datos de la cooperativa que comparten las personas del grupo. Lista blanca: ingresos y capital nunca se guardan.
export interface DatosGrupo { region: string; ciudad: string; familias: number; barrio: string; centro?: string; radio?: number; }

export function validarDatosGrupo(x: unknown): { ok: true; v: DatosGrupo } | { ok: false; error: string } {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const region = typeof o.region === "string" ? o.region : "";
  const ciudad = typeof o.ciudad === "string" ? o.ciudad.trim() : "";
  const barrio = typeof o.barrio === "string" ? o.barrio.trim() : "";
  const familias = typeof o.familias === "number" && Number.isInteger(o.familias) ? o.familias : NaN;
  if (region && !REGIONS.some((r) => r[0] === region)) return { ok: false, error: "Comunidad no válida." };
  if (ciudad.length > 80 || barrio.length > 80) return { ok: false, error: "La ciudad y el barrio admiten hasta 80 caracteres." };
  if (!(familias >= 1 && familias <= 200)) return { ok: false, error: "Las familias deben ser entre 1 y 200." };
  // Centro de acción y distancia máxima: opcionales, para que los datos guardados antes de existir sigan siendo válidos.
  const centro = typeof o.centro === "string" ? o.centro.trim() : undefined;
  if (centro !== undefined && centro.length > 80) return { ok: false, error: "El centro de acción admite hasta 80 caracteres." };
  if (o.radio !== undefined && !(typeof o.radio === "number" && Number.isInteger(o.radio) && o.radio >= 0 && o.radio <= 200)) return { ok: false, error: "La distancia máxima debe ser un número de km entre 0 y 200." };
  return { ok: true, v: { region, ciudad, familias, barrio, ...(centro !== undefined ? { centro } : {}), ...(o.radio !== undefined ? { radio: o.radio as number } : {}) } };
}
