import { describe, it, expect } from "vitest";
import { markdownAHtml, enLinea } from "./markdown";

describe("markdown en línea", () => {
  it("negrita, cursiva y código", () => {
    expect(enLinea("**Quién:** el *grupo* y `M05`")).toBe("<strong>Quién:</strong> el <em>grupo</em> y <code>M05</code>");
  });
  it("no confunde los campos por rellenar con enlaces ni cursivas", () => {
    expect(enLinea("Nombre: [ ] · [Nombre y cargo] · 3 * 4")).toBe("Nombre: [ ] · [Nombre y cargo] · 3 * 4");
  });
  it("escapa el HTML", () => {
    expect(enLinea("<script>alert(1)</script> & \"x\"")).toBe("&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot;");
  });
  it("enlaces: https y a otro modelo; el resto se queda en texto", () => {
    expect(enLinea("[BOE](https://www.boe.es/x)")).toBe('<a href="https://www.boe.es/x" target="_blank" rel="noopener noreferrer">BOE</a>');
    expect(enLinea("[M05](M05-esquema-de-estatutos-cesion-de-uso.md)")).toBe('<a href="#modelo-M05" data-modelo="M05">M05</a>');
    expect(enLinea("[malo](javascript:x)")).toBe("malo");
    expect(enLinea("[http](http://inseguro.es)")).toBe("http");
    expect(enLinea("[carpeta](../otro.md)")).toBe("carpeta");
  });
  it("los asteriscos dentro de un código se respetan", () => expect(enLinea("`a*b*c`")).toBe("<code>a*b*c</code>"));
});

describe("markdown en bloques", () => {
  it("títulos, párrafos y línea horizontal", () => {
    expect(markdownAHtml("# Uno\n\nTexto\nsegunda línea\n\n---\n\n### Tres")).toBe("<h1>Uno</h1>\n<p>Texto<br>segunda línea</p>\n<hr>\n<h3>Tres</h3>");
  });
  it("listas con viñetas y numeradas", () => {
    expect(markdownAHtml("- a\n- b")).toBe("<ul><li>a</li><li>b</li></ul>");
    expect(markdownAHtml("1. uno\n2. dos")).toBe("<ol><li>uno</li><li>dos</li></ol>");
  });
  it("casillas", () => {
    expect(markdownAHtml("- [ ] pendiente\n- [x] hecho")).toBe('<ul><li><input type="checkbox" disabled> pendiente</li><li><input type="checkbox" disabled checked> hecho</li></ul>');
  });
  it("listas anidadas", () => {
    expect(markdownAHtml("- a\n  - a1\n  - a2\n- b")).toBe("<ul><li>a<ul><li>a1</li><li>a2</li></ul></li><li>b</li></ul>");
  });
  it("un elemento numerado con un párrafo sangrado después de una línea en blanco sigue siendo del elemento", () => {
    const h = markdownAHtml("1. Primero\n\n   «Texto literal»\n\n2. Segundo");
    expect(h).toContain("<ol>");
    expect(h.match(/<li>/g)).toHaveLength(2);
    expect(h).toContain("Texto literal");
  });
  it("tablas, con escape de las celdas y filas cortas", () => {
    const h = markdownAHtml("| A | B |\n| --- | --- |\n| 1 | <x> |\n| solo |");
    expect(h).toContain('<div class="md-tabla"><table>');
    expect(h).toContain("<th>A</th><th>B</th>");
    expect(h).toContain("<td>&lt;x&gt;</td>");
    expect(h).toContain("<td>solo</td><td></td>");
  });
  it("citas", () => expect(markdownAHtml("> **Aviso.** Texto")).toBe("<blockquote><p><strong>Aviso.</strong> Texto</p></blockquote>"));
  it("una lista interrumpe un párrafo", () => expect(markdownAHtml("Intro\n- a")).toBe("<p>Intro</p>\n<ul><li>a</li></ul>"));
});
