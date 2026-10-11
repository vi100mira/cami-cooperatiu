import { describe, it, expect } from "vitest";
import { slugDesde, validarAlta, datosOferta } from "./validate";

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
