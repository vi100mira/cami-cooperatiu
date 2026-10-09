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
  const [tipo, setTipo] = useState<"edificios" | "terrenos">("edificios");
  const [maxP, setMaxP] = useState("");
  const c = ciudad.trim();
  const links = c ? portalLinks(c, tipo, parseFloat(maxP) || undefined) : [];
  return (
    <Card>
      <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-widest text-muted-foreground"><Globe className="size-3.5" aria-hidden /> Buscar en los portales · cualquier ciudad</div>
      <ToggleChips label="Tipo de inmueble" value={tipo} options={[["edificios", "Edificios"], ["terrenos", "Terrenos"]]} onChange={setTipo} />
      <FormGrid><Field label="Precio máximo (€), opcional" htmlFor="ps-max"><Input id="ps-max" type="number" min={0} step={50000} inputMode="numeric" value={maxP} onChange={(e) => setMaxP(e.target.value)} /></Field></FormGrid>
      {c ? (
        <div className="flex flex-wrap gap-2">
          {links.map((l) => <Button key={l.id} size="sm" variant="outline" asChild><a href={l.url} target="_blank" rel="noopener noreferrer">{l.nombre} <ExternalLink aria-hidden /></a></Button>)}
        </div>
      ) : <p className="text-[13px] text-muted-foreground">Indica la ciudad de tu grupo en la pestaña Ruta y aparecerán aquí los enlaces.</p>}
      <p className="text-[13px] text-muted-foreground">Cada botón abre una búsqueda en Google limitada a ese portal, para {c || "tu ciudad"}. Cuando encuentres algo, pulsa «Añadir candidato» y pega el enlace.</p>
    </Card>
  );
}
