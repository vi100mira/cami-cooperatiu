import { NextRequest, NextResponse } from "next/server";
import { enabled, rateLimit } from "@/lib/guards";
import { getListings, isTipo, isCity } from "@/lib/search";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const tipo = req.nextUrl.searchParams.get("tipo");
  const ciudad = req.nextUrl.searchParams.get("ciudad") ?? "valencia";
  if (!isTipo(tipo) || !isCity(ciudad)) return NextResponse.json({ error: "tipo_invalido" }, { status: 400 });
  if (!enabled()) return NextResponse.json({ error: "desactivada" }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") ?? "anon").split(",")[0].trim();
  if (!rateLimit(ip)) return NextResponse.json({ error: "demasiadas_peticiones" }, { status: 429 });
  try {
    const data = await getListings(tipo, ciudad);
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    const limit = m.startsWith("limit:");
    return NextResponse.json({ error: limit ? "limite_diario" : "no_disponible" }, { status: limit ? 429 : 502 });
  }
}
