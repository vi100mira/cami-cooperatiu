import { describe, it, expect } from "vitest";
import { normativaPara, REGISTRO, PARAM_KEYS, EDITABLES, comunidadCargada } from "./normativa";

describe("normativaPara", () => {
  it("la Comunitat Valenciana usa su propia norma y la marca como cargada", () => {
    const n = normativaPara("cv");
    expect(n.cargada).toBe(true);
    expect(n.params.dotPublica).toMatchObject({ valor: 35, origen: "comunidad", verif: "verificada" });
    expect(n.params.cesionUrbanizable.valor).toBe(10);
  });

  it("la reserva de vivienda protegida valenciana se marca para comprobar, porque el Estado fija otra cifra", () => {
    const r = normativaPara("cv").params.reservaVPP;
    expect(r.valor).toBe(30);
    expect(r.verif).toBe("comprobar");
    expect(r.nota).toMatch(/40 %/);
  });

  it("una comunidad sin cargar cae al marco estatal donde existe", () => {
    const n = normativaPara("an");
    expect(n.cargada).toBe(false);
    expect(n.params.reservaVPP).toMatchObject({ valor: 40, origen: "estado", verif: "verificada" });
    expect(n.params.cesionUrbanizable).toMatchObject({ origen: "estado", rango: [5, 15] });
  });

  it("una comunidad sin cargar nunca recibe como verificada una cifra valenciana", () => {
    const n = normativaPara("an");
    for (const k of ["dotPublica", "dotVerde", "edifMax", "densMax"] as const) {
      expect(n.params[k].origen).toBe("referencia-cv");
      expect(n.params[k].verif).toBe("estimacion");
      expect(n.params[k].nota).toMatch(/no es la norma de tu comunidad/);
    }
  });

  it("sin comunidad elegida se comporta igual y no revienta", () => {
    const n = normativaPara("");
    expect(n.cargada).toBe(false);
    expect(n.nombre).toBe("tu comunidad");
    expect(PARAM_KEYS.every((k) => typeof n.params[k].valor === "number")).toBe(true);
  });

  it("el suelo urbano por urbanizar hereda la cesión estatal por alias", () => {
    expect(normativaPara("an").params.cesionUrbanoUE.valor).toBe(normativaPara("an").params.cesionUrbanizable.valor);
  });

  it("las referencias de coste son estimaciones editables", () => {
    for (const k of EDITABLES) expect(normativaPara("cv").params[k].verif).toBe("estimacion");
  });
});

describe("calidad de las fuentes", () => {
  const todas = [...Object.values(REGISTRO).flatMap((c) => Object.values(c.params)), ...PARAM_KEYS.map((k) => normativaPara("an").params[k])];
  it("todo parámetro tiene artículo, enlace https y fecha de consulta", () => {
    for (const p of todas) {
      expect(p.fuente.articulo.length).toBeGreaterThan(0);
      expect(p.fuente.url).toMatch(/^https:\/\//);
      expect(p.fuente.consultada).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("lo marcado como verificada en fuente secundaria lo declara", () => {
    const cv = normativaPara("cv").params;
    expect(cv.dotPublica.fuente.secundaria).toBe(true);
  });
  it("solo la Comunitat Valenciana está cargada por ahora", () => {
    expect(comunidadCargada("cv")).toBe(true);
    expect(comunidadCargada("md")).toBe(false);
  });
});
