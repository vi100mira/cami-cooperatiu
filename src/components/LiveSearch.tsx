"use client";
import { useEffect, useState } from "react";
import { crearMemoria } from "@/lib/memoria";
import { eur, fnum } from "@/lib/format";
import { useStore } from "@/lib/store";
import { capacidad } from "@/lib/calc";
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
import { filtrarTodo, ajuste, viviendasEstimadas, precioPorVivienda, etiquetas, ETIQUETA_TEXTO, ENCAJE_TEXTO, tituloLegible, type Orden, type Cooperativa } from "@/lib/fit";
import { FavButton } from "./FavButton";
import { CentroRadio, useCentro } from "./CentroRadio";
import { ubicar, distanciaKm, consultaMapa } from "@/lib/ubicacion";

type Tipo = "edificios" | "terrenos";
type Busca = Tipo | "ambos";
interface Res { tipo: Tipo; fuente: string; fallidos?: string[]; actualizado: string; items: Listing[]; }
const CIUDAD_NOMBRE: Record<string, string> = { valencia: "València", "valencia-provincia": "provincia de València" };
const MSG: Record<string, string> = {
  desactivada: "La búsqueda en vivo está apagada ahora mismo. Puedes usar los enlaces de portales de la sección de entidades.",
  limite_diario: "Se ha alcanzado el límite diario de consultas de la búsqueda en vivo. Es un límite compartido entre todas las personas que prueban la app, para no generar costes. Vuelve a intentarlo mañana; mientras tanto puedes usar los botones de portales de arriba.",
  demasiadas_peticiones: "Has hecho demasiadas consultas seguidas desde tu conexión. Espera un rato y vuelve a probar.",
  no_disponible: "El portal no ha respondido, o ha cambiado su web y no hemos podido leerla. Inténtalo más tarde y, si sigue fallando, usa los botones de portales de arriba.",
};

type Estado = { loading: boolean; resultados?: Res[]; avisos?: string[]; err?: string };
interface Busq { tipo: Busca; lugar: string; maxP: string; minV: string; maxPv: string; orden: Orden; verTodo: boolean; soloEncaje: boolean; ocultarSinUbicacion: boolean; state: Estado }
const POR_DEFECTO: Busq = { tipo: "edificios", lugar: "", maxP: "", minV: "", maxPv: "", orden: "ajuste", verTodo: false, soloEncaje: true, ocultarSinUbicacion: false, state: { loading: false } };
// La búsqueda (tipo, filtros y resultados) vive fuera del componente: al ir a otra pestaña (por ejemplo, a la calculadora)
// este se desmonta, y así no hay que repetir la búsqueda al volver. Sobrevive también a recargar dentro de la visita.
const memoria = crearMemoria<Busq>("camiBusqueda.v1", POR_DEFECTO,
  (x) => (x && typeof x === "object" && (x as Busq).state && typeof (x as Busq).tipo === "string" ? { ...POR_DEFECTO, ...(x as Busq) } : null),
  (b) => ({ ...b, state: { ...b.state, loading: false } }));

