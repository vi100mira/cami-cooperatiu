"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { simularTerrenoCalculado } from "@/lib/simulacion";
import { calcTerreno, valoresDe, parametrosRelevantes, CLASES, type ClaseSuelo, type TerrenoInput, type TerrenoResultado } from "@/lib/terreno";
import { normativaPara, PARAMS, EDITABLES, ORIGEN_TEXTO, VERIF_TEXTO, type ParamKey, type Resuelto, type NormativaResuelta, type Verificacion } from "@/lib/normativa";
import { eur, nf0, fnum } from "@/lib/format";
import { TriangleAlert, Info, ExternalLink, ChevronRight } from "lucide-react";
import { Card, CardTitle } from "./ui/card";
import { Alert } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Disclosure } from "./ui/disclosure";
import { NativeSelect } from "./ui/select";
import { Label } from "./ui/field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

type Editable = "vialesPor100" | "costeViales" | "costeVerdes";
const AJUSTES: { k: Editable; l: string; u: string; step: number }[] = [
  { k: "vialesPor100", l: "Viales", u: "m² por 100 m² de techo", step: 1 },
  { k: "costeViales", l: "Coste de urbanizar viales", u: "€/m²", step: 10 },
  { k: "costeVerdes", l: "Coste de urbanizar zonas verdes", u: "€/m²", step: 10 },
];
const TAB = "px-3 py-1.5 text-[13px]";

function NumField({ id, label, unit, value, step, hint, placeholder, required, onChange }: {
  id: string; label: string; unit?: string; value: number | undefined; step: number; hint?: string; placeholder?: string; required?: boolean; onChange: (v: number | undefined) => void;
}) {
  const [txt, setTxt] = useState<string | null>(null);
  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="num">
        <input type="number" id={id} inputMode="decimal" min={0} step={step} value={txt ?? (value ?? "")} placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value; setTxt(raw);
            if (raw === "") { if (!required) onChange(undefined); return; }
            const v = parseFloat(raw); onChange(isNaN(v) || v < 0 ? 0 : v);
          }}
          onBlur={() => setTxt(null)} />
        {unit && <span className="u">{unit}</span>}
      </div>
      {hint && <p className="note">{hint}</p>}
    </div>
  );
}

const fecha = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const pct = (x: number) => Math.round(x * 100);

function Cascada({ r }: { r: TerrenoResultado }) {
  const aUrbanizar = r.clase === "urbanizable" || r.clase === "urbano-por-urbanizar";
  const suelo: [string, number, string][] = aUrbanizar
    ? [["Viales", r.viales, "color-mix(in srgb, var(--ink-3) 70%, var(--surface))"], ["Zonas verdes (mínimo)", r.verdes, "color-mix(in srgb, var(--good) 55%, var(--surface))"], ["Equipamientos y otras dotaciones", r.otrasDotaciones, "color-mix(in srgb, var(--ink-3) 35%, var(--surface))"], ["Parcelas edificables", r.sueloEdificable, "var(--s1)"]]
    : [["Parcela edificable", r.sueloEdificable, "var(--s1)"]];
  const techo: [string, number, string][] = [["Cesión a la administración", r.cesionTecho, "color-mix(in srgb, var(--ink-3) 70%, var(--surface))"], ["Techo para la cooperativa", r.techoCooperativa, "var(--s1)"]];
  const filas = (partes: [string, number, string][]) => partes.filter((x) => x[1] > 0);
  const lg = (partes: [string, number, string][], total: number) => partes.map((x) => <div key={x[0]}><span className="sw" style={{ background: x[2] }} /><span>{x[0]}</span><span className="v">{nf0.format(x[1])} m² · {total > 0 ? pct(x[1] / total) : 0} %</span></div>);
  return (
    <>
      <div>
        <div className="sub">Del suelo bruto al suelo edificable</div>
        <div className="bar" role="img" aria-label={`Reparto de ${nf0.format(r.sueloBruto)} m² de suelo: ${suelo.map((x) => `${x[0]} ${nf0.format(x[1])} m²`).join(", ")}`}>
          {filas(suelo).map((x) => <i key={x[0]} style={{ flex: `${x[1].toFixed(2)} 1 0`, background: x[2] }} title={`${x[0]}: ${nf0.format(x[1])} m²`} />)}
        </div>
        <div className="lg">{lg(suelo, r.sueloBruto)}</div>
      </div>
      <div>
        <div className="sub">Del techo máximo al techo para la cooperativa</div>
        <div className="bar" role="img" aria-label={`Reparto de ${nf0.format(r.techoTotal)} m² de techo: cesión ${nf0.format(r.cesionTecho)} m², cooperativa ${nf0.format(r.techoCooperativa)} m²`}>
          {filas(techo).map((x) => <i key={x[0]} style={{ flex: `${x[1].toFixed(2)} 1 0`, background: x[2] }} title={`${x[0]}: ${nf0.format(x[1])} m²`} />)}
        </div>
        <div className="lg">{lg(techo, r.techoTotal)}</div>
      </div>
    </>
  );
}

