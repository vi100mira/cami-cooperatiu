/**
 * Memoria de un estado que debe sobrevivir a que su componente se desmonte (por ejemplo, al cambiar de pestaña y volver)
 * y, si se puede, a recargar la página dentro de la misma visita (sessionStorage). Quien se suscribe recibe cada cambio,
 * incluso los que llegan cuando el componente original ya no estaba (una consulta que termina mientras estás en otra pestaña).
 */
export interface Memoria<T> {
  leer: () => T;
  escribir: (v: T) => void;
  suscribir: (f: (v: T) => void) => () => void;
}

export function crearMemoria<T>(clave: string, porDefecto: T, normalizar: (guardado: unknown) => T | null, paraGuardar: (v: T) => T = (v) => v): Memoria<T> {
  let actual: T | null = null;
  const oyentes = new Set<(v: T) => void>();
  const leer = (): T => {
    if (actual) return actual;
    try {
      const j = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(clave) : null;
      const v = j ? normalizar(JSON.parse(j)) : null;
      if (v) return (actual = v);
    } catch { /* sin almacenamiento o datos rotos: se parte de cero */ }
    return porDefecto;
  };
  const escribir = (v: T) => {
    actual = v;
    oyentes.forEach((f) => f(v));
    try { sessionStorage.setItem(clave, JSON.stringify(paraGuardar(v))); } catch { /* lleno o bloqueado: vale solo en memoria */ }
  };
  const suscribir = (f: (v: T) => void) => { oyentes.add(f); return () => { oyentes.delete(f); }; };
  return { leer, escribir, suscribir };
}
