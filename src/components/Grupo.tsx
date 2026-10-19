"use client";
import { useState } from "react";
import { Heart, LogOut, UserPlus, ExternalLink, Trash2, Loader2, TriangleAlert, Info, ArrowLeftRight, KeyRound, ShieldCheck, Copy, Check } from "lucide-react";
import { useGrupo, type Fav } from "@/lib/grupo";
import { slugDesde } from "@/lib/validate";
import { useStore } from "@/lib/store";
import { eur, fnum } from "@/lib/format";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { PasswordInput } from "./ui/password-input";
import { Field, FormGrid } from "./ui/field";
import { Alert } from "./ui/alert";
import { Checkbox } from "./ui/checkbox";
import { Disclosure } from "./ui/disclosure";
import { ToggleChips } from "./ui/toggle-chips";
import { Privacidad } from "./Privacidad";
import { ResumenCooperativa } from "./Cooperativa";

function useEnvio() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async (f: () => Promise<string | null>) => { setBusy(true); setErr(null); const e = await f(); setErr(e); setBusy(false); };
  return { busy, err, run };
}
const Error_ = ({ texto }: { texto: string | null }) => texto ? <Alert variant="danger" role="alert"><TriangleAlert aria-hidden /><span>{texto}</span></Alert> : null;
const Enviar = ({ busy, children, disabled }: { busy: boolean; children: React.ReactNode; disabled?: boolean }) => (
  <div><Button type="submit" disabled={busy || disabled}>{busy ? <><Loader2 className="animate-spin" aria-hidden /> Un momento…</> : children}</Button></div>
);

function FormEntrar() {
  const g = useGrupo(); const e = useEnvio();
  const [slug, setSlug] = useState(""); const [pw, setPw] = useState("");
  return (
    <form className="grid gap-4" onSubmit={(ev) => { ev.preventDefault(); e.run(() => g.entrarGrupo(slug.trim().toLowerCase(), pw)); }}>
      <FormGrid>
        <Field label="Identificador del grupo" htmlFor="gr-slug"><Input id="gr-slug" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="por ejemplo, techo-vecinal" required maxLength={60} value={slug} onChange={(ev) => setSlug(ev.target.value)} /></Field>
        <Field label="Contraseña del grupo" htmlFor="gr-pw"><PasswordInput id="gr-pw" autoComplete="off" required maxLength={200} value={pw} onChange={(ev) => setPw(ev.target.value)} /></Field>
      </FormGrid>
      <Error_ texto={e.err} />
      <Enviar busy={e.busy}>Entrar</Enviar>
    </form>
  );
}

function FormRecuperar() {
  const g = useGrupo(); const e = useEnvio();
  const [slug, setSlug] = useState(""); const [codigo, setCodigo] = useState(""); const [que, setQue] = useState<"miembro" | "grupo">("miembro");
  const [nombre, setNombre] = useState(""); const [npw, setNpw] = useState(""); const [hecho, setHecho] = useState(false);
  return (
    <div className="grid gap-3">
      <p className="max-w-[68ch] text-sm text-muted-foreground">Necesitas el <b>código de recuperación</b> del grupo, que se enseñó una sola vez al crearlo. Si lo has perdido, pídele a quien administra el grupo que restablezca tu contraseña desde dentro.</p>
      <ToggleChips label="Qué contraseña recuperas" value={que} options={[["miembro", "La de una persona"], ["grupo", "La del grupo"]]} onChange={setQue} />
      <div className="grid gap-4" role="group" aria-label="Recuperar contraseña">
        <FormGrid>
          <Field label="Identificador del grupo" htmlFor="rc-slug"><Input id="rc-slug" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={60} value={slug} onChange={(ev) => setSlug(ev.target.value)} /></Field>
          <Field label="Código de recuperación" htmlFor="rc-cod"><Input id="rc-cod" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={30} placeholder="XXXXX-XXXXX-XXXXX-XXXXX" value={codigo} onChange={(ev) => setCodigo(ev.target.value)} /></Field>
          {que === "miembro" && <Field label="Nombre de la persona" htmlFor="rc-nombre"><Input id="rc-nombre" autoComplete="off" maxLength={60} value={nombre} onChange={(ev) => setNombre(ev.target.value)} /></Field>}
          <Field label="Contraseña nueva (mín. 8)" htmlFor="rc-npw"><PasswordInput id="rc-npw" autoComplete="new-password" minLength={8} maxLength={200} value={npw} onChange={(ev) => setNpw(ev.target.value)} /></Field>
        </FormGrid>
        <Error_ texto={e.err} />
        {hecho && !e.err && <Alert variant="info" role="status"><Info aria-hidden /><span>Contraseña cambiada. Ya puedes entrar con la nueva. Arriba tienes el código de recuperación nuevo: guárdalo.</span></Alert>}
        <div><Button type="button" disabled={e.busy || !slug.trim() || !codigo.trim() || npw.length < 8 || (que === "miembro" && !nombre.trim())}
          onClick={() => e.run(async () => { const r = await g.recuperar({ slug: slug.trim().toLowerCase(), codigo, que, nombre: nombre.trim(), nuevaPassword: npw }); setHecho(r === null); if (r === null) { setCodigo(""); setNpw(""); } return r; })}>
          {e.busy ? <><Loader2 className="animate-spin" aria-hidden /> Un momento…</> : "Cambiar la contraseña"}</Button></div>
      </div>
    </div>
  );
}

