import { describe, it, expect } from "vitest";
import { limpiarFamilia, claveFamilia, familiasDistintas, canonicaFamilia, agruparPorFamilia, mismaFamilia } from "./familias";

describe("familias", () => {
  it("limpia espacios, recorta y tolera valores raros", () => {
    expect(limpiarFamilia("  Mira   Ferrer ")).toBe("Mira Ferrer");
    expect(limpiarFamilia("x".repeat(100))).toHaveLength(60);
    expect(limpiarFamilia(undefined)).toBe("");
    expect(limpiarFamilia(42)).toBe("");
  });

  it("la clave ignora mayúsculas, tildes y espacios de más", () => {
    expect(claveFamilia("  GARCÍA  Pérez")).toBe(claveFamilia("garcia perez"));
    expect(claveFamilia("Garcia")).not.toBe(claveFamilia("Garcia Pérez"));
    expect(claveFamilia("")).toBe("");
  });

  it("cuenta familias distintas con la grafía de la primera", () => {
    const ps = [{ familia: "García" }, { familia: "garcia " }, { familia: "Mira" }, { familia: null }, {}, { familia: "  " }];
    expect(familiasDistintas(ps)).toEqual(["García", "Mira"]);
  });

  it("reutiliza la grafía de una familia que ya existe", () => {
    expect(canonicaFamilia("garcia", ["García", "Mira"])).toBe("García");
    expect(canonicaFamilia("  Soler ", ["García"])).toBe("Soler");
    expect(canonicaFamilia("   ", ["García"])).toBe("");
  });

  it("agrupa a las personas por familia, ordenadas, y deja al final a quien no la ha indicado", () => {
    const g = agruparPorFamilia([
      { nombre: "Zoe", familia: "mira" }, { nombre: "Ana", familia: "Soler" }, { nombre: "Vicent", familia: "Mira" },
      { nombre: "Luis", familia: null }, { nombre: "Berta" },
    ]);
    expect(g.map((x) => x.familia)).toEqual(["mira", "Soler", null]);
    expect(g[0].personas.map((p) => p.nombre)).toEqual(["Vicent", "Zoe"]);
    expect(g[2].personas.map((p) => p.nombre)).toEqual(["Berta", "Luis"]);
  });

  it("sin nadie sin familia no añade el grupo vacío", () => {
    expect(agruparPorFamilia([{ nombre: "Ana", familia: "Soler" }]).map((x) => x.familia)).toEqual(["Soler"]);
    expect(agruparPorFamilia([])).toEqual([]);
  });

  it("«misma familia» exige que haya familia", () => {
    expect(mismaFamilia("Mira", "mirá")).toBe(true);
    expect(mismaFamilia("", "")).toBe(false);
    expect(mismaFamilia(null, "Mira")).toBe(false);
  });
});
