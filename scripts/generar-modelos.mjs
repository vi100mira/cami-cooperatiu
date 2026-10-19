// Genera los datos de los documentos y modelos que muestra la app a partir de docs/modelos/*.md:
//   src/lib/modelos-indice.ts  (código, título y nombre corto: lo usa la Ruta, pesa poco)
//   src/lib/modelos-datos.ts   (el texto completo en markdown: solo lo carga la pestaña Documentos)
//
// Los ficheros de docs/modelos son la única fuente: se editan allí y se vuelve a ejecutar
//   npm run modelos
// Una prueba (modelos.test.ts) falla si los datos generados no coinciden con los ficheros.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const DIR = new URL("../docs/modelos/", import.meta.url);
const CORTO = {
  M01: "Declaración de intenciones", M02: "Convocatoria de asamblea", M03: "Acta de asamblea", M04: "Solicitud de ingreso",
  M05: "Esquema de estatutos", M06: "Reglamento interno", M07: "Memoria del proyecto", M08: "Plan económico",
  M09: "Información urbanística", M10: "Contrato de cesión de uso", M11: "Compromiso de aportación", M12: "Certificación de acuerdos",
};

// Quita el bloque inicial entre «---» (metadatos del repositorio) y las líneas en blanco del principio.
const sinMetadatos = (t) => t.replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n/, "").replace(/^\n+/, "");

const archivos = readdirSync(DIR).filter((f) => f.endsWith(".md")).sort();
const catalogo = archivos.find((f) => f.startsWith("00-"));
if (!catalogo) throw new Error("Falta el catálogo 00-documentos-del-proceso.md");
const modelos = archivos.filter((f) => /^M\d{2}-/.test(f)).map((archivo) => {
  const md = sinMetadatos(readFileSync(new URL(archivo, DIR), "utf8"));
  const codigo = archivo.slice(0, 3);
  const titulo = /^#\s+(.+)$/m.exec(md)?.[1].replace(/^M\d{2}\s*·\s*/, "").trim();
  if (!titulo) throw new Error(`${archivo} no tiene título (# ...)`);
  if (!CORTO[codigo]) throw new Error(`Falta el nombre corto de ${codigo} en scripts/generar-modelos.mjs`);
  return { codigo, archivo, titulo, corto: CORTO[codigo], md };
});
if (modelos.length !== 12) throw new Error(`Se esperaban 12 modelos y hay ${modelos.length}`);

const cabecera = "// Generado por scripts/generar-modelos.mjs a partir de docs/modelos/*.md. No editar a mano: `npm run modelos`.\n";
writeFileSync(new URL("../src/lib/modelos-indice.ts", import.meta.url), `${cabecera}export interface ModeloIndice { codigo: string; archivo: string; titulo: string; corto: string }
export const MODELOS_INDICE: ModeloIndice[] = ${JSON.stringify(modelos.map(({ codigo, archivo, titulo, corto }) => ({ codigo, archivo, titulo, corto })), null, 2)};
`);
writeFileSync(new URL("../src/lib/modelos-datos.ts", import.meta.url), `${cabecera}export const CATALOGO_MD: string = ${JSON.stringify(sinMetadatos(readFileSync(new URL(catalogo, DIR), "utf8")))};
export const MODELOS_MD: Record<string, string> = ${JSON.stringify(Object.fromEntries(modelos.map((m) => [m.codigo, m.md])), null, 2)};
`);
console.log(`Generados ${modelos.length} modelos y el catálogo.`);