function Avisos({ r, p, t, vppRango }: { r: TerrenoResultado; p: Record<ParamKey, number>; t: TerrenoInput; vppRango?: [number, number] }) {
  const m2 = Math.max(1, t.m2Vivienda || 90);
  const aviso = (v: "info" | "warning", texto: React.ReactNode, i: boolean) => <Alert variant={v}>{i ? <Info aria-hidden /> : <TriangleAlert aria-hidden />}<span>{texto}</span></Alert>;
  return (
    <>
      {r.avisos.includes("edif-recortada") && aviso("warning", <>Edificabilidad limitada a {fnum(p.edifMax, 2)} m² de techo por m² de suelo, el tope de la norma.</>, false)}
      {r.avisos.includes("densidad") && aviso("warning", <>Densidad máxima de {fnum(p.densMax, 0)} viviendas por hectárea: el sector queda en {fnum((p.densMax * r.sueloBruto) / 10000, 0)} (con {fnum(m2, 0)} m² por vivienda el techo daría {fnum(r.viviendasSector, 0)}).</>, false)}
      {r.avisos.includes("por-urbanizar") && aviso("info", <>Suelo urbano por urbanizar: las dotaciones y los viales los fija el plan del ayuntamiento. Estas cifras son un tope orientativo.</>, true)}
      {r.avisos.includes("solar") && aviso("info", <>Solar: sin cesiones ni urbanización. Pide la edificabilidad al ayuntamiento (cédula urbanística).</>, true)}
      {r.reservaVPPPct > 0 && aviso("info", <>El {fnum(r.reservaVPPPct, 0)} % del techo ({nf0.format(r.reservaVPPTecho)} m²) será vivienda protegida, con sus precios máximos y requisitos.{vppRango && <> La cifra está por comprobar: entre el {fnum(vppRango[0], 0)} % y el {fnum(vppRango[1], 0)} % serían {nf0.format((r.techoTotal * vppRango[0]) / 100)} a {nf0.format((r.techoTotal * vppRango[1]) / 100)} m². Los municipios pequeños con poca construcción pueden estar exentos (pestaña Normas).</>}</>, true)}
    </>
  );
}

