"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { datosDeListing, ofertaIdDe, type DatosFav, type Tipo } from "./favoritos";
import type { Listing } from "./parse-fotocasa";

export interface Fav { id: string; ofertaId: string; datos: DatosFav; fecha: string; marcadoPor: string; esMio: boolean; }
export interface Persona { id: string; nombre: string; esAdmin?: boolean; }
export interface DatosCoop { region: string; ciudad: string; familias: number; barrio: string; centro?: string; radio?: number; }
export interface GrupoInfo { nombre: string; slug: string; }
export type Estado = "cargando" | "fuera" | "grupo" | "miembro";
export interface Alta { nombre: string; slug: string; password: string; miembro: string; miembroPassword: string; }

type Resp<T> = { ok: boolean; status: number; j: T & { error?: string } };
async function api<T extends object = object>(path: string, method = "GET", body?: unknown): Promise<Resp<T>> {
  try {
    const r = await fetch(path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    return { ok: r.ok, status: r.status, j: (await r.json().catch(() => ({}))) as T & { error?: string } };
  } catch { return { ok: false, status: 0, j: { error: "Sin conexión. Inténtalo de nuevo." } as T & { error?: string } }; }
}
const FALLO = "No se ha podido completar la acción. Inténtalo de nuevo.";

interface Ctx {
  estado: Estado; disponible: boolean; grupo: GrupoInfo | null; miembro: Persona | null; miembros: Persona[]; favoritos: Fav[];
  /** Cada acción devuelve un mensaje de error, o null si ha ido bien. */
  entrarGrupo: (slug: string, password: string) => Promise<string | null>;
  crearGrupo: (a: Alta) => Promise<string | null>;
  /** Código de recuperación recién generado: se enseña una sola vez. */
  codigoNuevo: string | null;
  descartarCodigo: () => void;
  /** Acciones de quien administra el grupo; piden su contraseña personal. */
  quitarPersona: (miembroId: string, password: string) => Promise<string | null>;
  restablecerPassword: (miembroId: string, nuevaPassword: string, password: string) => Promise<string | null>;
  nuevoCodigo: (password: string) => Promise<string | null>;
  cambiarMiPassword: (actual: string, nueva: string) => Promise<string | null>;
  recuperar: (a: { slug: string; codigo: string; que: "grupo" | "miembro"; nombre?: string; nuevaPassword: string }) => Promise<string | null>;
  /** Datos de «Tu cooperativa» compartidos por el grupo (null si todavía nadie los ha guardado). */
  datosCoop: DatosCoop | null | undefined;
  guardarDatosCoop: (d: DatosCoop) => Promise<string | null>;
  elegirMiembro: (id: string, password: string) => Promise<string | null>;
  anadirMiembro: (nombre: string, password: string) => Promise<string | null>;
  cambiarPersona: () => Promise<void>;
  salir: () => Promise<void>;
  borrarMiPerfil: () => Promise<string | null>;
  alternarFavorito: (l: Listing, tipo: Tipo) => Promise<string | null>;
  /** Marca el corazón solo si aún no está marcado; sin grupo identificado no hace nada. Devuelve un mensaje de error o null. */
  marcarFavorito: (l: Listing, tipo: Tipo) => Promise<string | null>;
  quitarFavorito: (ofertaId: string) => Promise<string | null>;
  esFavorito: (l: Listing) => boolean;
  quienes: (l: Listing) => string[];
}
const C = createContext<Ctx | null>(null);

export function GrupoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [disponible, setDisponible] = useState(true);
  const [grupo, setGrupo] = useState<GrupoInfo | null>(null);
  const [miembro, setMiembro] = useState<Persona | null>(null);
  const [miembros, setMiembros] = useState<Persona[]>([]);
  const [favoritos, setFavoritos] = useState<Fav[]>([]);
  const [codigoNuevo, setCodigoNuevo] = useState<string | null>(null);
  const [datosCoop, setDatosCoop] = useState<DatosCoop | null | undefined>(undefined);

  const refrescar = useCallback(async () => {
    const r = await api<{ disponible: boolean; estado: Estado; grupo?: GrupoInfo; miembro?: Persona }>("/api/sesion");
    if (!r.ok) { setDisponible(false); setEstado("fuera"); setGrupo(null); setMiembro(null); return; }
    setDisponible(r.j.disponible); setEstado(r.j.estado); setGrupo(r.j.grupo ?? null); setMiembro(r.j.miembro ?? null);
    if (r.j.estado === "miembro") {
      const [f, d] = await Promise.all([api<{ favoritos: Fav[] }>("/api/favoritos"), api<{ datos: DatosCoop | null }>("/api/grupos/datos")]);
      setFavoritos(f.ok ? f.j.favoritos : []); setDatosCoop(d.ok ? d.j.datos : undefined);
    } else { setFavoritos([]); setDatosCoop(undefined); }
    if (r.j.estado === "grupo" || r.j.estado === "miembro") { const m = await api<{ miembros: Persona[] }>("/api/miembros"); setMiembros(m.ok ? m.j.miembros : []); }
  }, []);
  useEffect(() => { refrescar(); }, [refrescar]);

  const accion = useCallback(async (path: string, method: string, body?: unknown) => {
    const r = await api(path, method, body);
    if (!r.ok) return r.j.error ?? FALLO;
    await refrescar();
    return null;
  }, [refrescar]);

  const entrarGrupo = useCallback((slug: string, password: string) => accion("/api/grupos/entrar", "POST", { slug, password }), [accion]);
  const crearGrupo = useCallback(async (a: Alta) => {
    const r = await api<{ codigo: string }>("/api/grupos", "POST", a);
    if (!r.ok) return r.j.error ?? FALLO;
    setCodigoNuevo(r.j.codigo);
    await refrescar();
    return null;
  }, [refrescar]);
  const descartarCodigo = useCallback(() => setCodigoNuevo(null), []);
  const quitarPersona = useCallback((miembroId: string, password: string) => accion("/api/grupos/admin", "POST", { accion: "quitar", miembroId, password }), [accion]);
  const restablecerPassword = useCallback((miembroId: string, nuevaPassword: string, password: string) => accion("/api/grupos/admin", "POST", { accion: "restablecer", miembroId, nuevaPassword, password }), [accion]);
  const nuevoCodigo = useCallback(async (password: string) => {
    const r = await api<{ codigo: string }>("/api/grupos/admin", "POST", { accion: "codigo", password });
    if (!r.ok) return r.j.error ?? FALLO;
    setCodigoNuevo(r.j.codigo);
    return null;
  }, []);
  const cambiarMiPassword = useCallback(async (actual: string, nueva: string) => {
    const r = await api("/api/miembros/yo", "PATCH", { actual, nueva });
    return r.ok ? null : r.j.error ?? FALLO;
  }, []);
  const recuperar = useCallback(async (a: { slug: string; codigo: string; que: "grupo" | "miembro"; nombre?: string; nuevaPassword: string }) => {
    const r = await api<{ codigo: string }>("/api/grupos/recuperar", "POST", a);
    if (!r.ok) return r.j.error ?? FALLO;
    setCodigoNuevo(r.j.codigo);
    return null;
  }, []);
  const guardarDatosCoop = useCallback(async (d: DatosCoop) => {
    const r = await api("/api/grupos/datos", "PUT", d);
    if (r.ok) setDatosCoop(d);
    return r.ok ? null : r.j.error ?? FALLO;
  }, []);
  const elegirMiembro = useCallback((miembroId: string, password: string) => accion("/api/miembros/entrar", "POST", { miembroId, password }), [accion]);
  const anadirMiembro = useCallback(async (nombre: string, password: string) => {
    const r = await api<{ id: string }>("/api/miembros", "POST", { nombre, password });
    if (!r.ok) return r.j.error ?? FALLO;
    return elegirMiembro(r.j.id, password);
  }, [elegirMiembro]);
  const cambiarPersona = useCallback(async () => { await api("/api/sesion?soloMiembro=1", "DELETE"); await refrescar(); }, [refrescar]);
  const salir = useCallback(async () => { await api("/api/sesion", "DELETE"); await refrescar(); }, [refrescar]);
  const borrarMiPerfil = useCallback(() => accion("/api/miembros/yo", "DELETE"), [accion]);

  const alternarFavorito = useCallback(async (l: Listing, tipo: Tipo) => {
    if (!miembro) return "Entra a tu grupo para guardar favoritos.";
    const ofertaId = ofertaIdDe(l);
    const mio = favoritos.some((f) => f.esMio && f.ofertaId === ofertaId);
    const antes = favoritos;
    // Cambio inmediato en pantalla; si el servidor falla, se deshace.
    setFavoritos(mio
      ? antes.filter((f) => !(f.esMio && f.ofertaId === ofertaId))
      : [{ id: "pendiente-" + ofertaId, ofertaId, datos: datosDeListing(l, tipo), fecha: new Date().toISOString(), marcadoPor: miembro.nombre, esMio: true }, ...antes]);
    const r = mio
      ? await api("/api/favoritos?ofertaId=" + encodeURIComponent(ofertaId), "DELETE")
      : await api("/api/favoritos", "POST", { ofertaId, datos: datosDeListing(l, tipo) });
    if (!r.ok) {
      setFavoritos(antes);
      if (r.status === 401) await refrescar();
      return r.j.error ?? FALLO;
    }
    const f = await api<{ favoritos: Fav[] }>("/api/favoritos");
    if (f.ok) setFavoritos(f.j.favoritos);
    return null;
  }, [miembro, favoritos, refrescar]);

  const quitarFavorito = useCallback(async (ofertaId: string) => {
    const antes = favoritos;
    setFavoritos(antes.filter((f) => !(f.esMio && f.ofertaId === ofertaId)));
    const r = await api("/api/favoritos?ofertaId=" + encodeURIComponent(ofertaId), "DELETE");
    if (!r.ok) { setFavoritos(antes); if (r.status === 401) await refrescar(); return r.j.error ?? FALLO; }
    return null;
  }, [favoritos, refrescar]);

  const esFavorito = useCallback((l: Listing) => favoritos.some((f) => f.esMio && f.ofertaId === ofertaIdDe(l)), [favoritos]);
  const marcarFavorito = useCallback(async (l: Listing, tipo: Tipo) => {
    if (!miembro || favoritos.some((f) => f.esMio && f.ofertaId === ofertaIdDe(l))) return null;
    return alternarFavorito(l, tipo);
  }, [miembro, favoritos, alternarFavorito]);
  const quienes = useCallback((l: Listing) => { const id = ofertaIdDe(l); return favoritos.filter((f) => f.ofertaId === id).map((f) => f.marcadoPor); }, [favoritos]);

  const valor = useMemo<Ctx>(() => ({
    estado, disponible, grupo, miembro, miembros, favoritos,
    codigoNuevo, descartarCodigo, quitarPersona, restablecerPassword, nuevoCodigo, cambiarMiPassword, recuperar, datosCoop, guardarDatosCoop,
    entrarGrupo, crearGrupo, elegirMiembro, anadirMiembro, cambiarPersona, salir, borrarMiPerfil, alternarFavorito, marcarFavorito, quitarFavorito, esFavorito, quienes,
  }), [estado, disponible, grupo, miembro, miembros, favoritos, codigoNuevo, descartarCodigo, quitarPersona, restablecerPassword, nuevoCodigo, cambiarMiPassword, recuperar, datosCoop, guardarDatosCoop, entrarGrupo, crearGrupo, elegirMiembro, anadirMiembro, cambiarPersona, salir, borrarMiPerfil, alternarFavorito, marcarFavorito, quitarFavorito, esFavorito, quienes]);
  return <C.Provider value={valor}>{children}</C.Provider>;
}
export function useGrupo() { const c = useContext(C); if (!c) throw new Error("GrupoProvider"); return c; }
