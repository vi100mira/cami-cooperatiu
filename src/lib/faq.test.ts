import { describe, it, expect } from "vitest";
import { FAQ } from "./faq";
import { TERMS } from "./content";
describe("FAQ", () => {
  it("tiene preguntas con respuesta y sin duplicados", () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(8);
    FAQ.forEach((f) => { expect(f.q.trim().length).toBeGreaterThan(10); expect(f.a.trim().length).toBeGreaterThan(80); });
    expect(new Set(FAQ.map((f) => f.q)).size).toBe(FAQ.length);
  });
  it("solo enlaza a términos del glosario que existen", () => {
    FAQ.forEach((f) => { for (const m of f.a.matchAll(/\{\{(\w+)\|[^}]+\}\}/g)) expect(TERMS[m[1]], m[1]).toBeDefined(); });
  });
});
