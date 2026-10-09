"use client";
import { useState } from "react";
import { eur, fnum } from "@/lib/format";
import { Photos, MapBox } from "./Media";
import type { Listing } from "@/lib/parse-fotocasa";
import { filtrar, viviendasEstimadas, precioPorVivienda, etiquetas, ETIQUETA_TEXTO, tituloLegible, type Orden } from "@/lib/fit";

type Tipo = "edificios" | "terrenos";
interface Res { tipo: Tipo; fuente: string; actualizado: string; items: Listing[]; }
const CIUDAD_NOMBRE: Record<string, string> = { valencia: "València" };
const MSG: Record<string, string> = {
  desactivada: "La búsqueda en vivo está apagada ahora mismo. Puedes usar los enlaces de portales de la sección de entidades.",
  limite_diario: "Se ha alcanzado el límite diario de consultas de la búsqueda en vivo. Es un límite compartido entre todas las personas que prueban la app, para no generar costes. Vuelve a intentarlo mañana; mientras tanto puedes usar los botones de portales de arriba.",
  demasiadas_peticiones: "Has hecho demasiadas consultas seguidas desde tu conexión. Espera un rato y vuelve a probar.",
  no_disponible: "El portal no ha respondido, o ha cambiado su web y no hemos podido leerla. Inténtalo más tarde y, si sigue fallando, usa los botones de portales de arriba.",
};

export default function LiveSearch({ onPick, ciudad }: { onPick: (l: Listing, t: Tipo) => void; ciudad: string }) {
  const [tipo, setTipo] = useState<Tipo>("edificios");
  const [state, setState] = useState<{ loading: boolean; res?: Res; err?: string }>({ loading: false });
  const [maxP, setMaxP] = useState("");
  const [minV, setMinV] = useState("");
  const [maxPv, setMaxPv] = useState("");
  const [orden, setOrden] = useState<Orden>("pv");
  const [verTodo, setVerTodo] = useState(false);
  const run = async () => {
    setState({ loading: true });
    try {
      const r = await fetch("/api/buscar?ciudad=" + ciudad + "&tipo=" + tipo);
      const j = await r.json();
      if (!r.ok) setState({ loading: false, err: MSG[j.error] ?? "No se ha podido buscar." });
      else setState({ loading: false, res: j });
    } catch { setState({ loading: false, err: MSG.no_disponible }); }
  };
  const items = filtrar(state.res?.items ?? [], tipo, { maxPrecio: parseFloat(maxP) || 0, minViv: parseInt(minV, 10) || 0, maxPv: parseFloat(maxPv) || 0, orden, verTodo });
  return (
    <div className="card">
      <div className="chips" role="group" aria-label="Tipo de inmueble">
        {(["edificios", "terrenos"] as Tipo[]).map((t) => <button key={t} type="button" className={"chip" + (t === tipo ? " on" : "")} aria-pressed={t === tipo} onClick={() => { setTipo(t); setState({ loading: false }); }}>{t === "edificios" ? "Edificios" : "Terrenos"}</button>)}
      </div>
      <div className="form-g">
        <div className="fld"><label className="lb" htmlFor="ls-max">Precio máximo (€)</label><input id="ls-max" type="number" min={0} step={50000} inputMode="numeric" value={maxP} onChange={(e) => setMaxP(e.target.value)} /></div>
        {tipo === "edificios" && <div className="fld"><label className="lb" htmlFor="ls-minv">Viviendas mínimas (estimadas)</label><input id="ls-minv" type="number" min={0} step={1} inputMode="numeric" value={minV} onChange={(e) => setMinV(e.target.value)} /></div>}
        {tipo === "edificios" && <div className="fld"><label className="lb" htmlFor="ls-pv">Máximo por vivienda (€)</label><input id="ls-pv" type="number" min={0} step={10000} inputMode="numeric" value={maxPv} onChange={(e) => setMaxPv(e.target.value)} /></div>}
        <div className="fld"><label className="lb" htmlFor="ls-ord">Ordenar por</label>
          <select id="ls-ord" value={orden} onChange={(e) => setOrden(e.target.value as Orden)}>
            {tipo === "edificios" && <option value="pv">Más barato por vivienda</option>}
            <option value="precio">Precio más bajo</option><option value="m2">Más superficie</option><option value="relevancia">Orden del portal</option>
          </select></div>
      </div>
      {tipo === "edificios" && <label className="note" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={verTodo} onChange={(e) => setVerTodo(e.target.checked)} /> Mostrar también apartamentos turísticos, hoteles, traspasos y solares</label>}
      <p className="note"><b>Función en pruebas.</b> Solo cubre València y se actualiza como mucho una vez al día. Hay un máximo diario de consultas compartido entre todas las personas que prueban la app: si se agota, verás un aviso y podrás volver mañana.</p>
      <div><button type="button" className="btn" disabled={state.loading} onClick={run}>{state.loading ? "Buscando…" : "Buscar en " + (ciudad === "valencia" ? "València" : ciudad)}</button></div>
      {state.err && <p className="warn" role="alert">{state.err}</p>}
      {state.res && (
        <>
          <p className="warn" role="note">Aviso: las viviendas estimadas y el precio por vivienda salen de los m² construidos del anuncio (suponiendo unos 80 m² por vivienda) y <b>pueden no ser exactos</b>. Confirma siempre los datos en el anuncio original.</p>
          <p className="note">{items.length} de {state.res.items.length} resultados · Fuente: {state.res.fuente} · Actualizado {new Date(state.res.actualizado).toLocaleString("es-ES")}. Las viviendas estimadas suponen unos 80 m² construidos por vivienda: es solo una pista, confirma siempre en el anuncio.</p>
          <div className="res-list">
            {items.map((l) => (
              <article key={l.id} className="listing">
                <Photos fotos={l.fotos ?? []} alt={`${l.titulo} en ${l.zona}`} />
                <h4>{tituloLegible(l)}</h4>
                {etiquetas(l, tipo).map((e) => <span key={e} className="ex">{ETIQUETA_TEXTO[e]}</span>)}
                <div className="tag">{l.zona}</div>
                <div className="nums" style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13.5 }}>
                  <span>Precio <b>{l.precio ? eur(l.precio) : "—"}</b></span>
                  <span>Superficie <b>{l.m2 ? fnum(l.m2, 0) + " m²" : "—"}</b></span>
                  {l.precio && l.m2 ? <span>€/m² <b>{eur(l.precio / l.m2)}</b></span> : null}
                  {viviendasEstimadas(l, tipo) ? <span title="Estimación orientativa a partir de los m² del anuncio">≈ <b>{viviendasEstimadas(l, tipo)}</b> viviendas · <b>{eur(precioPorVivienda(l, tipo)!)}</b>/vivienda <i>(estimado)</i></span> : null}
                </div>
                <MapBox query={`${l.zona} ${CIUDAD_NOMBRE[ciudad] ?? ciudad}`} />
                {l.resumen && <p className="desc">{l.resumen}</p>}
                <div className="acts" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a className="btn ghost sm" href={l.url} target="_blank" rel="noopener noreferrer">Ver anuncio ↗</a>
                  <button type="button" className="btn sm" onClick={() => onPick({ ...l, titulo: tituloLegible(l) }, state.res!.tipo)}>Apuntar como candidato</button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
