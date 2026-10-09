/**
 * Protecciones de coste. Se aplican en este orden:
 *  1. Interruptor: SEARCH_ENABLED distinto de "true" => búsqueda apagada (0 créditos).
 *  2. Lista blanca: solo 2 consultas fijas (edificios, terrenos). El usuario no puede elegir URL.
 *  3. Caché de 24 h compartida (ver search.ts): visitas repetidas no gastan créditos.
 *  4. Tope diario de llamadas reales a Firecrawl (SEARCH_DAILY_CAP, por defecto 6).
 *  5. Límite por IP (best-effort, en memoria de la instancia).
 *  6. Enfriamiento tras fallo, para no reintentar en bucle.
 * Los contadores en memoria son por instancia serverless: sirven de freno extra, pero la
 * garantía real son la caché de 24 h y el límite de créditos de la cuenta de Firecrawl
 * (sin recarga automática).
 */
const day = () => new Date().toISOString().slice(0, 10);
const g = globalThis as unknown as { __guards?: { day: string; calls: number; failUntil: number; ips: Map<string, number[]> } };
const st = (g.__guards ??= { day: day(), calls: 0, failUntil: 0, ips: new Map() });

export function enabled() { return process.env.SEARCH_ENABLED === "true" && !!process.env.FIRECRAWL_API_KEY; }
export function dailyCap() { const n = parseInt(process.env.SEARCH_DAILY_CAP ?? "6", 10); return Number.isFinite(n) && n >= 0 ? Math.min(n, 50) : 6; }

export function canSpend(now = Date.now()): { ok: true } | { ok: false; reason: string } {
  if (st.day !== day()) { st.day = day(); st.calls = 0; }
  if (now < st.failUntil) return { ok: false, reason: "cooldown" };
  if (st.calls >= dailyCap()) return { ok: false, reason: "cap" };
  return { ok: true };
}
export function recordCall() { st.calls++; }
export function recordFailure(now = Date.now()) { st.failUntil = now + 10 * 60_000; }

export function rateLimit(ip: string, now = Date.now(), max = 20, windowMs = 60 * 60_000) {
  const arr = (st.ips.get(ip) ?? []).filter((t: number) => now - t < windowMs);
  if (arr.length >= max) { st.ips.set(ip, arr); return false; }
  arr.push(now); st.ips.set(ip, arr);
  if (st.ips.size > 5000) st.ips.clear();
  return true;
}
export function _reset() { st.calls = 0; st.failUntil = 0; st.ips.clear(); }
