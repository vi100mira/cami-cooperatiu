"use client";
import { useState } from "react";
import { ExternalLink, Globe } from "lucide-react";
import { portalLinks } from "@/lib/fit";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Field, FormGrid } from "./ui/field";
import { ToggleChips } from "./ui/toggle-chips";

/** Búsqueda por portales para cualquier municipio: no consulta nada, solo abre la búsqueda ya filtrada. Coste cero. */
export default function PortalSearch({ ciudad }: { ciudad: string }) {
  const [tipo, setTipo] = useState<"edificios" | "terrenos" | "ambos">("edificios");
  const [maxP, setMaxP] = useState("");
  const c = ciudad.trim();
  const max = parseFloat(maxP) || undefined;
  const filas = (tipo === "ambos" ? (["edificios", "terrenos"] as const) : ([tipo] as const)).map((t) => ({ t, links: c ? portalLinks(c, t, max) : [] }));
  return (
    <Card>
      <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-widest text-muted-foreground"><Globe className="size-3.5" aria-hidden /> Buscar en los portales · cualquier ciudad</div>
      <ToggleChips label="Tipo de inmueble" value={tipo} options={[["edificios", "Edificios"], ["terrenos", "Terrenos"], ["ambos", "Ambos"]]} onChange={setTipo} />
      <FormGrid><Field label="Precio máximo (€), opcional" htmlFor="ps-max"><Input id="ps-max" type="number" min={0} step={50000} inputMode="numeric" value={maxP} onChange={(e) => setMaxP(e.target.value)} /></Field></FormGrid>
      {c ? (
        <div className="grid gap-2.5">
          {filas.map(({ t, links }) => (
            <div key={t} className="flex flex-wrap items-center gap-2">
              {tipo === "ambos" && <span className="w-20 text-[13px] font-semibold text-muted-foreground">{t === "edificios" ? "Edificios" : "Terrenos"}</span>}
              {links.map((l) => <Button key={l.id} size="sm" variant="outline" asChild><a href={l.url} target="_blank" rel="noopener noreferrer">{l.nombre} <ExternalLink aria-hidden /></a></Button>)}
            </div>
          ))}
        </div>
      ) : <p className="text-[13px] text-muted-foreground">Indica la ciudad de tu grupo en la pestaña Ruta y aparecerán aquí los enlaces.</p>}
      <p className="text-[13px] text-muted-foreground">Cada botón abre una búsqueda en Google limitada a ese portal, para {c || "tu ciudad"}. Cuando encuentres algo, pega el enlace de la búsqueda o del anuncio en «Añadir desde un enlace» y entrará en la lista con todo lo demás.</p>
    </Card>
  );
}
