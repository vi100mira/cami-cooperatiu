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
try {
  // Altas
  let r = await sA.call("POST", "/api/grupos", { nombre: "Prueba E2E A", slug: slugA, password: pwG, miembro: "Ana", miembroPassword: pwAna });
  check("Alta de grupo A", r.s === 200, `HTTP ${r.s}`);
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
} catch (e) {
  check("La prueba terminó sin excepciones", false, String(e?.message ?? e));
} finally {
  // Limpieza: cada persona borra su perfil; al irse la última, el grupo se borra con ella.
  const borrados = [];
  for (const [nombre, s] of [["Beto", sB], ["Ana", sA], ["Carla", sG2]]) {
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
