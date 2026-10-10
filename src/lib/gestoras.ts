/** Gestoras inmobiliarias de Sareb (según su web) y cómo se reconocen en los anuncios. */
const GESTORAS: { nombre: string; re: RegExp; yaencontreId?: string }[] = [
  { nombre: "Hipoges", re: /\bhipoges\b/i, yaencontreId: "21204" },
  { nombre: "Aliseda", re: /\baliseda\b|\banticipa\b/i, yaencontreId: "65243" },
  { nombre: "Servihabitat", re: /\bservihabitat\b|\bserviland\b/i },
  { nombre: "Aelca", re: /\baelca\b|\b[áa]rqura\b/i },
];

/** Devuelve la gestora de Sareb que publica el anuncio, si se reconoce por su nombre o por el id de agencia de yaencontre. */
export function detectGestora(url: string, ...textos: string[]): string | undefined {
  const idAg = url.match(/inmueble-(\d+)-\d+/)?.[1];
  const t = textos.join(" \n ");
  for (const g of GESTORAS) if ((g.yaencontreId && idAg === g.yaencontreId && /yaencontre\.com/.test(url)) || g.re.test(t)) return g.nombre;
  return undefined;
}
