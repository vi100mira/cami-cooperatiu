"use client";
import { useState } from "react";
import { eur, fnum } from "@/lib/format";
import { Photos, MapBox } from "./Media";
import type { Listing } from "@/lib/parse-fotocasa";
import { Search, ExternalLink, Calculator, Plus, Loader2, TriangleAlert, Info, Ruler, Euro } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { NativeSelect } from "./ui/select";
import { Field, FormGrid } from "./ui/field";
import { Checkbox } from "./ui/checkbox";
import { Alert } from "./ui/alert";
import { ToggleChips } from "./ui/toggle-chips";
import { filtrar, viviendasEstimadas, precioPorVivienda, etiquetas, ETIQUETA_TEXTO, tituloLegible, type Orden } from "@/lib/fit";

type Tipo = "edificios" | "terrenos";
interface Res { tipo: Tipo; fuente: string; fallidos?: string[]; actualizado: string; items: Listing[]; }
const CIUDAD_NOMBRE: Record<string, string> = { valencia: "València" };
const MSG: Record<string, string> = {
  desactivada: "La búsqueda en vivo está apagada ahora mismo. Puedes usar los enlaces de portales de la sección de entidades.",
  limite_diario: "Se ha alcanzado el límite diario de consultas de la búsqueda en vivo. Es un límite compartido entre todas las personas que prueban la app, para no generar costes. Vuelve a intentarlo mañana; mientras tanto puedes usar los botones de portales de arriba.",
  demasiadas_peticiones: "Has hecho demasiadas consultas seguidas desde tu conexión. Espera un rato y vuelve a probar.",
  no_disponible: "El portal no ha respondido, o ha cambiado su web y no hemos podido leerla. Inténtalo más tarde y, si sigue fallando, usa los botones de portales de arriba.",
};