export default function LiveSearch({ onPick, onSim, ciudad: ciudadBase }: { onPick: (l: Listing, t: Tipo) => void; onSim: (l: Listing, t: Tipo) => void; ciudad: string }) {
  const [b, setB] = useState<Busq>(memoria.leer);
  useEffect(() => { setB(memoria.leer()); return memoria.suscribir(setB); }, []);
  const up = (p: Partial<Busq>) => memoria.escribir({ ...memoria.leer(), ...p });
  const { tipo, lugar, maxP, minV, maxPv, orden, verTodo, soloEncaje, ocultarSinUbicacion, state } = b;
  const setTipo = (v: Busca) => up({ tipo: v });
  const setLugar = (v: string) => up({ lugar: v });
  const setState = (v: Estado) => up({ state: v });
  const setMaxP = (v: string) => up({ maxP: v });
  const setMinV = (v: string) => up({ minV: v });
  const setMaxPv = (v: string) => up({ maxPv: v });
  const setOrden = (v: Orden) => up({ orden: v });
  const setVerTodo = (v: boolean) => up({ verTodo: v });
  const setSoloEncaje = (v: boolean) => up({ soloEncaje: v });
  const setOcultarSinUbicacion = (v: boolean) => up({ ocultarSinUbicacion: v });
  // Siempre se busca en toda la provincia; el municipio o barrio se afina después sobre los resultados.
  const ciudad = ciudadBase + "-provincia";
  const { s } = useStore();
  // La dimensión de la cooperativa sale de Ruta (familias) y de las calculadoras (aportación, ingresos, préstamo).
  const cap = capacidad(s.calc, s.group.fam);
  // Centro de acción y distancia máxima del grupo (se editan en Ruta y aquí; son los mismos datos).
  const { municipio: centro, radio } = useCentro();
  const coop: Cooperativa = { familias: cap.familias, capital: cap.total, m2Vivienda: s.terreno?.m2Vivienda || 90 };
  // «Ambos» hace una consulta por tipo (cada una con su propia caché de 24 h) y junta los resultados.
  const run = async () => {
    setState({ loading: true });
    const tipos: Tipo[] = tipo === "ambos" ? ["edificios", "terrenos"] : [tipo];
    const salidas = await Promise.all(tipos.map(async (t): Promise<{ res: Res } | { t: Tipo; msg: string }> => {
      try {
        const r = await fetch("/api/buscar?ciudad=" + ciudad + "&tipo=" + t);
        const j = await r.json();
        return r.ok ? { res: j as Res } : { t, msg: MSG[j.error] ?? "No se ha podido buscar." };
      } catch { return { t, msg: MSG.no_disponible }; }
    }));
    const buenas = salidas.flatMap((x) => ("res" in x ? [x.res] : []));
    const malas = salidas.flatMap((x) => ("msg" in x ? [x] : []));
    if (!buenas.length) setState({ loading: false, err: malas[0]?.msg ?? MSG.no_disponible });
    else setState({ loading: false, resultados: buenas, avisos: malas.map((m) => "No se han podido cargar los " + m.t + ": " + m.msg) });
  };
  const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const q = norm(lugar.trim());
  const resultados = state.resultados ?? [];
  const grupos = resultados.map((r) => ({ tipo: r.tipo, items: q ? r.items.filter((l) => norm(`${l.zona} ${l.titulo}`).includes(q)) : r.items }));
  const total = resultados.reduce((n, r) => n + r.items.length, 0);
  const conEdificios = tipo !== "terrenos";
  const filtros = { maxPrecio: parseFloat(maxP) || 0, minViv: parseInt(minV, 10) || 0, maxPv: parseFloat(maxPv) || 0, orden, verTodo, coop, centro: centro ? { lat: centro.lat, lon: centro.lon } : undefined, radioKm: radio, ocultarSinUbicacion };
  const items = filtrarTodo(grupos, { ...filtros, soloEncaje });
  // Cuántos resultados se esconden solo por no encajar con la cooperativa, para poder avisarlo.
  const ocultos = soloEncaje ? filtrarTodo(grupos, { ...filtros, soloEncaje: false }).length - items.length : 0;
  // Cuántos resultados se esconden solo por estar fuera del radio, y cuántos se muestran sin poder comprobar dónde están.
  const fueraDeRadio = centro && radio > 0 ? filtrarTodo(grupos, { ...filtros, soloEncaje, radioKm: 0, ocultarSinUbicacion: false }).length - items.length : 0;
  const sinUbicar = centro ? items.filter((e) => !ubicar(e.l)).length : 0;
  const nombreCiudad = CIUDAD_NOMBRE[ciudad] ?? ciudad;
  const fallidos = [...new Set(resultados.flatMap((r) => r.fallidos ?? []))];
  return (
    <Card>
      <ToggleChips label="Tipo de inmueble" value={tipo} options={[["edificios", "Edificios"], ["terrenos", "Terrenos"], ["ambos", "Ambos"]]} onChange={(t) => { setTipo(t); setState({ loading: false }); }} />
      {tipo === "ambos" && <p className="text-[13px] text-muted-foreground">«Ambos» hace dos consultas, una por tipo, y cada una cuenta para el límite diario compartido. Verás edificios y terrenos mezclados y ordenados juntos.</p>}
      <Alert variant="info"><Info aria-hidden /><span><b>Función en pruebas.</b> Busca en toda la {nombreCiudad}, incluidos terrenos de bancos, y se actualiza como mucho una vez al día. Hay un máximo diario de consultas compartido entre todas las personas que prueban la app: si se agota, verás un aviso y podrás volver mañana.</span></Alert>
      <div><Button disabled={state.loading} onClick={run}>{state.loading ? <><Loader2 className="animate-spin" aria-hidden /> Buscando…</> : <><Search aria-hidden /> Buscar en la {nombreCiudad}</>}</Button></div>
      {state.err && <Alert variant="danger" role="alert"><TriangleAlert aria-hidden /><span>{state.err}</span></Alert>}
      {state.resultados && (
        <>
      <div className="grid gap-1"><div className="font-heading text-base font-bold">Afina los resultados</div><p className="text-[13px] text-muted-foreground">Los filtros se aplican al momento sobre lo encontrado, sin gastar nuevas consultas.</p></div>
      <FormGrid>
        <Field label="Municipio o barrio (opcional)" htmlFor="ls-lugar"><Input id="ls-lugar" type="text" autoComplete="off" placeholder="Por ejemplo, València, Torrent o Russafa" value={lugar} onChange={(e) => setLugar(e.target.value)} /></Field>
        <Field label="Precio máximo (€)" htmlFor="ls-max"><Input id="ls-max" type="number" min={0} step={50000} inputMode="numeric" value={maxP} onChange={(e) => setMaxP(e.target.value)} /></Field>
        {conEdificios && <Field label={tipo === "ambos" ? "Viviendas mínimas (solo edificios)" : "Viviendas mínimas (estimadas)"} htmlFor="ls-minv"><Input id="ls-minv" type="number" min={0} step={1} inputMode="numeric" value={minV} onChange={(e) => setMinV(e.target.value)} /></Field>}
        {conEdificios && <Field label={tipo === "ambos" ? "Máximo por vivienda (€, solo edificios)" : "Máximo por vivienda (€)"} htmlFor="ls-pv"><Input id="ls-pv" type="number" min={0} step={10000} inputMode="numeric" value={maxPv} onChange={(e) => setMaxPv(e.target.value)} /></Field>}
        <Field label="Ordenar por" htmlFor="ls-ord">
          <NativeSelect id="ls-ord" value={orden} onChange={(e) => setOrden(e.target.value as Orden)}>
            <option value="ajuste">Ajustado a tu cooperativa</option>
            {centro && <option value="cerca">Más cerca del centro</option>}
            {conEdificios && <option value="pv">Más barato por vivienda</option>}
            <option value="precio">Precio más bajo</option><option value="m2">Más superficie</option><option value="relevancia">Orden del portal</option>
          </NativeSelect></Field>
      </FormGrid>
      <div className="grid gap-2 rounded-lg border px-3.5 py-3">
        <div className="font-heading text-sm font-bold">Zona de acción del grupo</div>
        <CentroRadio id="ls-cr" />
        {centro && radio > 0 && (
          <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px]"><Checkbox className="mt-0.5" checked={ocultarSinUbicacion} onCheckedChange={(v) => setOcultarSinUbicacion(v === true)} /> <span>Ocultar también los anuncios que no sé ubicar{sinUbicar > 0 && !ocultarSinUbicacion && <b className="ml-1 text-foreground">({sinUbicar} {sinUbicar === 1 ? "se muestra" : "se muestran"} sin comprobar)</b>}</span></label>
        )}
      </div>
      <div className="grid gap-2 rounded-lg bg-accent px-3.5 py-2.5 text-[13.5px]">
        <span><b>Tu cooperativa:</b> {cap.familias} {cap.familias === 1 ? "familia" : "familias"} y un capital orientativo de unos <b>{eur(cap.total)}</b> (aportación inicial y préstamo hasta el 30 % de los ingresos, con los datos de las calculadoras, que son ejemplos hasta que los cambies). Se supone que el suelo o edificio no debería pasar de la mitad: el resto es obra y gastos.</span>
        <label className="flex cursor-pointer items-start gap-2.5"><Checkbox className="mt-0.5" checked={soloEncaje} onCheckedChange={(v) => setSoloEncaje(v === true)} /> <span>Ocultar lo muy grande, muy pequeño o más caro que todo vuestro capital{ocultos > 0 && <b className="ml-1 text-foreground">({ocultos} {ocultos === 1 ? "oculto" : "ocultos"})</b>}</span></label>
      </div>
      {conEdificios && (
        <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-muted-foreground">
          <Checkbox checked={verTodo} onCheckedChange={(v) => setVerTodo(v === true)} /> Mostrar también apartamentos turísticos, hoteles, traspasos y solares
        </label>
      )}
          <Alert variant="warning"><TriangleAlert aria-hidden /><span>Las viviendas estimadas y el precio por vivienda salen de los m² construidos del anuncio (suponiendo unos 80 m² por vivienda) y <b>pueden no ser exactos</b>. Confirma siempre los datos en el anuncio original.</span></Alert>
          {!!fallidos.length && <Alert variant="warning"><TriangleAlert aria-hidden /><span>No hemos podido leer {fallidos.join(", ")} en esta consulta, así que faltan sus anuncios. Prueba mañana o usa los botones de portales.</span></Alert>}
          {(state.avisos ?? []).map((a) => <Alert key={a} variant="warning"><TriangleAlert aria-hidden /><span>{a}</span></Alert>)}
          <p className="text-[13px] text-muted-foreground"><b className="text-foreground">{items.length}</b> de {total} resultados{fueraDeRadio > 0 && <> ({fueraDeRadio} fuera de los {radio} km)</>} · Fuente: {[...new Set(resultados.map((r) => r.fuente))].join(" · ")} · Actualizado {new Date(Math.min(...resultados.map((r) => new Date(r.actualizado).getTime()))).toLocaleString("es-ES")}.</p>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]">
            {items.map(({ l, tipo: t }) => {
              const viv = viviendasEstimadas(l, t);
              const aj = ajuste(l, t, coop);
              const u = centro ? ubicar(l) : null;
              const km = centro && u ? distanciaKm(centro, u.municipio) : null;
              return (
                <Card key={l.id} className="gap-3 p-3.5 shadow-none transition hover:shadow-md" >
                  <article className="grid gap-2.5">
                    <Photos fotos={l.fotos ?? []} alt={`${l.titulo} en ${l.zona}`} />
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {tipo === "ambos" && <Badge variant="soft">{t === "terrenos" ? "Terreno" : "Edificio"}</Badge>}
                        {l.fuente && <Badge variant="outline">{l.fuente}</Badge>}
                        {l.gestora && <Badge variant="warning" title="Gestora de activos de Sareb. No todo lo que publica es de Sareb: también gestiona carteras de bancos y cesiones de remate. Pregunta por el origen y la situación del inmueble.">Gestora de Sareb · {l.gestora}</Badge>}
                        {etiquetas(l, t).map((e) => <Badge key={e} variant="warning">{ETIQUETA_TEXTO[e]}</Badge>)}
                        {aj.etiquetas.map((e) => <Badge key={e} variant={e === "encaja" ? "success" : e === "sin-dato" ? "outline" : "warning"}>{ENCAJE_TEXTO[e]}</Badge>)}
                        {centro && (u && km != null
                          ? <Badge variant="outline" title="Distancia en línea recta entre municipios; orientativa">{km < 1 ? `En ${u.municipio.nombre}` : `${u.municipio.nombre} · a ${Math.round(km)} km`}</Badge>
                          : <Badge variant="outline" title="No se ha podido saber en qué municipio está">Ubicación sin comprobar</Badge>)}
                      </div>
                      <FavButton l={l} tipo={t} />
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
                    {viv ? <p className="rounded-lg bg-accent px-3 py-2 text-[13px]" title="Estimación orientativa a partir de los m² del anuncio">≈ <b>{viv}</b> viviendas · <b>{eur(precioPorVivienda(l, t)!)}</b>/vivienda <i className="text-muted-foreground">(estimado)</i></p> : null}
                    <MapBox query={consultaMapa(l)} />
                    {l.resumen && <p className="text-[13.5px] text-muted-foreground">{l.resumen}</p>}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" disabled={!l.precio} title={l.precio ? "Abre la calculadora con el precio y las viviendas estimadas de este anuncio" : "Este anuncio no indica precio"} onClick={() => onSim(l, t)}><Calculator aria-hidden /> Simular en calculadora</Button>
                      <Button size="sm" variant="outline" onClick={() => onPick({ ...l, titulo: tituloLegible(l) }, t)}><Plus aria-hidden /> Apuntar como candidato</Button>
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