function CodigoRecuperacion() {
  const g = useGrupo(); const [copiado, setCopiado] = useState(false);
  if (!g.codigoNuevo) return null;
  const copiar = async () => { try { await navigator.clipboard.writeText(g.codigoNuevo!); setCopiado(true); } catch { /* el código sigue visible */ } };
  return (
    <Alert variant="warning" role="alert" className="grid gap-2.5">
      <div className="flex items-center gap-2 font-semibold"><KeyRound className="size-4" aria-hidden /> Código de recuperación del grupo</div>
      <code className="w-fit select-all break-all rounded-md bg-background px-3 py-2 font-mono text-lg font-bold tracking-wider" aria-label="Código de recuperación">{g.codigoNuevo}</code>
      <p className="max-w-[68ch] text-sm">Guárdalo ahora en un sitio seguro: <b>no se volverá a enseñar</b>. Con él se pueden cambiar las contraseñas del grupo y de sus personas sin haber entrado, así que no lo compartas fuera del grupo. Es de un solo uso: al usarlo se genera otro.</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={copiar}>{copiado ? <><Check aria-hidden /> Copiado</> : <><Copy aria-hidden /> Copiar</>}</Button>
        <Button size="sm" onClick={() => g.descartarCodigo()}>Ya lo he guardado</Button>
      </div>
    </Alert>
  );
}

function FormCrear() {
  const g = useGrupo(); const e = useEnvio();
  const { s } = useStore(); const previo = s.group.name.trim();
  const [nombre, setNombre] = useState(previo); const [slug, setSlug] = useState(slugDesde(previo)); const [tocado, setTocado] = useState(false);
  const [pw, setPw] = useState(""); const [miembro, setMiembro] = useState(""); const [mpw, setMpw] = useState(""); const [ok, setOk] = useState(false);
  return (
    <form className="grid gap-4" onSubmit={(ev) => { ev.preventDefault(); e.run(() => g.crearGrupo({ nombre, slug, password: pw, miembro, miembroPassword: mpw })); }}>
      <FormGrid>
        <Field label="Nombre del grupo" htmlFor="cr-nombre"><Input id="cr-nombre" autoComplete="off" required minLength={2} maxLength={120} value={nombre} onChange={(ev) => { setNombre(ev.target.value); if (!tocado) setSlug(slugDesde(ev.target.value)); }} /></Field>
        <Field label="Identificador (para entrar)" htmlFor="cr-slug"><Input id="cr-slug" autoComplete="off" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={60} pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Letras minúsculas, números y guiones" value={slug} onChange={(ev) => { setTocado(true); setSlug(ev.target.value.toLowerCase()); }} /></Field>
        <Field label="Contraseña del grupo (mín. 8)" htmlFor="cr-pw"><PasswordInput id="cr-pw" autoComplete="new-password" required minLength={8} maxLength={200} value={pw} onChange={(ev) => setPw(ev.target.value)} /></Field>
        <Field label="Tu nombre o alias" htmlFor="cr-miembro"><Input id="cr-miembro" autoComplete="off" required maxLength={60} value={miembro} onChange={(ev) => setMiembro(ev.target.value)} /></Field>
        <Field label="Tu contraseña personal (mín. 8)" htmlFor="cr-mpw"><PasswordInput id="cr-mpw" autoComplete="new-password" required minLength={8} maxLength={200} value={mpw} onChange={(ev) => setMpw(ev.target.value)} /></Field>
      </FormGrid>
      {previo && <p className="text-[13px] text-muted-foreground">Hemos propuesto el nombre de tu cooperativa de la pestaña Ruta; puedes cambiarlo.</p>}
      <p className="text-[13px] text-muted-foreground">La contraseña del grupo la compartes con el resto de personas; la personal es solo tuya. Serás quien administra el grupo y, al crearlo, te daremos un código de recuperación para guardar: sin él, una contraseña perdida solo la puede restablecer quien administra.</p>
      <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px]"><Checkbox className="mt-0.5" checked={ok} onCheckedChange={(v) => setOk(v === true)} /> <span>He leído el <a className="font-semibold text-primary underline" href="#privacidad">aviso de privacidad</a> y acepto que se guarden estos datos.</span></label>
      <Error_ texto={e.err} />
      <Enviar busy={e.busy} disabled={!ok}>Crear el grupo</Enviar>
    </form>
  );
}

