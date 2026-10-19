import { describe, it, expect } from "vitest";
import { slugDesde, validarAlta, datosOferta, validarDatosGrupo, passwordValida } from "./validate";

describe("slugDesde", () => {
  it("normaliza acentos, ñ y signos", () => {
    expect(slugDesde("Cooperativa La Ñandú, nº 3!")).toBe("cooperativa-la-nandu-n-3");
  });
  it("no deja guiones al principio ni al final", () => {
    expect(slugDesde("  --Hola--  ")).toBe("hola");
  });
});

describe("validarAlta", () => {
  const ok = { nombre: "Techo Vecinal", password: "grupo-seguro-1", miembro: "Ana", miembroPassword: "ana-segura-1" };
  it("acepta un alta correcta y deriva el slug del nombre", () => {
    const r = validarAlta(ok);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.v.slug).toBe("techo-vecinal");
  });
  it("la familia es opcional y se limpia; si no es texto se ignora", () => {
    const f = (x: unknown) => { const r = validarAlta({ ...ok, familia: x }); return r.ok ? r.v.familia : null; };
    expect(f("  Mira   Ferrer ")).toBe("Mira Ferrer");
    expect(f(undefined)).toBe("");
    expect(f(42)).toBe("");
    expect(f("x".repeat(90))).toHaveLength(60);
  });
  it("rechaza contraseñas de menos de 8 caracteres", () => {
    expect(validarAlta({ ...ok, password: "corta" }).ok).toBe(false);
    expect(validarAlta({ ...ok, miembroPassword: "corta" }).ok).toBe(false);
  });
  it("rechaza slugs con mayúsculas, espacios o caracteres raros", () => {
    expect(validarAlta({ ...ok, slug: "Mi Grupo" }).ok).toBe(false);
    expect(validarAlta({ ...ok, slug: "ok;drop" }).ok).toBe(false);
  });
  it("rechaza entradas que no son objetos", () => {
    expect(validarAlta(null).ok).toBe(false);
    expect(validarAlta("texto").ok).toBe(false);
  });
});

describe("datosOferta (lista blanca)", () => {
  it("descarta campos que no están en la lista blanca", () => {
    const r = datosOferta({ titulo: "Edificio", url: "https://x.es/1", tipo: "edificios", precio: 100, telefono: "600000000", iban: "ES00" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.v).sort()).toEqual(["fuente", "m2", "precio", "tipo", "titulo", "url", "zona"].sort());
  });
  it("rechaza enlaces que no son https", () => {
    expect(datosOferta({ titulo: "X", url: "http://x.es", tipo: "terrenos" }).ok).toBe(false);
    expect(datosOferta({ titulo: "X", url: "javascript:alert(1)", tipo: "terrenos" }).ok).toBe(false);
  });
  it("rechaza precios negativos o no numéricos (los deja a null)", () => {
    const r = datosOferta({ titulo: "X", url: "https://x.es", tipo: "terrenos", precio: -5, m2: "80" });
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.v.precio).toBeNull(); expect(r.v.m2).toBeNull(); }
  });
});

describe("validarDatosGrupo", () => {
  const ok = { region: "cv", ciudad: "València", familias: 12, barrio: "Russafa" };
  it("acepta datos correctos y descarta campos de más", () => {
    const r = validarDatosGrupo({ ...ok, ingresos: 99999, capital: 5 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.v).sort()).toEqual(["barrio", "ciudad", "familias", "region"]);
  });
  it("admite el centro de acción y la distancia máxima, y son opcionales", () => {
    const r = validarDatosGrupo({ ...ok, centro: "  València ", radio: 20 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.v).toMatchObject({ centro: "València", radio: 20 });
    expect(validarDatosGrupo({ ...ok, radio: 0, centro: "" }).ok).toBe(true);
  });
  it("rechaza una distancia fuera de rango o que no es un entero, y un centro demasiado largo", () => {
    for (const radio of [-1, 201, 2.5, "20", null]) expect(validarDatosGrupo({ ...ok, radio }).ok, String(radio)).toBe(false);
    expect(validarDatosGrupo({ ...ok, centro: "x".repeat(81) }).ok).toBe(false);
  });
  it("admite la comunidad sin elegir", () => expect(validarDatosGrupo({ ...ok, region: "" }).ok).toBe(true));
  it("rechaza comunidades inventadas, familias fuera de rango y textos largos", () => {
    expect(validarDatosGrupo({ ...ok, region: "zz" }).ok).toBe(false);
    expect(validarDatosGrupo({ ...ok, familias: 0 }).ok).toBe(false);
    expect(validarDatosGrupo({ ...ok, familias: 201 }).ok).toBe(false);
    expect(validarDatosGrupo({ ...ok, familias: 2.5 }).ok).toBe(false);
    expect(validarDatosGrupo({ ...ok, familias: "12" }).ok).toBe(false);
    expect(validarDatosGrupo({ ...ok, ciudad: "x".repeat(81) }).ok).toBe(false);
    expect(validarDatosGrupo(null).ok).toBe(false);
    expect(validarDatosGrupo({}).ok).toBe(false);
  });
});

describe("passwordValida", () => {
  it("exige entre 8 y 200 caracteres", () => {
    expect(passwordValida("corta")).toBe(false);
    expect(passwordValida("suficiente1")).toBe(true);
    expect(passwordValida("x".repeat(201))).toBe(false);
    expect(passwordValida(12345678)).toBe(false);
  });
});
