import { describe, it, expect, beforeAll } from "vitest";
import { hashPassword, checkPassword, firmar, leer } from "./auth";

beforeAll(() => { process.env.AUTH_SECRET = "x".repeat(40); });

describe("contraseñas", () => {
  it("guarda hash bcrypt, nunca el texto plano", async () => {
    const h = await hashPassword("secreto-123");
    expect(h).not.toContain("secreto-123");
    expect(h.startsWith("$2")).toBe(true);
  });
  it("verifica la contraseña correcta y rechaza la incorrecta", async () => {
    const h = await hashPassword("secreto-123");
    expect(await checkPassword("secreto-123", h)).toBe(true);
    expect(await checkPassword("secreto-124", h)).toBe(false);
  });
});

describe("sesión firmada", () => {
  it("ida y vuelta: recupera grupo y miembro", () => {
    const t = firmar({ g: "grupo-1", m: "miembro-1" });
    expect(leer(t)).toMatchObject({ g: "grupo-1", m: "miembro-1" });
  });
  it("rechaza un token alterado (p. ej. cambiar el grupo)", () => {
    const t = firmar({ g: "grupo-1" });
    const [cuerpo, sig] = t.split(".");
    const forjado = Buffer.from(JSON.stringify({ g: "grupo-2", exp: Date.now() + 3_600_000 })).toString("base64url");
    expect(leer(`${forjado}.${sig}`)).toBeNull();
    expect(leer(`${cuerpo}x.${sig}`)).toBeNull();
  });
  it("rechaza un token caducado", () => {
    const t = firmar({ g: "grupo-1" }, 1, 0);
    expect(leer(t, Date.now())).toBeNull();
  });
  it("rechaza un token firmado con otro secreto", () => {
    const t = firmar({ g: "grupo-1" });
    process.env.AUTH_SECRET = "y".repeat(40);
    try { expect(leer(t)).toBeNull(); } finally { process.env.AUTH_SECRET = "x".repeat(40); }
  });
  it("sin token o con basura devuelve null", () => {
    expect(leer(undefined)).toBeNull();
    expect(leer("basura")).toBeNull();
    expect(leer("a.b.c")).toBeNull();
  });
});
