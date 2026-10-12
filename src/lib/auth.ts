import bcrypt from "bcryptjs";
import { createHmac, randomInt, timingSafeEqual } from "crypto";

// Contraseñas: siempre hash bcrypt, nunca texto plano.
const COST = 12;
export const hashPassword = (p: string) => bcrypt.hash(p, COST);
export const checkPassword = (p: string, hash: string) => bcrypt.compare(p, hash);

// Código de recuperación del grupo: 20 caracteres sin los ambiguos (0/O, 1/I/L), unos 100 bits. Se muestra una vez y solo se guarda su huella.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function generarCodigo(): string {
  const c = Array.from({ length: 20 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
  return c.match(/.{5}/g)!.join("-");
}
/** Quita guiones y espacios y pasa a mayúsculas, para que se pueda escribir con o sin guiones. */
export const normalizarCodigo = (c: string) => c.replace(/[\s-]/g, "").toUpperCase();

// Sesión: token firmado (HMAC-SHA256) con { g: grupo, m?: miembro, exp }. Sin secreto no se puede falsificar.
export interface Sesion { g: string; m?: string; exp: number; }
const secreto = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET ausente o demasiado corta");
  return s;
};
const firma = (cuerpo: string) => createHmac("sha256", secreto()).update(cuerpo).digest("base64url");

export function firmar(datos: { g: string; m?: string }, horas = 12, now = Date.now()): string {
  const cuerpo = Buffer.from(JSON.stringify({ ...datos, exp: now + horas * 3600_000 })).toString("base64url");
  return `${cuerpo}.${firma(cuerpo)}`;
}

export function leer(token: string | undefined, now = Date.now()): Sesion | null {
  if (!token) return null;
  const [cuerpo, sig] = token.split(".");
  if (!cuerpo || !sig) return null;
  const a = Buffer.from(sig), b = Buffer.from(firma(cuerpo));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(cuerpo, "base64url").toString()) as Sesion;
    return typeof s.g === "string" && s.exp > now ? s : null;
  } catch { return null; }
}
