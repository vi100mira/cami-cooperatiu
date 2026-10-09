import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/guards";
import { parseDireccion, parseRespuestaCatastro } from "@/lib/catastro";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

const quita = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();

/** Busca la referencia catastral de una dirección en el servicio público y gratuito del Catastro. No gasta créditos. */
export async function GET(req: NextRequest) {
  const direccion = (req.nextUrl.searchParams.get("direccion") ?? "").slice(0, 160);
  const municipio = quita((req.nextUrl.searchParams.get("municipio") ?? "").slice(0, 80));
  const provincia = quita((req.nextUrl.searchParams.get("provincia") ?? "").slice(0, 80)) || municipio;
  const d = parseDireccion(direccion);
  if (!d || !municipio) return NextResponse.json({ error: "direccion_no_valida" }, { status: 400 });
  const ip = (req.headers.get("x-forwarded-for") ?? "anon").split(",")[0].trim();
  if (!rateLimit("cat:" + ip, Date.now(), 30)) return NextResponse.json({ error: "demasiadas_peticiones" }, { status: 429 });
  const q = new URLSearchParams({ Provincia: provincia, Municipio: municipio, Sigla: d.sigla, Calle: d.calle, Numero: d.numero, Bloque: "", Escalera: "", Planta: "", Puerta: "" });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const r = await fetch("https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPLOC?" + q, { signal: ctrl.signal, cache: "no-store" });
    if (!r.ok) throw new Error("upstream:" + r.status);
    const parcelas = parseRespuestaCatastro(await r.text()).slice(0, 5);
    return NextResponse.json({ parcelas }, { headers: { "Cache-Control": "public, s-maxage=86400" } });
  } catch {
    return NextResponse.json({ error: "no_disponible" }, { status: 502 });
  } finally { clearTimeout(timer); }
}
