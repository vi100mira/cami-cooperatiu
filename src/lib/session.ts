import { cookies } from "next/headers";
import { firmar, leer, type Sesion } from "./auth";

// Una sola cookie: primero se entra al grupo (g) y después al miembro (m).
export const COOKIE = "tc_sesion";
const HORAS = 12;

export async function sesionActual(): Promise<Sesion | null> {
  const c = await cookies();
  return leer(c.get(COOKIE)?.value);
}

export async function fijarSesion(datos: { g: string; m?: string }) {
  const c = await cookies();
  c.set(COOKIE, firmar(datos, HORAS), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: HORAS * 3600,
  });
}
