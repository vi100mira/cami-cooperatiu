import { NextResponse } from "next/server";
import { db, anotarActividad } from "@/lib/supabase";
import { checkPassword, hashPassword, generarCodigo, normalizarCodigo } from "@/lib/auth";
import { rateLimit } from "@/lib/guards";
import { hashFicticio, ipDe } from "@/lib/http";
import { passwordValida } from "@/lib/validate";

// Recuperar una contraseña con el código de recuperación del grupo, sin haber entrado.
// Sirve para la contraseña de una persona (por ejemplo la de quien administra) o para la del grupo.
// El código es de un solo uso: al usarlo se genera otro y se devuelve una vez.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { slug?: unknown; codigo?: unknown; que?: unknown; nombre?: unknown; nuevaPassword?: unknown } | null;
  const slug = typeof b?.slug === "string" ? b.slug.trim().toLowerCase() : "";
  if (!rateLimit("recuperar:" + ipDe(req), undefined, 5, 15 * 60_000) || !rateLimit("recuperar-grupo:" + slug, undefined, 5, 15 * 60_000))
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });

  const codigo = typeof b?.codigo === "string" ? normalizarCodigo(b.codigo) : "";
  if (!slug || codigo.length !== 20) return NextResponse.json({ error: "Escribe el identificador del grupo y el código de recuperación." }, { status: 400 });
  if (b?.que !== "grupo" && b?.que !== "miembro") return NextResponse.json({ error: "Elige qué contraseña quieres recuperar." }, { status: 400 });
  if (!passwordValida(b.nuevaPassword)) return NextResponse.json({ error: "La contraseña nueva debe tener entre 8 y 200 caracteres." }, { status: 400 });

  const sb = db();
  const { data: g } = await sb.from("grupos_cooperativos").select("id, recovery_hash").eq("slug", slug).maybeSingle();
  const ok = await checkPassword(codigo, g?.recovery_hash ?? (await hashFicticio()));
  if (!g || !g.recovery_hash || !ok) return NextResponse.json({ error: "Grupo o código incorrectos." }, { status: 401 });

  const nuevoCodigo = generarCodigo();
  const nuevoHash = await hashPassword(b.nuevaPassword);
  if (b.que === "miembro") {
    const nombre = typeof b.nombre === "string" ? b.nombre.trim() : "";
    const { data: m } = await sb.from("miembros").select("id").eq("grupo_id", g.id).eq("nombre", nombre).maybeSingle();
    if (!m) return NextResponse.json({ error: "No hay nadie con ese nombre en el grupo." }, { status: 404 });
    const { error } = await sb.from("miembros").update({ password_hash: nuevoHash }).eq("id", m.id);
    if (error) return NextResponse.json({ error: "No se ha podido cambiar la contraseña." }, { status: 500 });
  } else {
    const { error } = await sb.from("grupos_cooperativos").update({ password_hash: nuevoHash }).eq("id", g.id);
    if (error) return NextResponse.json({ error: "No se ha podido cambiar la contraseña." }, { status: 500 });
  }
  await sb.from("grupos_cooperativos").update({ recovery_hash: await hashPassword(normalizarCodigo(nuevoCodigo)) }).eq("id", g.id);
  await anotarActividad(g.id);
  return NextResponse.json({ ok: true, codigo: nuevoCodigo });
}
