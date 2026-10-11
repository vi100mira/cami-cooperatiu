import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/supabase";
import { COOKIE, fijarSesion, sesionActual } from "@/lib/session";

// Estado de la sesión para la interfaz: fuera, dentro del grupo o identificada como miembro.
// Si Supabase no está configurado, responde "disponible: false" para que la app siga funcionando sin grupos.
export async function GET() {
  try {
    const s = await sesionActual();
    if (!s) return NextResponse.json({ disponible: true, estado: "fuera" });
    const sb = db();
    const { data: g } = await sb.from("grupos_cooperativos").select("nombre, slug").eq("id", s.g).maybeSingle();
    if (!g) { (await cookies()).delete(COOKIE); return NextResponse.json({ disponible: true, estado: "fuera" }); }
    if (!s.m) return NextResponse.json({ disponible: true, estado: "grupo", grupo: g });
    const { data: m } = await sb.from("miembros").select("id, nombre").eq("id", s.m).eq("grupo_id", s.g).maybeSingle();
    if (!m) { await fijarSesion({ g: s.g }); return NextResponse.json({ disponible: true, estado: "grupo", grupo: g }); }
    return NextResponse.json({ disponible: true, estado: "miembro", grupo: g, miembro: m });
  } catch {
    return NextResponse.json({ disponible: false, estado: "fuera" });
  }
}

// Salir del grupo, o solo de la identidad de miembro (?soloMiembro=1) para que entre otra persona.
export async function DELETE(req: Request) {
  const s = await sesionActual().catch(() => null);
  if (s && new URL(req.url).searchParams.get("soloMiembro") === "1") await fijarSesion({ g: s.g });
  else (await cookies()).delete(COOKIE);
  return NextResponse.json({ ok: true });
}
