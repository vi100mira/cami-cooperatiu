export const nf0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
export const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Math.round(n || 0));
export const fnum = (n: number, d = 1) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: d }).format(n);
export const kfmt = (v: number) => (v >= 1e6 ? fnum(v / 1e6, 2) + " M€" : v >= 1000 ? fnum(v / 1000, 0) + " k€" : fnum(v, 0) + " €");
export const plain = (s: string) => s.replace(/\{\{\w+\|([^}]+)\}\}/g, "$1");
export const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
