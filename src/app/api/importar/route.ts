import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { enabled, rateLimit } from "@/lib/guards";
import { isTipo, scrapeMarkdown } from "@/lib/search";
import { revisarUrl, tipoDesdeUrl, anunciosDe } from "@/lib/importar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Caché de 24 h por URL: volver a pegar el mismo enlace no gasta créditos. Un error lanza excepción y no se cachea.
const leer = (url: string, portalId: string, ficha: boolean) =>
  unstable_cache(async () => {
    const r = revisarUrl(url);
    if (!r.ok) throw new Error("url_invalida");
    const md = await scrapeMarkdown(url, "importar:" + portalId);
    const items = anunciosDe(md, url, r.portal, ficha);
    if (!items.length) throw new Error("sin_anuncios");
    return { items, actualizado: new Date().toISOString() };
  }, ["importar-v1", url], { revalidate: 86400, tags: ["importar"] })();

export async function POST(req: NextRequest) {
  let b: { url?: unknown; tipo?: unknown };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "url_invalida" }, { status: 400 }); }
  const r = revisarUrl(b.url);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  const tipo = isTipo(b.tipo) ? b.tipo : tipoDesdeUrl(r.url);
  const base = { url: r.url, portal: r.portal.nombre, ficha: r.ficha, tipo };
  // Fichas que el portal bloquea: se sabe de antemano, así que no se gasta un crédito en intentarlo.
  if (r.ficha && r.portal.fichaBloqueada) return NextResponse.json({ ...base, error: "ficha_bloqueada" }, { status: 422 });
  if (!enabled()) return NextResponse.json({ ...base, error: "desactivada" }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") ?? "anon").split(",")[0].trim();
  if (!rateLimit(ip)) return NextResponse.json({ ...base, error: "demasiadas_peticiones" }, { status: 429 });
  try {
    const data = await leer(r.url, r.portal.id, r.ficha);
    return NextResponse.json({ ...base, fuente: r.portal.nombre, ...data });
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m.startsWith("limit:")) return NextResponse.json({ ...base, error: "limite_diario" }, { status: 429 });
    if (m === "sin_anuncios") return NextResponse.json({ ...base, error: "sin_anuncios" }, { status: 422 });
    return NextResponse.json({ ...base, error: "no_disponible" }, { status: 502 });
  }
}
