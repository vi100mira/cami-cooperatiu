import { NextResponse } from "next/server";
import { db } from "./supabase";
import { checkPassword } from "./auth";
import { sesionActual } from "./session";
import { rateLimit } from "./guards";
import { hashFicticio } from "./http";

/**
 * Comprueba que quien llama es la persona que administra su grupo y que conoce su contraseña personal.
 * La contraseña se pide en cada acción de administración: no basta con la cookie, por si alguien usa un navegador ajeno.
 */
export async function exigirAdmin(password: unknown): Promise<{ ok: true; g: string; m: string } | { ok: false; res: NextResponse }> {
  const err = (error: string, status: number) => ({ ok: false as const, res: NextResponse.json({ error }, { status }) });
  const s = await sesionActual();
  if (!s?.m) return err("Confirma tu identidad primero.", 401);
  if (!rateLimit("admin:" + s.m, undefined, 10, 15 * 60_000)) return err("Demasiados intentos. Espera unos minutos.", 429);
  if (typeof password !== "string" || !password || password.length > 200) return err("Escribe tu contraseña personal para confirmar.", 400);

  const { data: m } = await db().from("miembros").select("id, es_admin, password_hash").eq("id", s.m).eq("grupo_id", s.g).maybeSingle();
  const ok = await checkPassword(password, m?.password_hash ?? (await hashFicticio()));
  if (!m) return err("Confirma tu identidad primero.", 401);
  if (!m.es_admin) return err("Solo quien administra el grupo puede hacer esto.", 403);
  if (!ok) return err("Contraseña incorrecta.", 401);
  return { ok: true, g: s.g, m: s.m };
}