export default function LiveSearch({ onPick, onSim, ciudad }: { onPick: (l: Listing, t: Tipo) => void; onSim: (l: Listing, t: Tipo) => void; ciudad: string }) {
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
  const nombreCiudad = ciudad === "valencia" ? "València" : ciudad;
  return (
    <Card>
      <ToggleChips label="Tipo de inmueble" value={tipo} options={[["edificios", "Edificios"], ["terrenos", "Terrenos"]]} onChange={(t) => { setTipo(t); setState({ loading: false }); }} />
      <FormGrid>
        <Field label="Precio máximo (€)" htmlFor="ls-max"><Input id="ls-max" type="number" min={0} step={50000} inputMode="numeric" value={maxP} onChange={(e) => setMaxP(e.target.value)} /></Field>
        {tipo === "edificios" && <Field label="Viviendas mínimas (estimadas)" htmlFor="ls-minv"><Input id="ls-minv" type="number" min={0} step={1} inputMode="numeric" value={minV} onChange={(e) => setMinV(e.target.value)} /></Field>}
        {tipo === "edificios" && <Field label="Máximo por vivienda (€)" htmlFor="ls-pv"><Input id="ls-pv" type="number" min={0} step={10000} inputMode="numeric" value={maxPv} onChange={(e) => setMaxPv(e.target.value)} /></Field>}
        <Field label="Ordenar por" htmlFor="ls-ord">
          <NativeSelect id="ls-ord" value={orden} onChange={(e) => setOrden(e.target.value as Orden)}>
            {tipo === "edificios" && <option value="pv">Más barato por vivienda</option>}
            <option value="precio">Precio más bajo</option><option value="m2">Más superficie</option><option value="relevancia">Orden del portal</option>
          </NativeSelect></Field>
      </FormGrid>
      {tipo === "edificios" && (
        <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-muted-foreground">
          <Checkbox checked={verTodo} onCheckedChange={(v) => setVerTodo(v === true)} /> Mostrar también apartamentos turísticos, hoteles, traspasos y solares
        </label>
      )}
      <Alert variant="info"><Info aria-hidden /><span><b>Función en pruebas.</b> Solo cubre València y se actualiza como mucho una vez al día. Hay un máximo diario de consultas compartido entre todas las personas que prueban la app: si se agota, verás un aviso y podrás volver mañana.</span></Alert>
      <div><Button disabled={state.loading} onClick={run}>{state.loading ? <><Loader2 className="animate-spin" aria-hidden /> Buscando…</> : <><Search aria-hidden /> Buscar en {nombreCiudad}</>}</Button></div>
      {state.err && <Alert variant="danger" role="alert"><TriangleAlert aria-hidden /><span>{state.err}</span></Alert>}
      {state.res && (
        <>
          <Alert variant="warning"><TriangleAlert aria-hidden /><span>Las viviendas estimadas y el precio por vivienda salen de los m² construidos del anuncio (suponiendo unos 80 m² por vivienda) y <b>pueden no ser exactos</b>. Confirma siempre los datos en el anuncio original.</span></Alert>
          {!!state.res.fallidos?.length && <Alert variant="warning"><TriangleAlert aria-hidden /><span>No hemos podido leer {state.res.fallidos.join(", ")} en esta consulta, así que faltan sus anuncios. Prueba mañana o usa los botones de portales.</span></Alert>}
          <p className="text-[13px] text-muted-foreground"><b className="text-foreground">{items.length}</b> de {state.res.items.length} resultados · Fuente: {state.res.fuente} · Actualizado {new Date(state.res.actualizado).toLocaleString("es-ES")}.</p>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]">
            {items.map((l) => {
              const viv = viviendasEstimadas(l, tipo);
              return (
                <Card key={l.id} className="gap-3 p-3.5 shadow-none transition hover:shadow-md" >
                  <article className="grid gap-2.5">
                    <Photos fotos={l.fotos ?? []} alt={`${l.titulo} en ${l.zona}`} />
                    <div className="flex flex-wrap gap-1.5">
                      {l.fuente && <Badge variant="outline">{l.fuente}</Badge>}
                      {l.gestora && <Badge variant="warning" title="Gestora de activos de Sareb. No todo lo que publica es de Sareb: también gestiona carteras de bancos y cesiones de remate. Pregunta por el origen y la situación del inmueble.">Gestora de Sareb · {l.gestora}</Badge>}
                      {etiquetas(l, tipo).map((e) => <Badge key={e} variant="warning">{ETIQUETA_TEXTO[e]}</Badge>)}
                    </div>
                    <h4 className="font-heading text-base font-bold leading-snug">{tituloLegible(l)}</h4>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-heading text-2xl font-extrabold tracking-tight">{l.precio ? eur(l.precio) : "—"}</span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{l.zona}</span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Ruler className="size-3.5" aria-hidden /><dt className="sr-only">Superficie</dt><dd><b className="font-mono font-medium text-foreground">{l.m2 ? fnum(l.m2, 0) + " m²" : "—"}</b></dd></div>
                      {l.precio && l.m2 ? <div className="flex items-center gap-1.5"><Euro className="size-3.5" aria-hidden /><dt className="sr-only">Precio por m²</dt><dd><b className="font-mono font-medium text-foreground">{eur(l.precio / l.m2)}</b>/m²</dd></div> : null}
                    </dl>
                    {viv ? <p className="rounded-lg bg-accent px-3 py-2 text-[13px]" title="Estimación orientativa a partir de los m² del anuncio">≈ <b>{viv}</b> viviendas · <b>{eur(precioPorVivienda(l, tipo)!)}</b>/vivienda <i className="text-muted-foreground">(estimado)</i></p> : null}
                    <MapBox query={`${l.zona} ${CIUDAD_NOMBRE[ciudad] ?? ciudad}`} />
                    {l.resumen && <p className="text-[13.5px] text-muted-foreground">{l.resumen}</p>}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={!l.precio} title={l.precio ? "Abre la calculadora con el precio y las viviendas estimadas de este anuncio" : "Este anuncio no indica precio"} onClick={() => onSim(l, state.res!.tipo)}><Calculator aria-hidden /> Simular en calculadora</Button>
                      <Button size="sm" variant="outline" onClick={() => onPick({ ...l, titulo: tituloLegible(l) }, state.res!.tipo)}><Plus aria-hidden /> Apuntar como candidato</Button>
                      <Button size="sm" variant="ghost" asChild><a href={l.url} target="_blank" rel="noopener noreferrer">Ver anuncio <ExternalLink aria-hidden /></a></Button>
                      {(l.otras ?? []).filter((o) => /^https:\/\//.test(o.url)).map((o) => <Button key={o.fuente} size="sm" variant="ghost" asChild><a href={o.url} target="_blank" rel="noopener noreferrer">También en {o.fuente} <ExternalLink aria-hidden /></a></Button>)}
                    </div>
                  </article>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
