// Prueba de extremo a extremo de grupos y favoritos contra un servidor en marcha y su base de datos real.
//
// Uso:  npm run dev   (en otra terminal, con .env.local rellenado)
//       npm run test:e2e                    -> contra http://localhost:3000
//       node --env-file=.env.local scripts/e2e.mjs https://tu-dominio.vercel.app
//
// Crea dos grupos de prueba (identificadores `e2e-…`) y los borra al terminar con la propia función «Borrar mi perfil».
// Si SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY están en el entorno, comprueba además que se anota la actividad del grupo.
// Cuidado con los límites de intentos: cada ejecución usa 4 altas, y el límite es de 10 cada 15 minutos por IP.
import { randomBytes } from "node:crypto";

const BASE = (process.argv[2] ?? process.env.E2E_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const rnd = randomBytes(4).toString("hex");
const slugA = `e2e-a-${rnd}`, slugB = `e2e-b-${rnd}`;
const pwG = `Grupo-${rnd}-1`, pwAna = `Ana-${rnd}-1`, pwBeto = `Beto-${rnd}-1`;

class Sesion {
  jar = new Map();
  async call(method, path, body) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (this.jar.size) headers.cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
    const r = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, redirect: "manual" });
    for (const c of r.headers.getSetCookie?.() ?? []) {
      const [par, ...atributos] = c.split(";");
      const i = par.indexOf("=");
      const nombre = par.slice(0, i).trim(), valor = par.slice(i + 1).trim();
      const borrada = !valor || atributos.some((a) => /^\s*max-age=0/i.test(a)) || atributos.some((a) => /^\s*expires=.*1970/i.test(a));
      if (borrada) this.jar.delete(nombre); else this.jar.set(nombre, valor);
    }
    let j = null;
    try { j = await r.json(); } catch { /* sin cuerpo JSON */ }
    return { s: r.status, j };
  }
}

