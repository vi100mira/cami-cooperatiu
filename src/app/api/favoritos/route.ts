import { NextResponse } from "next/server";
import { db, anotarActividad } from "@/lib/supabase";
import { sesionActual } from "@/lib/session";
import { datosOferta } from "@/lib/validate";

// Favoritos del grupo. Requiere haber confirmado identidad como miembro.
export async function GET(req: Request) {
  const s = await sesionActual();
  if (!s?.m) return NextResponse.json({ error: "Confirma tu identidad primero." }, { status: 401 });

  const filtro = new URL(req.url).searchParams.get("filtro") === "mios" ? "mios" : "todos";
  let q = db().from("favoritos")
    .select("id, oferta_id, datos, created_at, miembro_id, miembros!inner(nombre, familia, grupo_id)")
    .eq("miembros.grupo_id", s.g)
    .order("created_at", { ascending: false });
  if (filtro === "mios") q = q.eq("miembro_id", s.m);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "No se han podido cargar los favoritos." }, { status: 500 });

  return NextResponse.json({
    favoritos: (data ?? []).map((f) => ({
      id: f.id,
      ofertaId: f.oferta_id,
      datos: f.datos,
      fecha: f.created_at,
      marcadoPor: (f.miembros as unknown as { nombre: string } | null)?.nombre ?? "",
      familia: (f.miembros as unknown as { familia: string | null } | null)?.familia ?? null,
      esMio: f.miembro_id === s.m,
    })),
  });
}

// Marcar como favorito (corazón). Un mismo miembro no puede duplicar la misma oferta.
export async function POST(req: Request) {
  const s = await sesionActual();
  if (!s?.m) return NextResponse.json({ error: "Confirma tu identidad primero." }, { status: 401 });

  const b = (await req.json().catch(() => null)) as { ofertaId?: unknown; datos?: unknown } | null;
  const ofertaId = typeof b?.ofertaId === "string" && b.ofertaId.length >= 1 && b.ofertaId.length <= 200 ? b.ofertaId : null;
  if (!ofertaId) return NextResponse.json({ error: "Falta el identificador de la oferta." }, { status: 400 });
  const d = datosOferta(b?.datos);
  if (!d.ok) return NextResponse.json({ error: d.error }, { status: 400 });

  const { error } = await db().from("favoritos")
    .upsert({ miembro_id: s.m, oferta_id: ofertaId, datos: d.v }, { onConflict: "miembro_id,oferta_id" });
  if (error) return NextResponse.json({ error: "No se ha podido guardar el favorito." }, { status: 500 });
  await anotarActividad(s.g);
  return NextResponse.json({ ok: true });
}

// Quitar el corazón. Solo se pueden borrar los favoritos propios.
export async function DELETE(req: Request) {
  const s = await sesionActual();
  if (!s?.m) return NextResponse.json({ error: "Confirma tu identidad primero." }, { status: 401 });

  const ofertaId = new URL(req.url).searchParams.get("ofertaId") ?? "";
  if (!ofertaId || ofertaId.length > 200) return NextResponse.json({ error: "Falta el identificador de la oferta." }, { status: 400 });

  const { error } = await db().from("favoritos").delete().eq("miembro_id", s.m).eq("oferta_id", ofertaId);
  if (error) return NextResponse.json({ error: "No se ha podido quitar el favorito." }, { status: 500 });
  await anotarActividad(s.g);
  return NextResponse.json({ ok: true });
}
