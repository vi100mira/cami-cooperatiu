import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { sesionActual } from "@/lib/session";
import { rateLimit } from "@/lib/guards";
import { ipDe } from "@/lib/http";
import { canonicaFamilia, familiasDistintas, limpiarFamilia } from "@/lib/familias";

// Lista de miembros del grupo. Requiere haber entrado al grupo.
// Quien solo conoce la contraseña del grupo ve los nombres y los nombres de familia existentes (para sugerirlos al unirse),
// pero no a qué familia pertenece cada persona: eso solo lo ven quienes ya han confirmado su identidad.
export async function GET() {
  const s = await sesionActual();
  if (!s) return NextResponse.json({ error: "Entra primero al grupo." }, { status: 401 });

  const { data, error } = await db().from("miembros")
    .select("id, nombre, es_admin, familia").eq("grupo_id", s.g).order("nombre");
  if (error) return NextResponse.json({ error: "No se han podido cargar los miembros." }, { status: 500 });
  const filas = data ?? [];
  return NextResponse.json({
    miembros: filas.map((m) => ({ id: m.id, nombre: m.nombre, esAdmin: m.es_admin, ...(s.m ? { familia: m.familia ?? null } : {}) })),
    familias: familiasDistintas(filas),
  });
}

// Añadir un miembro al grupo ya existente.
export async function POST(req: Request) {
  const s = await sesionActual();
  if (!s) return NextResponse.json({ error: "Entra primero al grupo." }, { status: 401 });
  if (!rateLimit("miembro:" + ipDe(req), undefined, 10, 15 * 60_000))
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });

  const b = (await req.json().catch(() => null)) as { nombre?: unknown; password?: unknown; familia?: unknown } | null;
  const nombre = typeof b?.nombre === "string" ? b.nombre.trim() : "";
  const password = typeof b?.password === "string" ? b.password : "";
  if (nombre.length < 1 || nombre.length > 60)
    return NextResponse.json({ error: "Escribe un nombre de hasta 60 caracteres." }, { status: 400 });
  if (password.length < 8 || password.length > 200)
    return NextResponse.json({ error: "Tu contraseña personal debe tener entre 8 y 200 caracteres." }, { status: 400 });
  if (b?.familia !== undefined && b.familia !== null && typeof b.familia !== "string")
    return NextResponse.json({ error: "La familia debe ser un texto." }, { status: 400 });

  // Si la familia ya existe con otra grafía (mayúsculas, tildes), se usa la existente para que queden juntas.
  const sb = db();
  const escrita = limpiarFamilia(b?.familia);
  let familia = escrita;
  if (escrita) {
    const { data: existentes } = await sb.from("miembros").select("familia").eq("grupo_id", s.g);
    familia = canonicaFamilia(escrita, familiasDistintas(existentes ?? []));
  }

  const { data, error } = await sb.from("miembros")
    .insert({ grupo_id: s.g, nombre, password_hash: await hashPassword(password), familia: familia || null }).select("id").single();
  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "Ya hay alguien con ese nombre en el grupo." }, { status: 409 });
    return NextResponse.json({ error: "No se ha podido añadir el miembro." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
