import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/supabase";
import { COOKIE, sesionActual } from "@/lib/session";

// Derecho de supresión: la persona borra su perfil y sus favoritos (cascada).
// Si era la última del grupo, el grupo también se borra para no dejar datos huérfanos.
export async function DELETE() {
  const s = await sesionActual();
  if (!s?.m) return NextResponse.json({ error: "Confirma tu identidad primero." }, { status: 401 });

  const sb = db();
  const { error } = await sb.from("miembros").delete().eq("id", s.m).eq("grupo_id", s.g);
  if (error) return NextResponse.json({ error: "No se ha podido borrar el perfil." }, { status: 500 });

  const { count } = await sb.from("miembros").select("id", { count: "exact", head: true }).eq("grupo_id", s.g);
  const grupoBorrado = (count ?? 0) === 0;
  if (grupoBorrado) await sb.from("grupos_cooperativos").delete().eq("id", s.g);

  (await cookies()).delete(COOKIE);
  return NextResponse.json({ ok: true, grupoBorrado });
}