function Costes({ r }: { r: TerrenoResultado }) {
  const c = r.costes;
  return (
    <div>
      <div className="facts">
        <div><span>Precio del terreno</span><b>{eur(c.suelo)}</b></div>
        {c.urbanizacion > 0 && <div><span>Urbanizar viales y zonas verdes</span><b>{eur(c.urbanizacion)}</b></div>}
        {c.otros > 0 && <div><span>Otros costes de urbanización</span><b>{eur(c.otros)}</b></div>}
        {c.espera > 0 && <div><span>Interés del suelo durante la espera</span><b>{eur(c.espera)}</b></div>}
        <div><span>Total del suelo ya urbanizado</span><b>{eur(c.total)}</b></div>
        {r.porM2Techo != null && <div><span>Por m² de techo de la cooperativa</span><b>{eur(r.porM2Techo)}</b></div>}
        {r.porVivienda != null && <div><span>Por vivienda</span><b>{eur(r.porVivienda)}</b></div>}
      </div>
      {c.urbanizacion > 0 && <p className="note mt-2">La urbanización no incluye equipamientos, IVA, honorarios ni conexiones a redes generales: súmalos en «Más ajustes → Otros costes».</p>}
    </div>
  );
}

const articuloTexto = (a: string) => (/^\d/.test(a) ? `art. ${a}` : a);