const filas = [];
const check = (nombre, cond, detalle = "") => filas.push({ prueba: nombre, resultado: cond ? "OK" : "FALLO", detalle });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const conBase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
async function actividad(slug) {
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/grupos_cooperativos?slug=eq.${slug}&select=ultima_actividad`, {
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const j = await r.json();
  return Array.isArray(j) && j[0] ? new Date(j[0].ultima_actividad).getTime() : null;
}

const sA = new Sesion(), sB = new Sesion(), sG2 = new Sesion();
let anaBorrada = false;
try {
  // Altas
  let r = await sA.call("POST", "/api/grupos", { nombre: "Prueba E2E A", slug: slugA, password: pwG, miembro: "Ana", miembroPassword: pwAna });
  check("Alta de grupo A", r.s === 200, `HTTP ${r.s}`);
  const codigoInicial = r.j?.codigo;
  check("El alta devuelve un código de recuperación", /^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$/.test(codigoInicial ?? ""));
  check("Cookie de sesión creada", sA.jar.has("tc_sesion"));
  r = await new Sesion().call("POST", "/api/grupos", { nombre: "Otro", slug: slugA, password: pwG, miembro: "X", miembroPassword: pwAna });
  check("Identificador duplicado rechazado", r.s === 409, `HTTP ${r.s}`);
  r = await new Sesion().call("POST", "/api/grupos", { nombre: "Corta", slug: `e2e-c-${rnd}`, password: "corta", miembro: "X", miembroPassword: pwAna });
  check("Contraseña corta rechazada", r.s === 400, `HTTP ${r.s}`);

  // Sin sesión y cookie falsificada
  check("Miembros sin sesión => 401", (await new Sesion().call("GET", "/api/miembros")).s === 401);
  check("Favoritos sin sesión => 401", (await new Sesion().call("GET", "/api/favoritos")).s === 401);
  const falsa = new Sesion(); falsa.jar.set("tc_sesion", "eyJnIjoiX3giLCJtIjoieCIsImV4cCI6OTk5OTk5OTk5OTk5OX0.firmafalsa");
  check("Cookie falsificada => 401", (await falsa.call("GET", "/api/favoritos")).s === 401);

  // Entrar al grupo y añadir miembro
  check("Contraseña de grupo mala => 401", (await new Sesion().call("POST", "/api/grupos/entrar", { slug: slugA, password: "mala-mala-1" })).s === 401);
  check("Grupo inexistente => 401 (mismo error)", (await new Sesion().call("POST", "/api/grupos/entrar", { slug: `no-existe-${rnd}`, password: "mala-mala-1" })).s === 401);
  r = await sB.call("POST", "/api/grupos/entrar", { slug: slugA, password: pwG });
  check("Entrar al grupo A", r.s === 200, `HTTP ${r.s}`);
  check("Añadir miembro Beto", (await sB.call("POST", "/api/miembros", { nombre: "Beto", password: pwBeto })).s === 200);
  check("Miembro duplicado => 409", (await sB.call("POST", "/api/miembros", { nombre: "Beto", password: pwBeto })).s === 409);
  r = await sB.call("GET", "/api/miembros");
  const miembros = r.j?.miembros ?? [];
  check("Lista de miembros (2)", r.s === 200 && miembros.length === 2, `n=${miembros.length}`);
  const beto = miembros.find((m) => m.nombre === "Beto"), ana = miembros.find((m) => m.nombre === "Ana");
  check("Favoritos antes de identificarse => 401", (await sB.call("GET", "/api/favoritos")).s === 401);
  check("Persona con contraseña mala => 401", (await sB.call("POST", "/api/miembros/entrar", { miembroId: beto?.id, password: "mala-mala-1" })).s === 401);
  check("Beto confirma identidad", (await sB.call("POST", "/api/miembros/entrar", { miembroId: beto?.id, password: pwBeto })).s === 200);

  // Roles y administración
  check("Ana (creó el grupo) administra", (await sA.call("GET", "/api/sesion")).j?.miembro?.esAdmin === true);
  check("Beto no administra", (await sB.call("GET", "/api/sesion")).j?.miembro?.esAdmin === false);
  const pwBeto2 = `Beto2-${rnd}-1`, pwBeto3 = `Beto3-${rnd}-1`, pwAna2 = `Ana2-${rnd}-1`, pwG2 = `Grupo2-${rnd}-1`;
  check("Quien no administra no puede restablecer contraseñas => 403", (await sB.call("POST", "/api/grupos/admin", { accion: "restablecer", miembroId: ana?.id, nuevaPassword: "hack-hack-12", password: pwBeto })).s === 403);
  check("Administración sin sesión => 401", (await new Sesion().call("POST", "/api/grupos/admin", { accion: "codigo", password: pwAna })).s === 401);
  check("Administración con la contraseña mala => 401", (await sA.call("POST", "/api/grupos/admin", { accion: "codigo", password: "mala-mala-1" })).s === 401);
  check("Ana restablece la contraseña de Beto", (await sA.call("POST", "/api/grupos/admin", { accion: "restablecer", miembroId: beto?.id, nuevaPassword: pwBeto2, password: pwAna })).s === 200);
  const s3 = new Sesion(); await s3.call("POST", "/api/grupos/entrar", { slug: slugA, password: pwG });
  check("La contraseña antigua de Beto ya no sirve", (await s3.call("POST", "/api/miembros/entrar", { miembroId: beto?.id, password: pwBeto })).s === 401);
  check("La nueva sí", (await s3.call("POST", "/api/miembros/entrar", { miembroId: beto?.id, password: pwBeto2 })).s === 200);
  check("Beto cambia su contraseña con la actual mala => 401", (await sB.call("PATCH", "/api/miembros/yo", { actual: "mala-mala-1", nueva: pwBeto3 })).s === 401);
  check("Beto cambia su contraseña", (await sB.call("PATCH", "/api/miembros/yo", { actual: pwBeto2, nueva: pwBeto3 })).s === 200);
  check("Contraseña nueva demasiado corta => 400", (await sB.call("PATCH", "/api/miembros/yo", { actual: pwBeto3, nueva: "corta" })).s === 400);

  // Datos de la cooperativa compartidos
  const coop = { region: "cv", ciudad: "València", familias: 12, barrio: "Russafa" };
  check("Datos del grupo sin identificarse => 401", (await new Sesion().call("GET", "/api/grupos/datos")).s === 401);
  check("Datos vacíos al principio", (await sA.call("GET", "/api/grupos/datos")).j?.datos === null);
  check("Beto guarda los datos de la cooperativa", (await sB.call("PUT", "/api/grupos/datos", { ...coop, ingresos: 99999 })).s === 200);
  r = await sA.call("GET", "/api/grupos/datos");
  check("Ana ve los datos de Beto, sin campos de más", JSON.stringify(r.j?.datos) === JSON.stringify(coop), JSON.stringify(r.j?.datos));
  check("Familias fuera de rango => 400", (await sB.call("PUT", "/api/grupos/datos", { ...coop, familias: 0 })).s === 400);
  check("Comunidad inventada => 400", (await sB.call("PUT", "/api/grupos/datos", { ...coop, region: "zz" })).s === 400);

  // Favoritos
  const of1 = { ofertaId: "Fotocasa:e2e-1", datos: { titulo: "Edificio de prueba", url: "https://www.fotocasa.es/es/x/1/d", tipo: "edificios", precio: 900000, m2: 700, zona: "Russafa", fuente: "Fotocasa", telefono: "600000000", iban: "ES0000" } };
  const of2 = { ofertaId: "Pisos:e2e-2", datos: { titulo: "Terreno de prueba", url: "https://www.pisos.com/x/2", tipo: "terrenos", precio: 300000 } };
  const antes = conBase ? await actividad(slugA) : null;
  await esperar(1100);
  check("Beto marca un favorito", (await sB.call("POST", "/api/favoritos", of1)).s === 200);
  check("Repetir el favorito no duplica", (await sB.call("POST", "/api/favoritos", of1)).s === 200);
  check("Ana marca otro favorito", (await sA.call("POST", "/api/favoritos", of2)).s === 200);
  check("Enlace http rechazado", (await sB.call("POST", "/api/favoritos", { ofertaId: "x", datos: { titulo: "t", url: "http://x.es", tipo: "terrenos" } })).s === 400);
  r = await sB.call("GET", "/api/favoritos?filtro=todos");
  check("Todos: 2 favoritos", r.s === 200 && r.j?.favoritos?.length === 2, `n=${r.j?.favoritos?.length}`);
  check("Cada favorito lleva el nombre de quien lo marcó", (r.j?.favoritos ?? []).map((f) => f.marcadoPor).sort().join(",") === "Ana,Beto");
  r = await sB.call("GET", "/api/favoritos?filtro=mios");
  check("Solo los míos: 1", r.j?.favoritos?.length === 1 && r.j.favoritos[0].esMio === true);
  await sB.call("DELETE", `/api/favoritos?ofertaId=${encodeURIComponent(of2.ofertaId)}`);
  check("Beto no puede borrar el favorito de Ana", (await sB.call("GET", "/api/favoritos?filtro=todos")).j?.favoritos?.length === 2);
  await sB.call("DELETE", `/api/favoritos?ofertaId=${encodeURIComponent(of1.ofertaId)}`);
  check("Beto quita su propio favorito", (await sB.call("GET", "/api/favoritos?filtro=todos")).j?.favoritos?.length === 1);

  if (conBase) {
    const despues = await actividad(slugA);
    check("La actividad del grupo se anota", antes != null && despues != null && despues > antes, `${antes} -> ${despues}`);
  } else {
    filas.push({ prueba: "La actividad del grupo se anota", resultado: "OMITIDA", detalle: "faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY" });
  }

  // Aislamiento entre grupos
  r = await sG2.call("POST", "/api/grupos", { nombre: "Prueba E2E B", slug: slugB, password: pwG, miembro: "Carla", miembroPassword: pwAna });
  check("Alta de grupo B", r.s === 200, `HTTP ${r.s}`);
  check("Grupo B no ve favoritos de A", (await sG2.call("GET", "/api/favoritos?filtro=todos")).j?.favoritos?.length === 0);
  r = await sG2.call("GET", "/api/miembros");
  check("Grupo B no ve miembros de A", r.j?.miembros?.length === 1 && r.j.miembros[0].nombre === "Carla");
  check("Un miembro de A no entra desde la sesión de B", (await sG2.call("POST", "/api/miembros/entrar", { miembroId: ana?.id, password: pwAna })).s === 401);
  check("Grupo B no ve los datos de A", (await sG2.call("GET", "/api/grupos/datos")).j?.datos === null);
  check("La administración de B no alcanza a miembros de A", (await sG2.call("POST", "/api/grupos/admin", { accion: "quitar", miembroId: ana?.id, password: pwAna })).s === 404);

  // Recuperación con el código del grupo (4 de los 5 intentos que permite el límite)
  const rec = new Sesion();
  const base = { slug: slugA, que: "miembro", nombre: "Ana", nuevaPassword: pwAna2 };
  check("Código de recuperación malo => 401", (await rec.call("POST", "/api/grupos/recuperar", { ...base, codigo: "AAAAA-BBBBB-CCCCC-DDDDD" })).s === 401);
  r = await rec.call("POST", "/api/grupos/recuperar", { ...base, codigo: codigoInicial });
  const codigo2 = r.j?.codigo;
  check("Recuperar la contraseña de Ana con el código", r.s === 200 && /^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$/.test(codigo2 ?? "") && codigo2 !== codigoInicial, `HTTP ${r.s}`);
  check("El código es de un solo uso", (await rec.call("POST", "/api/grupos/recuperar", { ...base, codigo: codigoInicial })).s === 401);
  const sA2 = new Sesion(); await sA2.call("POST", "/api/grupos/entrar", { slug: slugA, password: pwG });
  check("Ana entra con la contraseña recuperada", (await sA2.call("POST", "/api/miembros/entrar", { miembroId: ana?.id, password: pwAna2 })).s === 200);
  check("Recuperar la contraseña del grupo con el código nuevo", (await rec.call("POST", "/api/grupos/recuperar", { slug: slugA, que: "grupo", nuevaPassword: pwG2, codigo: codigo2?.toLowerCase().replaceAll("-", " ") })).s === 200);
  check("La contraseña antigua del grupo ya no sirve", (await new Sesion().call("POST", "/api/grupos/entrar", { slug: slugA, password: pwG })).s === 401);
  check("La nueva sí", (await new Sesion().call("POST", "/api/grupos/entrar", { slug: slugA, password: pwG2 })).s === 200);

  // Administración: nuevo código, quitar a alguien y traspaso al irse quien administra
  r = await sA.call("POST", "/api/grupos/admin", { accion: "codigo", password: pwAna2 });
  check("Ana genera un código nuevo", r.s === 200 && /^[A-Z2-9]{5}(-[A-Z2-9]{5}){3}$/.test(r.j?.codigo ?? ""), `HTTP ${r.s}`);
  check("Dani se añade al grupo", (await sA.call("POST", "/api/miembros", { nombre: "Dani", password: pwBeto })).s === 200);
  const dani = ((await sA.call("GET", "/api/miembros")).j?.miembros ?? []).find((m) => m.nombre === "Dani");
  check("Ana no se puede quitar a sí misma", (await sA.call("POST", "/api/grupos/admin", { accion: "quitar", miembroId: ana?.id, password: pwAna2 })).s === 400);
  check("Ana quita a Dani", (await sA.call("POST", "/api/grupos/admin", { accion: "quitar", miembroId: dani?.id, password: pwAna2 })).s === 200);
  check("Quedan Ana y Beto", ((await sA.call("GET", "/api/miembros")).j?.miembros ?? []).length === 2);
  r = await sA.call("DELETE", "/api/miembros/yo"); anaBorrada = true;
  check("Ana se va y el grupo sigue", r.s === 200 && r.j?.grupoBorrado === false);
  check("Beto pasa a administrar el grupo", (await sB.call("GET", "/api/sesion")).j?.miembro?.esAdmin === true);
} catch (e) {
  check("La prueba terminó sin excepciones", false, String(e?.message ?? e));
} finally {
  // Limpieza: cada persona borra su perfil; al irse la última, el grupo se borra con ella.
  const borrados = [];
  for (const [nombre, s] of [["Beto", sB], ["Ana", sA], ["Carla", sG2]]) {
    if (nombre === "Ana" && anaBorrada) continue;
    try { const r = await s.call("DELETE", "/api/miembros/yo"); borrados.push(`${nombre}:${r.s}`); } catch { borrados.push(`${nombre}:error`); }
  }
  filas.push({ prueba: "Limpieza", resultado: "—", detalle: borrados.join(" ") });
  if (conBase) {
    const quedan = [await actividad(slugA), await actividad(slugB)].filter((x) => x != null).length;
    check("No quedan grupos de prueba", quedan === 0, `quedan ${quedan}`);
  }
}

console.table(filas);
const fallos = filas.filter((f) => f.resultado === "FALLO").length;
console.log(fallos ? `\n${fallos} comprobación(es) fallida(s)` : "\nTodo correcto");
process.exit(fallos ? 1 : 0);
