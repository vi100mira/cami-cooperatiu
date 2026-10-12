import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { hashPassword, generarCodigo, normalizarCodigo } from "@/lib/auth";
import { fijarSesion } from "@/lib/session";
import { validarAlta } from "@/lib/validate";
import { rateLimit } from "@/lib/guards";
import { ipDe } from "@/lib/http";

// Alta de grupo: crea el grupo y su primer miembro (que lo administra), y deja la sesión iniciada.
export async function POST(req: Request) {
  if (!rateLimit("alta:" + ipDe(req), undefined, 10, 15 * 60_000))
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });

  const r = validarAlta(await req.json().catch(() => null));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  const { nombre, slug, grupoPassword, miembro, miembroPassword } = r.v;

  const sb = db();
  const codigo = generarCodigo();
  const [gh, mh, rh] = await Promise.all([hashPassword(grupoPassword), hashPassword(miembroPassword), hashPassword(normalizarCodigo(codigo))]);

  const { data: g, error: eg } = await sb.from("grupos_cooperativos")
    .insert({ nombre, slug, password_hash: gh, recovery_hash: rh }).select("id").single();
  if (eg) {
    const dup = eg.code === "23505";
    return NextResponse.json(
      { error: dup ? "Ese identificador ya está en uso. Prueba con otro." : "No se ha podido crear el grupo." },
      { status: dup ? 409 : 500 },
    );
  }

  const { data: m, error: em } = await sb.from("miembros")
    .insert({ grupo_id: g.id, nombre: miembro, password_hash: mh, es_admin: true }).select("id").single();
  if (em) {
    // Sin primer miembro el grupo no sirve: se deshace para no dejar datos a medias.
    await sb.from("grupos_cooperativos").delete().eq("id", g.id);
    return NextResponse.json({ error: "No se ha podido crear el grupo." }, { status: 500 });
  }

  await fijarSesion({ g: g.id, m: m.id });
  // El código de recuperación se devuelve solo esta vez; en la base queda su huella.
  return NextResponse.json({ ok: true, slug, codigo });
}