function Acceso() {
  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  return (
    <Card>
      <ToggleChips label="Qué quieres hacer" value={modo} options={[["entrar", "Ya tengo un grupo"], ["crear", "Crear un grupo nuevo"]]} onChange={setModo} />
      {modo === "entrar" ? <><FormEntrar /><Disclosure summary={<><KeyRound aria-hidden /> He olvidado una contraseña</>}><FormRecuperar /></Disclosure></> : <FormCrear />}
    </Card>
  );
}

function ElegirMiembro() {
  const g = useGrupo(); const e = useEnvio(); const n = useEnvio();
  const [id, setId] = useState(""); const [pw, setPw] = useState("");
  const [nombre, setNombre] = useState(""); const [npw, setNpw] = useState("");
  return (
    <Card>
      <div className="grid gap-1"><h3 className="font-heading text-lg font-bold">Grupo «{g.grupo?.nombre}»</h3><p className="text-sm text-muted-foreground">Elige quién eres y escribe tu contraseña personal para confirmarlo.</p></div>
      {g.miembros.length > 0
        ? <ToggleChips label="¿Quién eres?" value={id} options={g.miembros.map((m): [string, string] => [m.id, m.nombre])} onChange={setId} />
        : <p className="text-sm text-muted-foreground">Todavía no hay nadie en este grupo.</p>}
      {id && (
        <form className="grid gap-4" onSubmit={(ev) => { ev.preventDefault(); e.run(() => g.elegirMiembro(id, pw)); }}>
          <Field label="Tu contraseña personal" htmlFor="em-pw"><PasswordInput id="em-pw" autoComplete="off" required maxLength={200} value={pw} onChange={(ev) => setPw(ev.target.value)} /></Field>
          <Error_ texto={e.err} />
          <Enviar busy={e.busy}>Entrar como {g.miembros.find((m) => m.id === id)?.nombre}</Enviar>
        </form>
      )}
      <Disclosure summary={<><UserPlus aria-hidden /> Soy nueva en el grupo</>}>
        <form className="grid gap-4" onSubmit={(ev) => { ev.preventDefault(); n.run(() => g.anadirMiembro(nombre.trim(), npw)); }}>
          <FormGrid>
            <Field label="Tu nombre o alias" htmlFor="nm-nombre"><Input id="nm-nombre" autoComplete="off" required maxLength={60} value={nombre} onChange={(ev) => setNombre(ev.target.value)} /></Field>
            <Field label="Tu contraseña personal (mín. 8)" htmlFor="nm-pw"><PasswordInput id="nm-pw" autoComplete="new-password" required minLength={8} maxLength={200} value={npw} onChange={(ev) => setNpw(ev.target.value)} /></Field>
          </FormGrid>
          <p className="text-[13px] text-muted-foreground">Al añadirte aceptas el <a className="font-semibold text-primary underline" href="#privacidad">aviso de privacidad</a>.</p>
          <Error_ texto={n.err} />
          <Enviar busy={n.busy}>Añadirme al grupo</Enviar>
        </form>
      </Disclosure>
      <div><Button variant="ghost" size="sm" onClick={() => g.salir()}><LogOut aria-hidden /> Salir del grupo</Button></div>
    </Card>
  );
}

