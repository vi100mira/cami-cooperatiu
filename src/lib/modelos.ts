import { PH } from "./content";

/** Nombres cortos de las estaciones de la Ruta que usan un modelo (para decir «lo usas en Estatutos y Dinero»). */
export function estacionesDe(codigo: string): string[] {
  return PH.filter((p) => (p.docs ?? []).includes(codigo)).map((p) => p.short);
}

const ESTILO = `body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.45;color:#111;margin:2cm}
h1{font-size:18pt;margin:0 0 .5em}h2{font-size:14pt;margin:1.4em 0 .4em}h3{font-size:12pt;margin:1.2em 0 .3em}
p{margin:.5em 0}ul,ol{margin:.5em 0;padding-left:1.4em}li{margin:.2em 0}
table{border-collapse:collapse;width:100%;font-size:10pt}th,td{border:1px solid #888;padding:4px 6px;text-align:left;vertical-align:top}th{background:#eee}
blockquote{border-left:3px solid #888;background:#f4f4f4;margin:1em 0;padding:.4em .8em}
hr{border:0;border-top:1px solid #999;margin:1.4em 0}code{font-family:Consolas,monospace}a{color:#111}`;

/** Página HTML completa de un modelo, para abrirla en Word o imprimirla. Sin menús ni colores de la app. */
export function paginaHtml(titulo: string, cuerpo: string): string {
  const t = titulo.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${t}</title><style>${ESTILO}</style></head><body>${cuerpo}</body></html>`;
}