/** Una regla en una sola línea; la fuente y la nota se despliegan al pulsarla. */
function Fila({ k, r, valor, modificado }: { k: ParamKey; r: Resuelto; valor: number; modificado: boolean }) {
  const f = r.fuente;
  return (
    <li className="rounded-lg border bg-card">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-1.5 text-sm leading-snug [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="font-semibold">{PARAMS[k].etiqueta}</span>
            <span className="block text-[13px] text-muted-foreground">{PARAMS[k].regla(valor)}{modificado && <> · cambiado por ti</>}</span>
          </span>
          <Badge variant={r.verif === "verificada" ? "success" : r.verif === "comprobar" ? "warning" : "outline"} className="shrink-0">{VERIF_TEXTO[r.verif]}</Badge>
        </summary>
        <div className="grid gap-1 border-t px-3 py-2 text-[13px] text-muted-foreground">
          <div>{ORIGEN_TEXTO[r.origen]} · {f.norma}, {articuloTexto(f.articulo)}{f.secundaria ? " (leída en una fuente secundaria que reproduce el texto consolidado)" : ""} · consultada el {fecha(f.consultada)}.</div>
          {r.nota && <div>{r.nota}</div>}
          <a className="inline-flex w-fit items-center gap-0.5 font-semibold text-primary underline" href={f.url} target="_blank" rel="noopener noreferrer">Ver fuente <ExternalLink className="size-3" aria-hidden /></a>
        </div>
      </details>
    </li>
  );
}

/** «5 verificadas · 1 por comprobar · 3 estimaciones», sin los ceros. */
function resumenNormas(n: NormativaResuelta, claves: ParamKey[]): string {
  const c = (v: Verificacion) => claves.filter((k) => n.params[k].verif === v).length;
  const partes: string[] = [];
  const ver = c("verificada"), com = c("comprobar"), est = c("estimacion");
  if (ver) partes.push(`${ver} ${ver === 1 ? "verificada" : "verificadas"}`);
  if (com) partes.push(`${com} por comprobar`);
  if (est) partes.push(`${est} ${est === 1 ? "estimación" : "estimaciones"}`);
  return partes.join(" · ");
}

function Normas({ n, claves, p }: { n: NormativaResuelta; claves: ParamKey[]; p: Record<ParamKey, number> }) {
  return (
    <div className="grid gap-2.5">
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
        <Badge variant="soft">{n.cargada ? `Normativa: ${n.nombre}` : "Sin normativa de tu comunidad"}</Badge>
        <span>{n.revisada ? `revisada el ${fecha(n.revisada)} · ` : ""}pulsa una regla para ver su fuente</span>
      </div>
      <ul className="grid gap-1">{claves.map((k) => <Fila key={k} k={k} r={n.params[k]} valor={p[k]} modificado={EDITABLES.includes(k) && p[k] !== n.params[k].valor} />)}</ul>
      <p className="note">Orientación, no asesoría: el plan de cada ayuntamiento manda. Pide el informe o la cédula urbanística antes de comprar.</p>
    </div>
  );
}

export default function Terreno() {
  const { s, set } = useStore();
  const t = s.terreno;
  const n = normativaPara(s.group.region);
  const p = valoresDe(n, t);
  const r = calcTerreno(t, p, s.calc.interes);
  const clase = CLASES.find((c) => c.id === t.clase) ?? CLASES[2];
  const [vista, setVista] = useState("reparto");
  const claves = parametrosRelevantes(t.clase);
  const hayNormas = claves.length > 0;
  const activa = vista === "normas" && !hayNormas ? "reparto" : vista;
  const up = (patch: Partial<TerrenoInput>) => set((x) => ({ ...x, terreno: { ...x.terreno, ...patch } }));
  const hayCambios = AJUSTES.some((a) => typeof t[a.k] === "number");
  const usar = () => {
    set((x) => simularTerrenoCalculado(x, { coste: r.costes.total, viviendas: r.viviendas }));
    window.dispatchEvent(new CustomEvent("cami:goto", { detail: "calc" }));
  };
  const noUrb = t.clase === "no-urbanizable";
  const aUrbanizar = t.clase === "urbanizable" || t.clase === "urbano-por-urbanizar";
  const m2 = Math.max(1, t.m2Vivienda || 90);

  return (
    <Card id="cT" className="gap-4">
      <CardTitle className="text-xl">Del terreno a las viviendas</CardTitle>
      <p className="max-w-[68ch] text-sm text-muted-foreground">Un terreno no se puede construir entero: según la clase de suelo hay que ceder parte, dejar viales y zonas verdes y respetar un tope de edificabilidad. Aquí ves cuánto queda y cuánto cuesta.</p>
      {!n.cargada && (
        <Alert variant="warning"><TriangleAlert aria-hidden /><span>Aún no tenemos cargada la normativa de {n.nombre}: se usa el marco estatal y, donde no existe, la referencia valenciana <b>solo como ejemplo</b>. Compruébalo con el ayuntamiento o un técnico urbanista.</span></Alert>
      )}

      {!noUrb && (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl p-4" style={{ background: "var(--surface-2)" }}>
          <div className="hero-n"><span className="eyebrow">Viviendas posibles</span><span className="big">{nf0.format(r.viviendas)}<small>{r.viviendas === 1 ? "vivienda" : "viviendas"}</small></span></div>
          <div className="grid min-w-0 flex-1 gap-1 text-[13px] text-muted-foreground sm:min-w-[16rem]">
            <span>{nf0.format(r.techoCooperativa)} m² de techo para la cooperativa, a {fnum(m2, 0)} m² por vivienda.</span>
            {hayNormas && <button type="button" className="w-fit text-left underline" onClick={() => setVista("normas")}>{n.cargada ? n.nombre : "Marco estatal y referencias"}: {resumenNormas(n, claves)}</button>}
          </div>
          {r.viviendas >= 1 && <Button onClick={usar} title="Carga el coste del suelo ya urbanizado y las viviendas en «Cuota mensual de cada vivienda»">Usar en las calculadoras de cuota</Button>}
        </div>
      )}
      {!noUrb && r.avisos.includes("sin-viviendas") && <Alert variant="danger"><TriangleAlert aria-hidden /><span>Con estos datos no sale ninguna vivienda. Revisa la superficie, la edificabilidad o los metros por vivienda.</span></Alert>}

      <div className="grid items-start gap-4 min-[880px]:grid-cols-2">
        <div className="inputs">
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="ct-clase">Clase de suelo</Label>
            <NativeSelect id="ct-clase" value={t.clase} onChange={(e) => up({ clase: e.target.value as ClaseSuelo })}>
              {CLASES.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </NativeSelect>
            <p className="note">{clase.ayuda}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumField id="ct-sup" label="Superficie" unit="m²" step={100} value={t.superficie} required onChange={(v) => v !== undefined && up({ superficie: v })} />
            <NumField id="ct-precio" label="Precio del terreno" unit="€" step={10000} value={t.precio} required onChange={(v) => v !== undefined && up({ precio: v })} />
          </div>
          {!noUrb && <NumField id="ct-edif" label="Edificabilidad prevista" unit="m² de techo por m²" step={0.05} value={t.edif} required onChange={(v) => v !== undefined && up({ edif: v })}
            hint={t.clase === "urbanizable" ? `Tope ${n.cargada ? `en ${n.nombre}` : "del ejemplo valenciano"}: ${fnum(p.edifMax, 2)} m² de techo por m² de suelo.` : "La fija el plan del ayuntamiento."} />}
          {!noUrb && (
            <div className="grid grid-cols-2 gap-3">
              <NumField id="ct-m2" label="Metros por vivienda" unit="m²" step={5} value={t.m2Vivienda} required onChange={(v) => v !== undefined && up({ m2Vivienda: v })} hint="Con su parte de zonas comunes." />
              <NumField id="ct-anios" label="Años hasta construir" unit="años" step={1} value={t.anios} required onChange={(v) => v !== undefined && up({ anios: v })} hint="Estimación, sin plazo oficial." />
            </div>
          )}
          {!noUrb && (
            <Disclosure summary="Más ajustes: otros costes y estimaciones">
              <NumField id="ct-otros" label="Otros costes de urbanización" unit="€" step={5000} value={t.otros} required onChange={(v) => v !== undefined && up({ otros: v })} hint="Honorarios, conexiones a redes generales, IVA…" />
              {aUrbanizar && (
                <>
                  <p className="note">Viales y costes son referencias, no normas. Cámbialos si tienes el presupuesto o el plan del ayuntamiento; si borras el valor, vuelve a la referencia.</p>
                  {AJUSTES.map((a) => <NumField key={a.k} id={"ct-" + a.k} label={a.l} unit={a.u} step={a.step} value={t[a.k]} placeholder={String(n.params[a.k].valor)} onChange={(v) => up({ [a.k]: v } as Partial<TerrenoInput>)} />)}
                  {hayCambios && <div><Button size="sm" variant="ghost" onClick={() => up({ vialesPor100: undefined, costeViales: undefined, costeVerdes: undefined })}>Volver a las referencias</Button></div>}
                </>
              )}
            </Disclosure>
          )}
        </div>

        <div className="res" aria-live="polite">
          {noUrb ? (
            <>
              <Alert variant="danger"><TriangleAlert aria-hidden /><span>Con carácter general, el suelo no urbanizable no permite construir vivienda colectiva. Un precio bajo por m² aquí es una trampa: solo serviría si se reclasifica, y eso es lento, incierto y depende del ayuntamiento y de la comunidad.</span></Alert>
              <div className="facts"><div><span>Lo que pagarías por el terreno</span><b>{eur(r.costes.suelo)}</b></div><div><span>Viviendas que se podrían construir</span><b>0</b></div></div>
            </>
          ) : (
            <Tabs value={activa} onValueChange={setVista} className="grid gap-3">
              <TabsList aria-label="Detalle del resultado" className="flex-wrap">
                <TabsTrigger value="reparto" className={TAB}>Reparto</TabsTrigger>
                <TabsTrigger value="costes" className={TAB}>Costes</TabsTrigger>
                {hayNormas && <TabsTrigger value="normas" className={TAB}>Normas ({claves.length})</TabsTrigger>}
              </TabsList>
              <TabsContent value="reparto">
                <Avisos r={r} p={p} t={t} vppRango={n.params.reservaVPP?.rango} />
                {r.edificable && <Cascada r={r} />}
              </TabsContent>
              <TabsContent value="costes"><Costes r={r} /></TabsContent>
              {hayNormas && <TabsContent value="normas"><Normas n={n} claves={claves} p={p} /></TabsContent>}
            </Tabs>
          )}
        </div>
      </div>
    </Card>
  );
}
