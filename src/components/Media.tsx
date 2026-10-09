"use client";
import { useState } from "react";
import { catastroUrl } from "@/lib/catastro";

const httpsOnly = (u: string) => /^https:\/\//.test(u);
export const mapsSearch = (q: string) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);

export function Photos({ fotos, alt }: { fotos: string[]; alt: string }) {
  const list = fotos.filter(httpsOnly).slice(0, 6);
  const [i, setI] = useState(0);
  if (!list.length) return null;
  return (
    <div className="photos">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ph-main" src={list[Math.min(i, list.length - 1)]} alt={alt} loading="lazy" referrerPolicy="no-referrer" />
      {list.length > 1 && (
        <div className="ph-thumbs">
          {list.map((f, k) => (
            <button key={f} type="button" className={k === i ? "on" : ""} aria-label={`Foto ${k + 1} de ${list.length}`} onClick={() => setI(k)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f} alt="" loading="lazy" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Mapa incrustado solo al pulsar (no carga nada de terceros hasta entonces). */
export function MapBox({ query, refcat }: { query: string; refcat?: string }) {
  const [open, setOpen] = useState(false);
  const cat = refcat ? catastroUrl(refcat) : null;
  return (
    <div className="mapbox">
      <div className="acts" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn ghost sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? "Ocultar mapa" : "Ver mapa"}</button>
        <a className="btn ghost sm" href={mapsSearch(query)} target="_blank" rel="noopener noreferrer">Abrir en Google Maps ↗</a>
        {cat && <a className="btn ghost sm" href={cat} target="_blank" rel="noopener noreferrer">Ficha en el Catastro ↗</a>}
      </div>
      {open && <iframe title={"Mapa: " + query} src={"https://maps.google.com/maps?output=embed&q=" + encodeURIComponent(query)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
    </div>
  );
}
