/** iPhone y iPad no ofrecen botón de instalar: hay que explicar el camino manual desde Safari. El iPad reciente se presenta como un Mac con pantalla táctil. */
export function esIOS(userAgent: string, puntosTactiles = 0): boolean {
  return /iphone|ipad|ipod/i.test(userAgent) || (puntosTactiles > 1 && /Macintosh/.test(userAgent));
}
