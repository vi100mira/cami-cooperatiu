import { describe, it, expect } from "vitest";
import { entitiesFor, tplText, PH } from "./content";
const g = (o = {}) => ({ name: "Llar", fam: 12, barrio: "", ciudad: "", region: "", ...o });
describe("ubicación", () => {
  it("València/CV usa Fecovi, EVha y portales directos", () => {
    const e = entitiesFor(g({ region: "cv", ciudad: "València" }));
    expect(e.find((x) => x.id === "fed")!.name).toBe("Fecovi");
    expect(e.find((x) => x.id === "reg")!.name).toMatch(/EVha/);
    expect(e.find((x) => x.id === "portal_ed")!.url).toMatch(/fotocasa/);
  });
  it("otra comunidad: sin referencias fijas a València y con recursos estatales", () => {
    const e = entitiesFor(g({ region: "pv", ciudad: "Bilbao" }));
    expect(e.find((x) => x.id === "fed")!.name).toMatch(/País Vasco/);
    expect(e.find((x) => x.id === "ayto")!.name).toMatch(/Bilbao/);
    expect(e.some((x) => x.id === "fiare")).toBe(true);
    expect(JSON.stringify(e.map((x) => x.name + x.url))).not.toMatch(/València|Fecovi|EVha/);
    expect(tplText("reg", g({ region: "pv", ciudad: "Bilbao" }))).not.toMatch(/EVha|València/);
  });
  it("sin ubicación no rompe", () => {
    expect(entitiesFor(g()).length).toBeGreaterThan(5);
    expect(tplText("fed", g())).toMatch(/\[ciudad\]/);
  });
  it("todas las entidades de las fases existen", () => {
    for (const r of ["", "cv", "pv"]) { const ids = entitiesFor(g({ region: r, ciudad: "x" })).map((x) => x.id); PH.forEach((p) => p.ents.forEach((id) => expect(ids).toContain(id))); }
  });
});
