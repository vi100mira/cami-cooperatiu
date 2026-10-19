import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { MODELOS_INDICE } from "./modelos-indice";
import { CATALOGO_MD, MODELOS_MD } from "./modelos-datos";
import { markdownAHtml } from "./markdown";
import { PH } from "./content";

const DIR = join(__dirname, "../../docs/modelos");
const sinMetadatos = (t: string) => t.replace(/\r\n/g, "\n").replace(/^---\n[\s\S]*?\n---\n/, "").replace(/^\n+/, "");

describe("documentos y modelos dentro de la app", () => {
  it("los datos generados coinciden con los ficheros de docs/modelos (si falla: npm run modelos)", () => {
    const archivos = readdirSync(DIR).filter((f) => f.endsWith(".md"));
    expect(CATALOGO_MD).toBe(sinMetadatos(readFileSync(join(DIR, archivos.find((f) => f.startsWith("00-"))!), "utf8")));
    for (const m of MODELOS_INDICE) {
      expect(archivos, m.archivo).toContain(m.archivo);
      expect(MODELOS_MD[m.codigo], m.codigo).toBe(sinMetadatos(readFileSync(join(DIR, m.archivo), "utf8")));
    }
    expect(MODELOS_INDICE.map((m) => m.codigo)).toEqual(Array.from({ length: 12 }, (_, i) => "M" + String(i + 1).padStart(2, "0")));
    expect(archivos.filter((f) => /^M\d{2}-/.test(f))).toHaveLength(MODELOS_INDICE.length);
  });

  it("cada enlace a un modelo del catálogo y de los modelos apunta a uno que existe", () => {
    const existen = new Set(MODELOS_INDICE.map((m) => m.archivo));
    for (const [nombre, md] of [["catálogo", CATALOGO_MD], ...Object.entries(MODELOS_MD)] as [string, string][]) {
      for (const m of md.matchAll(/\]\((M\d{2}-[^)\s]*\.md)\)/g)) expect(existen.has(m[1]), `${nombre}: ${m[1]}`).toBe(true);
    }
  });

  it("todos los textos se convierten sin dejar marcas sueltas de markdown", () => {
    for (const [nombre, md] of [["catálogo", CATALOGO_MD], ...Object.entries(MODELOS_MD)] as [string, string][]) {
      const html = markdownAHtml(md);
      expect(html, nombre).toContain("<h1>");
      expect(html, nombre).not.toMatch(/<script/i);
      expect(html, nombre).not.toContain("](");          // enlace sin convertir
      expect(html, nombre).not.toContain("**");          // negrita sin convertir
      expect(html.split("\n").some((l) => l.startsWith("<p>|")), nombre).toBe(false); // tabla sin convertir
    }
  });

  it("el catálogo se convierte con sus tablas y con enlaces internos a los 12 modelos", () => {
    const html = markdownAHtml(CATALOGO_MD);
    expect((html.match(/<table>/g) ?? []).length).toBeGreaterThanOrEqual(7);
    for (const m of MODELOS_INDICE) expect(html, m.codigo).toContain(`data-modelo="${m.codigo}"`);
  });

  it("cada estación de la Ruta enlaza solo a modelos que existen y la mayoría tiene alguno", () => {
    const codigos = new Set(MODELOS_INDICE.map((m) => m.codigo));
    for (const p of PH) for (const c of p.docs ?? []) expect(codigos.has(c), `${p.id}: ${c}`).toBe(true);
    expect(PH.filter((p) => (p.docs ?? []).length > 0).length).toBeGreaterThanOrEqual(5);
  });

  it("todos los modelos tienen el aviso de que son orientativos o remiten a la asesoría", () => {
    for (const m of MODELOS_INDICE) expect(MODELOS_MD[m.codigo], m.codigo).toMatch(/asesor|abogad|orientativ|profesional/i);
  });
});
