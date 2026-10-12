import { NextResponse } from "next/server";
import { db, anotarActividad } from "@/lib/supabase";
import { checkPassword } from "@/lib/auth";
import { fijarSesion } from "@/lib/session";
import { rateLimit } from "@/lib/guards";
import { hashFicticio, ipDe } from "@/lib/http";

// Entrar al grupo con su identificador y contraseña de grupo.
export async function POST(req: Request) {
  if (!rateLimit("entrar:" + ipDe(req), undefined, 10, 15 * 60_000))
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });

  const b = (await req.json().catch(() => null)) as { slug?: unknown; password?: unknown } | null;
  const slug = typeof b?.slug === "string" ? b.slug.trim() : "";
  const password = typeof b?.password === "string" ? b.password : "";
  if (!slug || !password || password.length > 200)
    return NextResponse.json({ error: "Escribe el identificador y la contraseña del grupo." }, { status: 400 });

  const { data: g } = await db().from("grupos_cooperativos")
    .select("id, nombre, slug, password_hash").eq("slug", slug).maybeSingle();
  const ok = await checkPassword(password, g?.password_hash ?? (await hashFicticio()));
  if (!g || !ok)
    return NextResponse.json({ error: "Grupo o contraseña incorrectos." }, { status: 401 });

  await anotarActividad(g.id);
  await fijarSesion({ g: g.id });
  return NextResponse.json({ ok: true, nombre: g.nombre, slug: g.slug });
}
