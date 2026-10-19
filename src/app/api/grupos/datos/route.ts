import { NextResponse } from "next/server";
import { db, anotarActividad } from "@/lib/supabase";
import { sesionActual } from "@/lib/session";
import { validarDatosGrupo } from "@/lib/validate";
import { rateLimit } from "@/lib/guards";
import { ipDe } from "@/lib/http";

// Datos de «Tu cooperativa» compartidos por el grupo: región, ciudad, familias y barrio. Nada de ingresos ni capital.
// El número de familias solo lo pueden cambiar quienes administran el grupo; el resto de datos, cualquier persona identificada.
export async function GET() {
  const s = await sesionActual();
  if (!s?.m) return NextResponse.json({ error: "Confirma tu identidad primero." }, { status: 401 });
  const { data, error } = await db().from("grupos_cooperativos").select("datos").eq("id", s.g).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "No se han podido cargar los datos." }, { status: 500 });
  const v = validarDatosGrupo(data.datos);
  return NextResponse.json({ datos: v.ok ? v.v : null });
}

export async function PUT(req: Request) {
  const s = await sesionActual();
  if (!s?.m) return NextResponse.json({ error: "Confirma tu identidad primero." }, { status: 401 });
  if (!rateLimit("datos:" + ipDe(req), undefined, 60, 15 * 60_000))
    return NextResponse.json({ error: "Demasiados cambios seguidos. Espera unos minutos." }, { status: 429 });
  const v = validarDatosGrupo(await req.json().catch(() => null));
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const sb = db();
  const [{ data: yo }, { data: g }] = await Promise.all([
    sb.from("miembros").select("es_admin").eq("id", s.m).eq("grupo_id", s.g).maybeSingle(),
    sb.from("grupos_cooperativos").select("datos").eq("id", s.g).maybeSingle(),
  ]);
  if (!yo || !g) return NextResponse.json({ error: "Confirma tu identidad primero." }, { status: 401 });
  // Si no administra, el número de familias se queda como está (si el grupo aún no tenía datos, vale el primero que llegue).
  const previo = validarDatosGrupo(g.datos);
  const datos = !yo.es_admin && previo.ok ? { ...v.v, familias: previo.v.familias } : v.v;
  const { error } = await sb.from("grupos_cooperativos").update({ datos }).eq("id", s.g);
  if (error) return NextResponse.json({ error: "No se han podido guardar los datos." }, { status: 500 });
  await anotarActividad(s.g);
  return NextResponse.json({ ok: true, datos });
}
