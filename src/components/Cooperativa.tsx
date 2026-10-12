"use client";
import { useEffect, useRef, useState } from "react";
import { Users, Pencil, MapPin, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useGrupo } from "@/lib/grupo";
import { REGIONS, regionName } from "@/lib/content";
import { Button } from "./ui/button";
import { Card, CardTitle } from "./ui/card";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { NativeSelect } from "./ui/select";
import { CentroRadio, useCentro } from "./CentroRadio";
import { GrupoConexion } from "./GrupoConexion";

/** Los datos de la cooperativa se editan en un solo sitio, esta ventana, que se abre desde Ruta y desde Grupo. */
const EVENTO = "cami:editar-cooperativa";
export const abrirEditorCooperativa = () => window.dispatchEvent(new CustomEvent(EVENTO));

/** Resumen informativo de los datos de la cooperativa. No se edita aquí: el botón abre la ventana de edición. */
export function ResumenCooperativa({ variante }: { variante: "ruta" | "grupo" }) {
  const { s } = useStore();
  const g = useGrupo();
  const c = useCentro();
  const nombre = s.group.name.trim();
  const centro = c.municipio ? (c.radio > 0 ? `Hasta ${c.radio} km de ${c.municipio.nombre}` : `Centro: ${c.municipio.nombre}, sin límite de distancia`) : "Sin centro de acción";
  const datos = [
    regionName(s.group.region) || "Comunidad sin elegir",
    s.group.ciudad.trim() || "Ciudad sin indicar",
    `${s.group.fam} ${s.group.fam === 1 ? "familia" : "familias"}`,
    s.group.barrio.trim() ? `Zona: ${s.group.barrio.trim()}` : "",
  ].filter(Boolean);
  const compartido = g.estado === "miembro";
  return (
    <Card className="gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-0.5">
          <CardTitle className="flex items-center gap-2 text-xl"><Users className="size-5 text-primary" aria-hidden /> {variante === "ruta" ? "Tu cooperativa" : "Datos de la cooperativa"}</CardTitle>
          <p className="font-heading text-lg font-bold leading-snug">{nombre || <span className="text-muted-foreground">Sin nombre todavía</span>}</p>
        </div>
        <Button size="sm" variant="outline" onClick={abrirEditorCooperativa}><Pencil aria-hidden /> Editar datos</Button>
      </div>
      <ul className="flex flex-wrap gap-1.5" aria-label="Datos de la cooperativa">
        {datos.map((d) => <li key={d} className="rounded-full border bg-card px-3 py-1 text-[13px]">{d}</li>)}
        <li className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-[13px]"><MapPin className="size-3.5" aria-hidden /> {centro}</li>
      </ul>
      {variante === "grupo"
        ? <p className="text-[13px] text-muted-foreground">{compartido ? "Estos datos los comparten todas las personas del grupo (menos el nombre de la cooperativa, que se queda en cada navegador)." : "Para compartir estos datos con el resto de personas, entra al grupo y confirma quién eres."} Adaptan la búsqueda, las entidades y las calculadoras.</p>
        : <GrupoConexion />}
    </Card>
  );
}

/** Ventana de edición de los datos de la cooperativa. Una sola, montada en la aplicación; se abre con `abrirEditorCooperativa`. */
export function EditarCooperativa() {
  const ref = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);
  const { s, set } = useStore();
  const up = (patch: Partial<typeof s.group>) => set((x) => ({ ...x, group: { ...x.group, ...patch } }));

  useEffect(() => {
    // Abrir no depende del estado anterior: si el navegador cerró la ventana por su cuenta (Escape), se vuelve a abrir igual.
    const h = () => { setAbierto(true); const d = ref.current; if (d && !d.open) d.showModal(); };
    window.addEventListener(EVENTO, h);
    return () => window.removeEventListener(EVENTO, h);
  }, []);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);
  // El navegador también cierra la ventana por su cuenta (con Escape): hay que enterarse para poder reabrirla.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const alCerrar = () => setAbierto(false);
    d.addEventListener("close", alCerrar);
    return () => d.removeEventListener("close", alCerrar);
  }, []);

  return (
    <dialog ref={ref} aria-labelledby="coop-titulo" onClick={(e) => { if (e.target === e.currentTarget) setAbierto(false); }}
      className="m-auto max-h-[92vh] w-[min(94vw,46rem)] overflow-auto rounded-2xl border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/60">
      {abierto && (
        <div className="grid gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id="coop-titulo" className="font-heading text-xl font-bold">Datos de la cooperativa</h2>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="grid size-8 cursor-pointer place-items-center rounded-full text-muted-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40"><X className="size-4" aria-hidden /></button>
          </div>
          <p className="text-[13px] text-muted-foreground">Adaptan las entidades, los enlaces y los mensajes a tu zona, y alimentan la búsqueda y las calculadoras. Se guardan en este navegador; si estás en un grupo, la comunidad, la ciudad, las familias, el barrio, el centro de acción y la distancia máxima se comparten con él.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Comunidad autónoma" htmlFor="g-region"><NativeSelect id="g-region" value={s.group.region} onChange={(e) => up({ region: e.target.value })}><option value="">Elige tu comunidad…</option>{REGIONS.map((r) => <option key={r[0]} value={r[0]}>{r[1]}</option>)}</NativeSelect></Field>
            <Field label="Ciudad o municipio" htmlFor="g-ciudad"><Input id="g-ciudad" type="text" autoComplete="off" placeholder="Por ejemplo, Bilbao o València" value={s.group.ciudad} onChange={(e) => up({ ciudad: e.target.value })} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_2fr]">
            <Field label="Nombre de la cooperativa" htmlFor="g-name"><Input id="g-name" type="text" autoComplete="off" placeholder="Por ejemplo, Llar del Barri" value={s.group.name} onChange={(e) => up({ name: e.target.value })} /></Field>
            <Field label="Familias" htmlFor="g-fam"><Input id="g-fam" type="number" min={1} max={200} inputMode="numeric" value={s.group.fam} onChange={(e) => { const v = parseInt(e.target.value, 10); if (isNaN(v)) return; up({ fam: Math.max(1, Math.min(200, v)) }); }} /></Field>
            <Field label="Barrio o zona de interés" htmlFor="g-barrio"><Input id="g-barrio" type="text" autoComplete="off" placeholder="Por ejemplo, Cabanyal o Patraix" value={s.group.barrio} onChange={(e) => up({ barrio: e.target.value })} /></Field>
          </div>
          <CentroRadio id="coop-cr" />
          <div className="flex justify-end"><Button onClick={() => setAbierto(false)}>Hecho</Button></div>
        </div>
      )}
    </dialog>
  );
}
