"use client";
import { useState } from "react";
import { portalLinks } from "@/lib/fit";

/** Búsqueda por portales para cualquier municipio: no consulta nada, solo abre la búsqueda ya filtrada. Coste cero. */
export default function PortalSearch({ ciudad }: { ciudad: string }) {
  const [tipo, setTipo] = useState<"edificios" | "terrenos">("edificios");
  const [maxP, setMaxP] = useState("");
  const c = ciudad.trim();
  const links = c ? portalLinks(c, tipo, parseFloat(maxP) || undefined) : [];
  return (
    <div className="card">
      <div className="eyebrow">Buscar en los portales · cualquier ciudad</div>
      <div className="chips" role="group" aria-label="Tipo de inmueble">
        {(["edificios", "terrenos"] as const).map((t) => <button key={t} type="button" className={"chip" + (t === tipo ? " on" : "")} aria-pressed={t === tipo} onClick={() => setTipo(t)}>{t === "edificios" ? "Edificios" : "Terrenos"}</button>)}
      </div>
      <div className="form-g"><div className="fld"><label className="lb" htmlFor="ps-max">Precio máximo (€), opcional</label><input id="ps-max" type="number" min={0} step={50000} inputMode="numeric" value={maxP} onChange={(e) => setMaxP(e.target.value)} /></div></div>
      {c ? (
        <div className="acts" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {links.map((l) => <a key={l.id} className="btn ghost sm" href={l.url} target="_blank" rel="noopener noreferrer">{l.nombre} ↗</a>)}
        </div>
      ) : <p className="note">Indica la ciudad de tu grupo en la pestaña Ruta y aparecerán aquí los enlaces.</p>}
      <p className="note">Cada botón abre una búsqueda en Google limitada a ese portal, para {c || "tu ciudad"}. Cuando encuentres algo, pulsa «Añadir candidato» y pega el enlace.</p>
    </div>
  );
}
