import { NextResponse } from "next/server";
import { db, anotarActividad } from "@/lib/supabase";
import { hashPassword, generarCodigo, normalizarCodigo } from "@/lib/auth";
import { exigirAdmin } from "@/lib/admin";
import { passwordValida } from "@/lib/validate";
import { UUID } from "@/lib/http";

// Acciones de quienes administran el grupo (puede haber varias): nombrar a otra persona para administrar, renunciar,
// quitar a alguien, restablecer su contraseña personal o generar un código de recuperación nuevo.
// Cada una exige la contraseña personal de quien la hace. Una administradora no puede quitar ni restablecer a otra
// administradora: solo puede renunciar ella misma, y siempre queda al menos una persona administrando.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { password?: unknown; accion?: unknown; miembroId?: unknown; nuevaPassword?: unknown } | null;
  const a = await exigirAdmin(b?.password);
  if (!a.ok) return a.res;
  const sb = db();

  if (b?.accion === "codigo") {
    const codigo = generarCodigo();
    const { error } = await sb.from("grupos_cooperativos").update({ recovery_hash: await hashPassword(normalizarCodigo(codigo)) }).eq("id", a.g);
    if (error) return NextResponse.json({ error: "No se ha podido generar el código." }, { status: 500 });
    await anotarActividad(a.g);
    return NextResponse.json({ ok: true, codigo });
  }

  if (b?.accion === "renunciar") {
    const { count } = await sb.from("miembros").select("id", { count: "exact", head: true }).eq("grupo_id", a.g).eq("es_admin", true);
    if ((count ?? 0) < 2) return NextResponse.json({ error: "Eres la única persona que administra el grupo. Nombra antes a otra." }, { status: 400 });
    const { error } = await sb.from("miembros").update({ es_admin: false }).eq("id", a.m).eq("grupo_id", a.g);
    if (error) return NextResponse.json({ error: "No se ha podido renunciar." }, { status: 500 });
    // Si dos administradoras renuncian a la vez, el grupo no puede quedarse sin nadie: se deshace la última.
    const { count: quedan } = await sb.from("miembros").select("id", { count: "exact", head: true }).eq("grupo_id", a.g).eq("es_admin", true);
    if ((quedan ?? 0) === 0) {
      await sb.from("miembros").update({ es_admin: true }).eq("id", a.m).eq("grupo_id", a.g);
      return NextResponse.json({ error: "Otra persona ha renunciado a la vez. Sigues administrando el grupo." }, { status: 409 });
    }
    await anotarActividad(a.g);
    return NextResponse.json({ ok: true });
  }

  const miembroId = typeof b?.miembroId === "string" && UUID.test(b.miembroId) ? b.miembroId : null;
  if (!miembroId) return NextResponse.json({ error: "Elige a una persona del grupo." }, { status: 400 });
  const { data: objetivo } = await sb.from("miembros").select("id, es_admin").eq("id", miembroId).eq("grupo_id", a.g).maybeSingle();
  if (!objetivo) return NextResponse.json({ error: "Esa persona no está en el grupo." }, { status: 404 });

  if (b?.accion === "ascender") {
    if (objetivo.es_admin) return NextResponse.json({ error: "Esa persona ya administra el grupo." }, { status: 400 });
    const { error } = await sb.from("miembros").update({ es_admin: true }).eq("id", miembroId).eq("grupo_id", a.g);
    if (error) return NextResponse.json({ error: "No se ha podido nombrar a esa persona." }, { status: 500 });
    await anotarActividad(a.g);
    return NextResponse.json({ ok: true });
  }

  if (b?.accion === "quitar") {
    if (miembroId === a.m) return NextResponse.json({ error: "Para irte tú, usa «Borrar mi perfil»." }, { status: 400 });
    if (objetivo.es_admin) return NextResponse.json({ error: "No puedes quitar a otra persona que administra. Puede renunciar ella misma." }, { status: 403 });
    const { error } = await sb.from("miembros").delete().eq("id", miembroId).eq("grupo_id", a.g);
    if (error) return NextResponse.json({ error: "No se ha podido quitar a esa persona." }, { status: 500 });
    await anotarActividad(a.g);
    return NextResponse.json({ ok: true });
  }

  if (b?.accion === "restablecer") {
    if (objetivo.es_admin) return NextResponse.json({ error: "No puedes restablecer la contraseña de otra persona que administra." }, { status: 403 });
    if (!passwordValida(b.nuevaPassword)) return NextResponse.json({ error: "La contraseña nueva debe tener entre 8 y 200 caracteres." }, { status: 400 });
    const { error } = await sb.from("miembros").update({ password_hash: await hashPassword(b.nuevaPassword) }).eq("id", miembroId).eq("grupo_id", a.g);
    if (error) return NextResponse.json({ error: "No se ha podido restablecer la contraseña." }, { status: 500 });
    await anotarActividad(a.g);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
}
