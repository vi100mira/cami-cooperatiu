import { NextResponse } from "next/server";
import { db, anotarActividad } from "@/lib/supabase";
import { checkPassword } from "@/lib/auth";
import { sesionActual, fijarSesion } from "@/lib/session";
import { rateLimit } from "@/lib/guards";
import { hashFicticio, ipDe, UUID } from "@/lib/http";

// Confirmar identidad: el miembro elegido introduce su contraseña personal.
export async function POST(req: Request) {
  const s = await sesionActual();
  if (!s) return NextResponse.json({ error: "Entra primero al grupo." }, { status: 401 });
  if (!rateLimit("miembro-entrar:" + ipDe(req), undefined, 20, 15 * 60_000))
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });

  const b = (await req.json().catch(() => null)) as { miembroId?: unknown; password?: unknown } | null;
  const miembroId = typeof b?.miembroId === "string" && UUID.test(b.miembroId) ? b.miembroId : null;
  const password = typeof b?.password === "string" ? b.password : "";
  if (!miembroId || !password || password.length > 200)
    return NextResponse.json({ error: "Elige tu nombre y escribe tu contraseña." }, { status: 400 });

  // El miembro debe pertenecer al grupo de la sesión; si no, se responde igual que a una contraseña mala.
  const { data: m } = await db().from("miembros")
    .select("id, nombre, password_hash").eq("id", miembroId).eq("grupo_id", s.g).maybeSingle();
  const ok = await checkPassword(password, m?.password_hash ?? (await hashFicticio()));
  if (!m || !ok)
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });

  await anotarActividad(s.g);
  await fijarSesion({ g: s.g, m: m.id });
  return NextResponse.json({ ok: true, nombre: m.nombre });
}
