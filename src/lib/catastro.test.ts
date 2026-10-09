import { describe, it, expect } from "vitest";
import { catastroUrl, parseDireccion, parseRespuestaCatastro, isRefcat } from "./catastro";
describe("catastro", () => {
  it("construye el enlace a la parcela con 14 o 20 caracteres, y rechaza basura", () => {
    const u = "https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCListaBienes.aspx?rc1=5921208&rc2=YJ2752B";
    expect(catastroUrl("5921208YJ2752B")).toBe(u);
    expect(catastroUrl("5921208yj2752b0001ax")).toBe(u);
    expect(catastroUrl("5921208 YJ2752B")).toBe(u);
    expect(catastroUrl("hola")).toBeNull();
    expect(catastroUrl("")).toBeNull();
    expect(isRefcat("5921208YJ2752B0001AX")).toBe(true);
  });
  it("interpreta direcciones habituales", () => {
    expect(parseDireccion("Calle de Colón 1, València")).toEqual({ sigla: "CL", calle: "COLON", numero: "1" });
    expect(parseDireccion("Carrer de la Pau, 12")).toEqual({ sigla: "CL", calle: "PAU", numero: "12" });
    expect(parseDireccion("Avenida del Puerto nº 45")).toEqual({ sigla: "AV", calle: "PUERTO", numero: "45" });
    expect(parseDireccion("Plaza de España 3")).toEqual({ sigla: "PZ", calle: "ESPANA", numero: "3" });
    expect(parseDireccion("Benimàmet")).toBeNull();
    expect(parseDireccion("Calle Colón")).toBeNull();
  });
  it("extrae parcelas únicas de la respuesta XML", () => {
    const xml = `<consulta_dnp><lrcdnp><rcdnp><rc><pc1>5921208</pc1><pc2>YJ2752B</pc2><car>0001</car></rc><dt><lourb><dir><tv>CL</tv><nv>COLON</nv><pnp>1</pnp></dir></lourb></dt></rcdnp><rcdnp><rc><pc1>5921208</pc1><pc2>YJ2752B</pc2><car>0002</car></rc><dt><lourb><dir><tv>CL</tv><nv>COLON</nv><pnp>1</pnp></dir></lourb></dt></rcdnp></lrcdnp></consulta_dnp>`;
    expect(parseRespuestaCatastro(xml)).toEqual([{ refcat: "5921208YJ2752B", direccion: "CL COLON 1" }]);
    expect(parseRespuestaCatastro("<error/>")).toEqual([]);
  });
});
