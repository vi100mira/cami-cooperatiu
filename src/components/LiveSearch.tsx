"use client";
import { useState } from "react";
import { eur, fnum } from "@/lib/format";
import { Photos, MapBox } from "./Media";
import type { Listing } from "@/lib/parse-fotocasa";

type Tipo = "edificios" | "terrenos";
interface Res { tipo: Tipo; fuente: string; actualizado: string; items: Listing[]; }
const MSG: Record<string, string> = {
  desactivada: "La búsqueda en vivo está apagada ahora mismo. Puedes usar los enlaces de portales de la sección de entidades.",
  limite_diario: "Se ha alcanzado el límite diario de consultas. Vuelve a intentarlo mañana.",
  demasiadas_peticiones: "Demasiadas consultas seguidas. Espera un rato.",
  no_disponible: "El portal no ha respondido. Inténtalo más tarde.",
};

export default function LiveSearch({ onPick, ciudad }: { onPick: (l: Listing, t: Tipo) => void; ciudad: string }) {
  const [tipo, setTipo] = useState<Tipo>("edificios");
  const [state, setState] = useState<{ loading: boolean; res?: Res; err?: string }>({ loading: false });
  const [maxP, setMaxP] = useState("");
  const run = async () => {
    setState({ loading: true });
    try {
      const r = await fetch("/api/buscar?ciudad=" + ciudad + "&tipo=" + tipo);
      const j = await r.json();
      if (!r.ok) setState({ loading: false, err: MSG[j.error] ?? "No se ha podido buscar." });
      else setState({ loading: false, res: j });
    } catch { setState({ loading: false, err: MSG.no_disponible }); }
  };
  const lim = parseFloat(maxP) || 0;
  const items = (state.res?.items ?? []).filter((l) => !lim || (l.precio != null && l.precio <= lim));
  return (
    <div className="card">
      <div className="chips" role="group" aria-label="Tipo de inmueble">
        {(["edificios", "terrenos"] as Tipo[]).map((t) => <button key={t} type="button" className={"chip" + (t === tipo ? " on" : "")} aria-pressed={t === tipo} onClick={() => { setTipo(t); setState({ loading: false }); }}>{t === "edificios" ? "Edificios" : "Terrenos"}</button>)}
      </div>
      <div className="form-g">
        <div className="fld"><label className="lb" htmlFor="ls-max">Precio máximo (€), opcional</label><input id="ls-max" type="number" min={0} step={50000} inputMode="numeric" value={maxP} onChange={(e) => setMaxP(e.target.value)} /></div>
      </div>
      <div><button type="button" className="btn" disabled={state.loading} onClick={run}>{state.loading ? "Buscando…" : "Buscar en " + (ciudad === "valencia" ? "València" : ciudad)}</button></div>
      {state.err && <p className="warn" role="alert">{state.err}</p>}
      {state.res && (
        <>
          <p className="note">{items.length} de {state.res.items.length} resultados · Fuente: {state.res.fuente} · Actualizado {new Date(state.res.actualizado).toLocaleString("es-ES")}. Datos orientativos: confirma siempre en el anuncio.</p>
          <div className="res-list">
            {items.map((l) => (
              <article key={l.id} className="listing">
                <Photos fotos={l.fotos ?? []} alt={`${l.titulo} en ${l.zona}`} />
                <h4>{l.titulo}</h4>
                <div className="tag">{l.zona}</div>
                <div className="nums" style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13.5 }}>
                  <span>Precio <b>{l.precio ? eur(l.precio) : "—"}</b></span>
                  <span>Superficie <b>{l.m2 ? fnum(l.m2, 0) + " m²" : "—"}</b></span>
                  {l.precio && l.m2 ? <span>€/m² <b>{eur(l.precio / l.m2)}</b></span> : null}
                </div>
                <MapBox query={`${l.titulo} ${l.zona} València`} />
                {l.resumen && <p className="desc">{l.resumen}</p>}
                <div className="acts" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a className="btn ghost sm" href={l.url} target="_blank" rel="noopener noreferrer">Ver anuncio ↗</a>
                  <button type="button" className="btn sm" onClick={() => onPick(l, state.res!.tipo)}>Apuntar como candidato</button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
