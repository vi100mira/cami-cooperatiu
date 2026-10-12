"use client";
import { MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import { MUNICIPIOS, resolverCentro, type Municipio } from "@/lib/ubicacion";
import { Field } from "./ui/field";
import { Input } from "./ui/input";

/** Centro de acción de la cooperativa y distancia máxima para elegir ofertas, tal como están guardados en el grupo. */
export function useCentro(): { municipio: Municipio | null; radio: number; usaCiudad: boolean; escrito: string } {
  const { s } = useStore();
  const escrito = (s.group.centro ?? "").trim();
  return {
    municipio: resolverCentro(escrito || s.group.ciudad),
    radio: Math.max(0, Math.min(200, Math.round(s.group.radio ?? 0))),
    usaCiudad: !escrito,
    escrito,
  };
}

/** Los dos campos y una línea que explica qué se va a hacer con ellos. Se usa en Ruta y en la búsqueda. */
export function CentroRadio({ id }: { id: string }) {
  const { s, set } = useStore();
  const c = useCentro();
  const up = (patch: Partial<typeof s.group>) => set((x) => ({ ...x, group: { ...x.group, ...patch } }));
  const aviso = !c.municipio
    ? c.escrito
      ? `No reconozco «${c.escrito}». Elige un municipio de la lista (Comunitat Valenciana); mientras tanto no se filtra por distancia.`
      : "La distancia solo funciona de momento con municipios de la Comunitat Valenciana: escribe un centro de acción de la lista para poder filtrar."
    : c.radio > 0
      ? `Se muestran las ofertas a menos de ${c.radio} km de ${c.municipio.nombre}${c.usaCiudad ? " (tu ciudad)" : ""}, en línea recta entre municipios (orientativo). Las que no se pueden ubicar se muestran con un aviso.`
      : `Centro: ${c.municipio.nombre}${c.usaCiudad ? " (tu ciudad)" : ""}. Sin límite de distancia: pon un máximo para filtrar las ofertas.`;
  return (
    <div className="grid gap-2">
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <Field label={<><MapPin className="size-3.5" aria-hidden /> Centro de acción</>} htmlFor={id + "-centro"}>
          <Input id={id + "-centro"} type="text" list="municipios-cv" autoComplete="off" placeholder={s.group.ciudad ? `Por defecto, ${s.group.ciudad}` : "Por ejemplo, València"}
            value={s.group.centro ?? ""} onChange={(e) => up({ centro: e.target.value })} />
        </Field>
        <Field label="Desplazamiento máximo (km)" htmlFor={id + "-radio"}>
          <Input id={id + "-radio"} type="number" min={0} max={200} step={5} inputMode="numeric" placeholder="Sin límite" value={s.group.radio ? s.group.radio : ""}
            onChange={(e) => { const v = parseInt(e.target.value, 10); up({ radio: isNaN(v) ? 0 : Math.max(0, Math.min(200, v)) }); }} />
        </Field>
      </div>
      <datalist id="municipios-cv">{MUNICIPIOS.map((m) => <option key={m.ine} value={m.nombre} />)}</datalist>
      <p className={"text-[13px] " + (!c.municipio && c.escrito ? "text-destructive" : "text-muted-foreground")} role="status">{aviso}</p>
    </div>
  );
}
