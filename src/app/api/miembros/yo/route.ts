import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/supabase";
import { checkPassword, hashPassword } from "@/lib/auth";
import { COOKIE, sesionActual } from "@/lib/session";
import { rateLimit } from "@/lib/guards";
import { hashFicticio } from "@/lib/http";
import { passwordValida } from "@/lib/validate";
import { canonicaFamilia, familiasDistintas, limpiarFamilia } from "@/lib/familias";

// Derecho de supresión: la persona borra su perfil y sus favoritos (cascada).
// Si era la última del grupo, el grupo también se borra para no dejar datos huérfanos.
// Si administraba el grupo y quedan otras personas, pasa a administrarlo la que lleva más tiempo en él.
export async function DELETE() {
  const s = await sesionActual();
  if (!s?.m) return NextResponse.json({ error: "Confirma tu identidad primero." }, { status: 401 });

  const sb = db();
  const { error } = await sb.from("miembros").delete().eq("id", s.m).eq("grupo_id", s.g);
  if (error) return NextResponse.json({ error: "No se ha podido borrar el perfil." }, { status: 500 });

  const { data: quedan } = await sb.from("miembros").select("id, es_admin").eq("grupo_id", s.g).order("created_at").order("id");
  const grupoBorrado = (quedan?.length ?? 0) === 0;
  if (grupoBorrado) await sb.from("grupos_cooperativos").delete().eq("id", s.g);
  else if (!quedan!.some((m) => m.es_admin)) await sb.from("miembros").update({ es_admin: true }).eq("id", quedan![0].id);

  (await cookies()).delete(COOKIE);
  return NextResponse.json({ ok: true, grupoBorrado });
}

// Cambiar datos propios: la familia (basta con estar identificada) o la contraseña personal (exige conocer la actual).
export async function PATCH(req: Request) {
  const s = await sesionActual();
  if (!s?.m) return NextResponse.json({ error: "Confirma tu identidad primero." }, { status: 401 });

  const c = (await req.clone().json().catch(() => null)) as { familia?: unknown } | null;
  if (c && "familia" in c) {
    if (c.familia !== null && typeof c.familia !== "string") return NextResponse.json({ error: "La familia debe ser un texto." }, { status: 400 });
    const sb = db();
    const { data: otras } = await sb.from("miembros").select("familia").eq("grupo_id", s.g).neq("id", s.m);
    const familia = canonicaFamilia(limpiarFamilia(c.familia), familiasDistintas(otras ?? []));
    const { error } = await sb.from("miembros").update({ familia: familia || null }).eq("id", s.m).eq("grupo_id", s.g);
    if (error) return NextResponse.json({ error: "No se ha podido guardar la familia." }, { status: 500 });
    return NextResponse.json({ ok: true, familia: familia || null });
  }
  if (!rateLimit("cambiar-pw:" + s.m, undefined, 10, 15 * 60_000)) return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });

  const b = (await req.json().catch(() => null)) as { actual?: unknown; nueva?: unknown } | null;
  if (typeof b?.actual !== "string" || !b.actual || b.actual.length > 200) return NextResponse.json({ error: "Escribe tu contraseña actual." }, { status: 400 });
  if (!passwordValida(b.nueva)) return NextResponse.json({ error: "La contraseña nueva debe tener entre 8 y 200 caracteres." }, { status: 400 });

  const sb = db();
  const { data: m } = await sb.from("miembros").select("id, password_hash").eq("id", s.m).eq("grupo_id", s.g).maybeSingle();
  const ok = await checkPassword(b.actual, m?.password_hash ?? (await hashFicticio()));
  if (!m || !ok) return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 401 });
  const { error } = await sb.from("miembros").update({ password_hash: await hashPassword(b.nueva) }).eq("id", m.id);
  if (error) return NextResponse.json({ error: "No se ha podido cambiar la contraseña." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
