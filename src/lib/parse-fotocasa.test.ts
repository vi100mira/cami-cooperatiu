import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { parseFotocasa } from "./parse-fotocasa";
describe("parseFotocasa", () => {
  const md = readFileSync(__dirname + "/__fixtures__/fotocasa-edificios.md", "utf8");
  const r = parseFotocasa(md);
  it("extrae anuncios con precio y url", () => {
    expect(r.length).toBeGreaterThan(2);
    expect(r[0].precio).toBe(710000);
    expect(r[0].url).toMatch(/^https:\/\/www\.fotocasa\.es\//);
    expect(r[0].m2).toBe(338);
  });
  it("no duplica ids y respeta el máximo", () => {
    expect(new Set(r.map((x) => x.id)).size).toBe(r.length);
    expect(parseFotocasa(md, 2).length).toBe(2);
  });
});
