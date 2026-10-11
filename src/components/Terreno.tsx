"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { calcTerreno, valoresDe, parametrosRelevantes, CLASES, type ClaseSuelo, type TerrenoInput, type TerrenoResultado } from "@/lib/terreno";
import { normativaPara, PARAMS, EDITABLES, ORIGEN_TEXTO, VERIF_TEXTO, type ParamKey, type Resuelto, type NormativaResuelta } from "@/lib/normativa";
import { eur, nf0, fnum } from "@/lib/format";
import { TriangleAlert, Info, ExternalLink } from "lucide-react";
import { Card, CardTitle } from "./ui/card";
import { Alert } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Disclosure } from "./ui/disclosure";
import { NativeSelect } from "./ui/select";
import { Label } from "./ui/field";

type Editable = "vialesPor100" | "costeViales" | "costeVerdes";
const AJUSTES: { k: Editable; l: string; u: string; step: number }[] = [
  { k: "vialesPor100", l: "Viales", u: "m² por 100 m² de techo", step: 1 },
  { k: "costeViales", l: "Coste de urbanizar viales", u: "€/m²", step: 10 },
  { k: "costeVerdes", l: "Coste de urbanizar zonas verdes", u: "€/m²", step: 10 },
];

function NumField({ id, label, unit, value, step, hint, placeholder, required, onChange }: {
  id: string; label: string; unit?: string; value: number | undefined; step: number; hint?: string; placeholder?: string; required?: boolean; onChange: (v: number | undefined) => void;
}) {
  const [txt, setTxt] = useState<string | null>(null);
  return (
    <div className="grid min-w-0 gap-1.5">
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

function Avisos({ r, p, t }: { r: TerrenoResultado; p: Record<ParamKey, number>; t: TerrenoInput }) {
  const m2 = Math.max(1, t.m2Vivienda || 90);
  return (
    <>
      {r.avisos.includes("edif-recortada") && <Alert variant="warning"><TriangleAlert aria-hidden /><span>La norma limita la edificabilidad a {fnum(p.edifMax, 2)} m² de techo por m² de suelo: se ha aplicado ese tope.</span></Alert>}
      {r.avisos.includes("densidad") && <Alert variant="warning"><TriangleAlert aria-hidden /><span>La densidad máxima ({fnum(p.densMax, 0)} viviendas por hectárea) limita el sector a {fnum((p.densMax * r.sueloBruto) / 10000, 0)} viviendas. Con {fnum(m2, 0)} m² por vivienda, el techo daría {fnum(r.viviendasSector, 0)}: se han recortado.</span></Alert>}
      {r.avisos.includes("por-urbanizar") && <Alert variant="info"><Info aria-hidden /><span>En suelo urbano por urbanizar, las dotaciones y los viales los fija el plan del ayuntamiento: estas cifras son un tope orientativo, y la edificabilidad no tiene el límite del suelo urbanizable.</span></Alert>}
      {r.avisos.includes("solar") && <Alert variant="info"><Info aria-hidden /><span>En un solar no se ceden dotaciones ni hay costes de urbanización, pero la edificabilidad la fija el plan del ayuntamiento. Pídela como cédula o informe urbanístico.</span></Alert>}
      {r.reservaVPPPct > 0 && <Alert variant="info"><Info aria-hidden /><span>Reserva de vivienda protegida: el {fnum(r.reservaVPPPct, 0)} % del techo ({nf0.format(r.reservaVPPTecho)} m²) tendría que ser vivienda protegida, con sus precios máximos y requisitos.</span></Alert>}
      {r.avisos.includes("sin-viviendas") && !r.avisos.includes("no-urbanizable") && <Alert variant="danger"><TriangleAlert aria-hidden /><span>Con estos datos no sale ninguna vivienda. Revisa la superficie, la edificabilidad o los metros por vivienda.</span></Alert>}
    </>
  );
}

function Costes({ r }: { r: TerrenoResultado }) {
  const c = r.costes;
  return (
    <div>
      <div className="sub">Cuánto cuesta tenerlo listo para construir</div>
      <div className="facts">
        <div><span>Precio del terreno</span><b>{eur(c.suelo)}</b></div>
        {c.urbanizacion > 0 && <div><span>Urbanizar viales y zonas verdes</span><b>{eur(c.urbanizacion)}</b></div>}
        {c.otros > 0 && <div><span>Otros costes de urbanización</span><b>{eur(c.otros)}</b></div>}
        {c.espera > 0 && <div><span>Interés del suelo durante la espera</span><b>{eur(c.espera)}</b></div>}
        <div><span>Total del suelo ya urbanizado</span><b>{eur(c.total)}</b></div>
        {r.porM2Techo != null && <div><span>Por m² de techo de la cooperativa</span><b>{eur(r.porM2Techo)}</b></div>}
        {r.porVivienda != null && <div><span>Por vivienda</span><b>{eur(r.porVivienda)}</b></div>}
      </div>
      {c.urbanizacion > 0 && <p className="note mt-2">La urbanización no incluye los equipamientos, el IVA, los honorarios ni las conexiones a redes generales: súmalos en «Otros costes» si los conoces.</p>}
    </div>
  );
}

const articuloTexto = (a: string) => (/^\d/.test(a) ? `art. ${a}` : a);

function Fila({ k, r, valor, modificado }: { k: ParamKey; r: Resuelto; valor: number; modificado: boolean }) {
  const f = r.fuente;
  return (
    <li className="grid gap-1.5 rounded-lg border p-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3">
      <div className="grid gap-0.5">
        <div className="font-semibold">{PARAMS[k].etiqueta}</div>
        <div>{PARAMS[k].regla(valor)}{modificado && <> <Badge variant="soft">cambiado por ti</Badge></>}</div>
        <div className="text-[13px] text-muted-foreground">
          {ORIGEN_TEXTO[r.origen]} · {f.norma}, {articuloTexto(f.articulo)}{f.secundaria ? " (leída en una fuente secundaria que reproduce el texto consolidado)" : ""} · consultada el {fecha(f.consultada)}.{" "}
          <a className="inline-flex items-center gap-0.5 font-semibold text-primary underline" href={f.url} target="_blank" rel="noopener noreferrer">Ver fuente <ExternalLink className="size-3" aria-hidden /></a>
        </div>
        {r.nota && <div className="text-[13px] text-muted-foreground">{r.nota}</div>}
      </div>
      <Badge variant={r.verif === "verificada" ? "success" : r.verif === "comprobar" ? "warning" : "outline"} className="w-fit">{VERIF_TEXTO[r.verif]}</Badge>
    </li>
  );
}

function Normas({ n, t, p }: { n: NormativaResuelta; t: TerrenoInput; p: Record<ParamKey, number> }) {
  const claves = parametrosRelevantes(t.clase);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-heading text-lg font-bold">Qué norma aplica a cada cifra</h3>
        <Badge variant="soft">{n.cargada ? `Normativa: ${n.nombre}` : "Sin normativa de tu comunidad"}</Badge>
        {n.revisada && <span className="text-xs text-muted-foreground">revisada el {fecha(n.revisada)}</span>}
      </div>
      {claves.length > 0
        ? <ul className="grid gap-2">{claves.map((k) => <Fila key={k} k={k} r={n.params[k]} valor={p[k]} modificado={EDITABLES.includes(k) && p[k] !== n.params[k].valor} />)}</ul>
        : <p className="text-[13px] text-muted-foreground">{t.clase === "urbano-solar" ? "Un solar no tiene cesiones ni reservas que calcular aquí. Pide al ayuntamiento la edificabilidad y los usos de la parcela." : "Con carácter general no se puede construir vivienda colectiva en este suelo, así que no hay reglas que aplicar."}</p>}
      <p className="note">Esto es orientación, no asesoría. La edificabilidad, los viales y las dotaciones reales los fija el plan de cada ayuntamiento: pide el informe o la cédula urbanística antes de comprar un terreno.</p>
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
  const up = (patch: Partial<TerrenoInput>) => set((x) => ({ ...x, terreno: { ...x.terreno, ...patch } }));
  const hayCambios = AJUSTES.some((a) => typeof t[a.k] === "number");
  const usar = () => {
    set((x) => ({ ...x, calc: { ...x.calc, suelo: Math.round(r.costes.total) }, group: { ...x.group, fam: Math.max(1, Math.min(200, r.viviendas)) } }));
    window.dispatchEvent(new CustomEvent("cami:goto", { detail: "calc" }));
  };
  const noUrb = t.clase === "no-urbanizable";
  const soloEdif = t.clase === "urbanizable";

  return (
    <Card id="cT" className="gap-5">
      <CardTitle className="text-xl">Del terreno a las viviendas</CardTitle>
      <p className="max-w-[68ch] text-sm text-muted-foreground">Un terreno no se puede construir entero: según la clase de suelo hay que ceder parte a la administración, dejar zonas verdes y viales, y respetar un tope de edificabilidad. Aquí ves cuánto queda y cuánto cuesta de verdad.</p>
      {!n.cargada && (
        <Alert variant="warning"><TriangleAlert aria-hidden /><span>Todavía no tenemos cargada la normativa de {n.nombre}. Se usa el marco estatal y, donde no existe, la referencia valenciana <b>solo como ejemplo</b>: no es la norma de tu comunidad. Compruébalo con el ayuntamiento o con un técnico urbanista.</span></Alert>
      )}
      <div className="calc-grid">
        <div className="inputs">
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="ct-clase">Clase de suelo</Label>
            <NativeSelect id="ct-clase" value={t.clase} onChange={(e) => up({ clase: e.target.value as ClaseSuelo })}>
              {CLASES.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </NativeSelect>
            <p className="note">{clase.ayuda}</p>
          </div>
          <NumField id="ct-sup" label="Superficie del terreno" unit="m²" step={100} value={t.superficie} required onChange={(v) => v !== undefined && up({ superficie: v })} />
          <NumField id="ct-precio" label="Precio del terreno" unit="€" step={10000} value={t.precio} required onChange={(v) => v !== undefined && up({ precio: v })} />
          {!noUrb && <NumField id="ct-edif" label="Edificabilidad prevista" unit="m² de techo por m² de suelo" step={0.05} value={t.edif} required onChange={(v) => v !== undefined && up({ edif: v })}
            hint={soloEdif ? `Tope ${n.cargada ? `en ${n.nombre}` : "del ejemplo valenciano"}: ${fnum(p.edifMax, 2)} m² de techo por m² de suelo.` : "Pídela al ayuntamiento: la fija su plan."} />}
          {!noUrb && <NumField id="ct-m2" label="Superficie construida por vivienda, con zonas comunes" unit="m²" step={5} value={t.m2Vivienda} required onChange={(v) => v !== undefined && up({ m2Vivienda: v })} />}
          {!noUrb && <NumField id="ct-anios" label="Años hasta poder construir" unit="años" step={1} value={t.anios} required onChange={(v) => v !== undefined && up({ anios: v })}
            hint="Estimación: no hay un plazo oficial. Mientras tanto se paga el interés del suelo, el de la calculadora de cuota." />}
          {!noUrb && <NumField id="ct-otros" label="Otros costes de urbanización" unit="€" step={5000} value={t.otros} required onChange={(v) => v !== undefined && up({ otros: v })} hint="Honorarios, conexiones a redes generales, IVA…" />}
          {(t.clase === "urbanizable" || t.clase === "urbano-por-urbanizar") && (
            <Disclosure summary="Ajustar las estimaciones de viales y costes">
              <p className="note">Son referencias, no normas. Cámbialas si tienes el presupuesto o el plan del ayuntamiento; si borras el valor, vuelve a la referencia.</p>
              {AJUSTES.map((a) => <NumField key={a.k} id={"ct-" + a.k} label={a.l} unit={a.u} step={a.step} value={t[a.k]} placeholder={String(n.params[a.k].valor)} onChange={(v) => up({ [a.k]: v } as Partial<TerrenoInput>)} />)}
              {hayCambios && <div><Button size="sm" variant="ghost" onClick={() => up({ vialesPor100: undefined, costeViales: undefined, costeVerdes: undefined })}>Volver a las referencias</Button></div>}
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
            <>
              <div className="hero-n"><span className="eyebrow">Viviendas posibles</span><span className="big">{nf0.format(r.viviendas)}<small>{r.viviendas === 1 ? "vivienda" : "viviendas"}</small></span></div>
              <p className="note">{nf0.format(r.techoCooperativa)} m² de techo para la cooperativa, a {fnum(Math.max(1, t.m2Vivienda || 90), 0)} m² por vivienda.</p>
              <Avisos r={r} p={p} t={t} />
              {r.edificable && <Cascada r={r} />}
              <Costes r={r} />
              {r.viviendas >= 1 && (
                <div className="grid gap-1.5">
                  <Button onClick={usar}>Usar en las calculadoras de cuota</Button>
                  <p className="note">Carga el coste del suelo ya urbanizado y las viviendas en «Cuota mensual de cada vivienda».</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Normas n={n} t={t} p={p} />
    </Card>
  );
}
