import { hashPassword } from "./auth";

// IP del cliente para los límites de intentos (best-effort: la cabecera la pone el proxy de Vercel).
export const ipDe = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";

// Hash falso para que un slug inexistente tarde lo mismo que uno real y no revele qué grupos existen.
let ficticio: Promise<string> | undefined;
export const hashFicticio = () => (ficticio ??= hashPassword("no-existe-nada"));

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
