// Genera src/lib/municipios-datos.ts: los 542 municipios de la Comunitat Valenciana con sus coordenadas.
//
// Fuente: Wikidata (datos abiertos, licencia CC0), municipios por código INE (provincias 03 Alicante, 12 Castellón y 46 València)
// con su propiedad de coordenadas y sus nombres en castellano y valenciano.
//
// Uso:  node scripts/generar-municipios.mjs
// Sirve para saber a qué distancia está cada anuncio del centro de acción de la cooperativa. Las coordenadas son las del
// municipio (no las del anuncio), así que la distancia es orientativa y en línea recta.
import { writeFileSync } from "node:fs";

const QUERY = `SELECT ?ine ?es ?ca ?coord WHERE {
  ?m wdt:P772 ?ine .
  FILTER(REGEX(?ine, "^(03|12|46)[0-9]{3}$"))
  ?m wdt:P625 ?coord .
  OPTIONAL { ?m rdfs:label ?es FILTER(lang(?es)="es") }
  OPTIONAL { ?m rdfs:label ?ca FILTER(lang(?ca)="ca") }
}`;

const r = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(QUERY), {
  headers: { Accept: "application/sparql-results+json", "User-Agent": "TechoComunDatos/1.0 (proyecto sin animo de lucro)" },
});
if (!r.ok) throw new Error("Wikidata respondió " + r.status);
const filas = (await r.json()).results.bindings;

const porIne = new Map();
for (const f of filas) {
  const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(f.coord.value);
  if (!m || porIne.has(f.ine.value)) continue;
  porIne.set(f.ine.value, [f.ine.value, f.es?.value ?? "", f.ca?.value ?? "", +(+m[2]).toFixed(4), +(+m[1]).toFixed(4)]);
}
// Elx no tiene nombre en castellano en Wikidata.
for (const t of porIne.values()) if (!t[1]) t[1] = t[2] === "Elx" ? "Elche" : t[2];

const lista = [...porIne.values()].sort((a, b) => a[0].localeCompare(b[0]));
if (lista.length !== 542) throw new Error(`Se esperaban 542 municipios y hay ${lista.length}`);

const cuerpo = lista.map((t) => `  ${JSON.stringify(t)},`).join("\n");
writeFileSync(new URL("../src/lib/municipios-datos.ts", import.meta.url), `// Generado por scripts/generar-municipios.mjs (Wikidata, CC0). No editar a mano.
// [código INE, nombre en castellano, nombre en valenciano, latitud, longitud]
export type MunicipioDato = [ine: string, es: string, ca: string, lat: number, lon: number];
export const MUNICIPIOS_DATOS: MunicipioDato[] = [
${cuerpo}
];
`);
console.log(`Escritos ${lista.length} municipios (${lista.filter((t) => t[0].startsWith("46")).length} de València).`);