function FavCard({ f }: { f: Fav }) {
  const g = useGrupo(); const [err, setErr] = useState<string | null>(null);
  const d = f.datos;
  return (
    <Card className="gap-3 p-3.5 shadow-none transition hover:shadow-md">
      <article className="grid gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="soft">{d.tipo === "terrenos" ? "Terreno" : "Edificio"}</Badge>
            {d.fuente && <Badge variant="outline">{d.fuente}</Badge>}
          </div>
          {f.esMio && (
            <button type="button" aria-label="Quitar de favoritos" title="Quitar de favoritos" onClick={async () => setErr(await g.quitarFavorito(f.ofertaId))}
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-destructive text-destructive outline-none transition hover:bg-bad-soft focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <Heart className="size-[18px] fill-current" aria-hidden />
            </button>
          )}
        </div>
        <h4 className="font-heading text-base font-bold leading-snug">{d.titulo}</h4>
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-heading text-2xl font-extrabold tracking-tight">{d.precio ? eur(d.precio) : "—"}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{d.zona}</span>
        </div>
        {d.m2 ? <p className="text-[13px] text-muted-foreground"><b className="font-mono font-medium text-foreground">{fnum(d.m2, 0)} m²</b></p> : null}
        <p className="text-[13px] text-muted-foreground">Marcado por <b className="text-foreground">{f.marcadoPor}</b> · {new Date(f.fecha).toLocaleDateString("es-ES")}</p>
        {err && <p role="alert" className="text-[13px] text-destructive">{err}</p>}
        {/^https:\/\//.test(d.url) && <div><Button size="sm" variant="ghost" asChild><a href={d.url} target="_blank" rel="noopener noreferrer">Ver anuncio <ExternalLink aria-hidden /></a></Button></div>}
      </article>
    </Card>
  );
}

function CambiarPassword() {
  const g = useGrupo(); const e = useEnvio();
  const [actual, setActual] = useState(""); const [nueva, setNueva] = useState(""); const [ok, setOk] = useState(false);
  return (
    <Disclosure summary={<><KeyRound aria-hidden /> Cambiar mi contraseña</>}>
      <form className="grid gap-4" onSubmit={(ev) => { ev.preventDefault(); e.run(async () => { const r = await g.cambiarMiPassword(actual, nueva); setOk(r === null); if (r === null) { setActual(""); setNueva(""); } return r; }); }}>
        <FormGrid>
          <Field label="Contraseña actual" htmlFor="cp-act"><PasswordInput id="cp-act" autoComplete="current-password" required maxLength={200} value={actual} onChange={(ev) => setActual(ev.target.value)} /></Field>
          <Field label="Contraseña nueva (mín. 8)" htmlFor="cp-new"><PasswordInput id="cp-new" autoComplete="new-password" required minLength={8} maxLength={200} value={nueva} onChange={(ev) => setNueva(ev.target.value)} /></Field>
        </FormGrid>
        <Error_ texto={e.err} />
        {ok && !e.err && <Alert variant="info" role="status"><Info aria-hidden /><span>Contraseña cambiada.</span></Alert>}
        <Enviar busy={e.busy}>Cambiar la contraseña</Enviar>
      </form>
    </Disclosure>
  );
}

function FilaAdmin({ id, nombre, pw }: { id: string; nombre: string; pw: string }) {
  const g = useGrupo(); const e = useEnvio(); const [nueva, setNueva] = useState(""); const [ok, setOk] = useState(false);
  return (
    <li className="grid gap-2 border-t py-3">
      <b className="font-heading">{nombre}</b>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Contraseña nueva para esta persona" htmlFor={"ad-" + id}><PasswordInput id={"ad-" + id} autoComplete="new-password" minLength={8} maxLength={200} value={nueva} onChange={(ev) => setNueva(ev.target.value)} /></Field>
        <Button size="sm" variant="outline" disabled={e.busy || nueva.length < 8 || !pw}
          onClick={() => e.run(async () => { const r = await g.restablecerPassword(id, nueva, pw); setOk(r === null); if (r === null) setNueva(""); return r; })}>Restablecer</Button>
        <Button size="sm" variant="outline" disabled={e.busy || !pw} className="border-destructive text-destructive hover:bg-bad-soft hover:text-destructive"
          onClick={() => { if (window.confirm(`¿Quitar a ${nombre} del grupo? Se borran también sus favoritos.`)) e.run(() => g.quitarPersona(id, pw)); }}>Quitar del grupo</Button>
      </div>
      <Error_ texto={e.err} />
      {ok && !e.err && <p role="status" className="text-[13px] text-muted-foreground">Contraseña restablecida. Díselo a {nombre} por un canal seguro; podrá cambiarla desde «Cambiar mi contraseña».</p>}
    </li>
  );
}

function Administrar() {
  const g = useGrupo(); const e = useEnvio(); const [pw, setPw] = useState("");
  const otras = g.miembros.filter((m) => m.id !== g.miembro?.id);
  return (
    <Disclosure summary={<><ShieldCheck aria-hidden /> Administrar el grupo</>}>
      <div className="grid gap-4">
        <p className="max-w-[68ch] text-sm text-muted-foreground">Administras este grupo. Cada acción te pide tu contraseña personal para confirmar que eres tú.</p>
        <Field label="Tu contraseña personal" htmlFor="ad-pw"><PasswordInput id="ad-pw" autoComplete="current-password" maxLength={200} value={pw} onChange={(ev) => setPw(ev.target.value)} /></Field>
        {otras.length > 0
          ? <ul className="grid">{otras.map((m) => <FilaAdmin key={m.id} id={m.id} nombre={m.nombre} pw={pw} />)}</ul>
          : <p className="text-[13px] text-muted-foreground">Todavía no hay más personas en el grupo.</p>}
        <div className="grid gap-2 border-t pt-3">
          <p className="max-w-[68ch] text-sm text-muted-foreground">El código de recuperación sirve para cambiar contraseñas sin haber entrado. Generar uno nuevo anula el anterior.</p>
          <Error_ texto={e.err} />
          <div><Button size="sm" variant="outline" disabled={e.busy || !pw} onClick={() => e.run(() => g.nuevoCodigo(pw))}><KeyRound aria-hidden /> Generar un código de recuperación nuevo</Button></div>
        </div>
      </div>
    </Disclosure>
  );
}

function Favoritos() {
  const g = useGrupo(); const e = useEnvio();
  const [filtro, setFiltro] = useState<"todos" | "mios">("todos");
  const mios = g.favoritos.filter((f) => f.esMio);
  const lista = filtro === "mios" ? mios : g.favoritos;
  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <h3 className="font-heading text-lg font-bold">Grupo «{g.grupo?.nombre}»</h3>
            <p className="text-sm text-muted-foreground">Has entrado como <b className="text-foreground">{g.miembro?.nombre}</b>.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => g.cambiarPersona()}><ArrowLeftRight aria-hidden /> Cambiar de persona</Button>
            <Button variant="ghost" size="sm" onClick={() => g.salir()}><LogOut aria-hidden /> Salir del grupo</Button>
          </div>
        </div>
      </Card>
      <ResumenCooperativa variante="grupo" />
      <div className="grid gap-1.5">
        <h3 className="font-heading text-xl font-bold">Favoritos del grupo</h3>
        <p className="max-w-[68ch] text-sm text-muted-foreground">Las ofertas que ha marcado cada persona del grupo, con su nombre. Para añadir más, pulsa el corazón de un anuncio en <b>Oportunidades</b>.</p>
      </div>
      <ToggleChips label="Qué favoritos ver" value={filtro} options={[["todos", `Todos (${g.favoritos.length})`], ["mios", `Solo los míos (${mios.length})`]]} onChange={setFiltro} />
      {lista.length
        ? <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]">{lista.map((f) => <FavCard key={f.id} f={f} />)}</div>
        : <p className="text-[13px] text-muted-foreground">{filtro === "mios" ? "Todavía no has marcado ningún favorito." : "Todavía no hay favoritos en el grupo."}</p>}
      <CambiarPassword />
      {g.miembro?.esAdmin && <Administrar />}
      <Disclosure summary={<><Trash2 aria-hidden /> Borrar mi perfil</>}>
        <p className="max-w-[68ch] text-sm text-muted-foreground">Se borran tu nombre, tu contraseña y todos los favoritos que has marcado. Si eres la última persona del grupo, el grupo también desaparece. No se puede deshacer.</p>
        <Error_ texto={e.err} />
        <div><Button variant="outline" size="sm" disabled={e.busy} className="border-destructive text-destructive hover:bg-bad-soft hover:text-destructive"
          onClick={() => { if (window.confirm("¿Seguro que quieres borrar tu perfil y tus favoritos? No se puede deshacer.")) e.run(() => g.borrarMiPerfil()); }}>
          <Trash2 aria-hidden /> Borrar mi perfil y mis favoritos</Button></div>
      </Disclosure>
    </>
  );
}

export default function Grupo() {
  const g = useGrupo();
  return (
    <section className="grid gap-5">
      <div className="grid gap-1.5">
        <h2 className="font-heading text-2xl font-bold">Vuestro grupo</h2>
        <p className="max-w-[68ch] text-muted-foreground">Entra al grupo de tu cooperativa para compartir ofertas favoritas con el resto de personas. Funciona con contraseñas, sin correo ni cuentas externas.</p>
      </div>
      <CodigoRecuperacion />
      {g.estado === "cargando" && <p className="text-sm text-muted-foreground" role="status">Cargando…</p>}
      {g.estado !== "cargando" && !g.disponible && <Alert variant="warning"><Info aria-hidden /><span>Los grupos no están disponibles ahora mismo. El resto de la guía funciona con normalidad.</span></Alert>}
      {g.disponible && g.estado === "fuera" && <Acceso />}
      {g.disponible && g.estado === "grupo" && <ElegirMiembro />}
      {g.disponible && g.estado === "miembro" && <Favoritos />}
      <Privacidad />
    </section>
  );
}
