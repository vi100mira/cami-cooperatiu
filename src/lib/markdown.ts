/**
 * Conversor mínimo de markdown a HTML para los modelos de documentos (docs/modelos). Admite solo lo que esos textos usan:
 * títulos, párrafos, listas (con anidado y casillas), tablas, citas, línea horizontal, negrita, cursiva, código y enlaces.
 * Todo el texto se escapa; los enlaces solo pueden ser https o a otro modelo (M05-….md), y cualquier otro se queda en su texto.
 * El contenido es propio del repositorio, no de personas usuarias, pero el escapado se mantiene por seguridad.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function enlace(texto: string, destino: string): string {
  if (/^https:\/\//i.test(destino)) return `<a href="${destino}" target="_blank" rel="noopener noreferrer">${texto}</a>`;
  const m = /^(M\d{2})-[^/\s]*\.md$/.exec(destino);
  if (m) return `<a href="#modelo-${m[1]}" data-modelo="${m[1]}">${texto}</a>`;
  return texto;
}

/** Negrita, cursiva, código y enlaces dentro de una línea. */
export function enLinea(raw: string): string {
  const codigos: string[] = [];
  let t = esc(raw).replace(/`([^`]+)`/g, (_, c) => { codigos.push(`<code>${c}</code>`); return `\u0000${codigos.length - 1}\u0000`; });
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) => enlace(txt, url.replace(/&amp;/g, "&")));
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, "$1<em>$2</em>");
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => codigos[+i]);
}

const vacia = (l: string) => l.trim() === "";
const sangria = (l: string) => l.length - l.trimStart().length;
const MARCADOR = /^(\s*)([-*]|\d+\.)\s+(.*)$/;
const FILA_TABLA = /^\s*\|.*\|\s*$/;
const SEPARADOR_TABLA = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

const celdas = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function inicioDeBloque(l: string, siguiente?: string): boolean {
  return /^#{1,6}\s/.test(l) || /^-{3,}\s*$/.test(l) || l.startsWith(">") || MARCADOR.test(l) || (FILA_TABLA.test(l) && siguiente !== undefined && SEPARADOR_TABLA.test(siguiente));
}

function bloques(lineas: string[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < lineas.length) {
    const l = lineas[i];
    if (vacia(l)) { i++; continue; }

    const h = /^(#{1,6})\s+(.*)$/.exec(l);
    if (h) { out.push(`<h${h[1].length}>${enLinea(h[2].trim())}</h${h[1].length}>`); i++; continue; }

    if (/^-{3,}\s*$/.test(l)) { out.push("<hr>"); i++; continue; }

    if (l.startsWith(">")) {
      const cita: string[] = [];
      while (i < lineas.length && lineas[i].startsWith(">")) { cita.push(lineas[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote>${bloques(cita).join("")}</blockquote>`);
      continue;
    }

    if (FILA_TABLA.test(l) && i + 1 < lineas.length && SEPARADOR_TABLA.test(lineas[i + 1])) {
      const cabecera = celdas(l);
      i += 2;
      const filas: string[][] = [];
      while (i < lineas.length && FILA_TABLA.test(lineas[i])) { filas.push(celdas(lineas[i])); i++; }
      out.push(`<div class="md-tabla"><table><thead><tr>${cabecera.map((c) => `<th>${enLinea(c)}</th>`).join("")}</tr></thead><tbody>${filas.map((f) => `<tr>${cabecera.map((_, k) => `<td>${enLinea(f[k] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }

    const m = MARCADOR.exec(l);
    if (m) {
      const ordenada = /\d/.test(m[2]);
      const base = m[1].length;
      const items: string[] = [];
      while (i < lineas.length) {
        const mi = MARCADOR.exec(lineas[i]);
        if (!mi || mi[1].length !== base || /\d/.test(mi[2]) !== ordenada) break;
        const contenido = base + mi[2].length + 1;
        const cuerpo = [mi[3]];
        i++;
        while (i < lineas.length) {
          const x = lineas[i];
          if (vacia(x)) {
            let k = i + 1;
            while (k < lineas.length && vacia(lineas[k])) k++;
            if (k < lineas.length && sangria(lineas[k]) >= contenido) { cuerpo.push(""); i++; continue; }
            break;
          }
          if (sangria(x) >= contenido) { cuerpo.push(x.slice(contenido)); i++; continue; }
          break;
        }
        let casilla = "";
        const primera = /^\[( |x|X)\]\s+(.*)$/.exec(cuerpo[0]);
        if (primera) { casilla = `<input type="checkbox" disabled${primera[1] === " " ? "" : " checked"}> `; cuerpo[0] = primera[2]; }
        const partes = bloques(cuerpo);
        // Un elemento de una sola frase, o una frase seguida de sublistas, no necesita su propio párrafo.
        const solo = partes.length >= 1 && partes[0].startsWith("<p>") && partes.slice(1).every((x) => x.startsWith("<ul>") || x.startsWith("<ol>"));
        const html = solo ? partes[0].slice(3, -4) + partes.slice(1).join("") : partes.join("");
        items.push(`<li>${casilla}${html}</li>`);
        while (i < lineas.length && vacia(lineas[i]) && i + 1 < lineas.length && MARCADOR.test(lineas[i + 1]) && MARCADOR.exec(lineas[i + 1])![1].length === base) i++;
      }
      out.push(ordenada ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
      continue;
    }

    const parrafo: string[] = [];
    while (i < lineas.length && !vacia(lineas[i]) && (parrafo.length === 0 || !inicioDeBloque(lineas[i], lineas[i + 1]))) { parrafo.push(lineas[i].trim()); i++; }
    out.push(`<p>${parrafo.map(enLinea).join("<br>")}</p>`);
  }
  return out;
}

export function markdownAHtml(md: string): string {
  return bloques(md.replace(/\r\n/g, "\n").split("\n")).join("\n");
}
