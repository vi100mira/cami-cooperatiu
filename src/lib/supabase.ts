import { createClient } from "@supabase/supabase-js";

// Cliente con service_role: solo se usa en rutas de servidor (app/api).
// Las tablas tienen RLS activado y sin políticas, así que el navegador nunca habla con Supabase directamente.
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
