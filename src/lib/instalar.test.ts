import { describe, it, expect } from "vitest";
import { esIOS } from "./instalar";

describe("detección de iPhone y iPad para explicar cómo instalar", () => {
  it("iPhone y iPad con su cabecera clásica", () => {
    expect(esIOS("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1")).toBe(true);
    expect(esIOS("Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1")).toBe(true);
  });
  it("iPad reciente, que se presenta como un Mac pero tiene pantalla táctil", () => {
    expect(esIOS("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", 5)).toBe(true);
  });
  it("un Mac de verdad, Android y Windows no", () => {
    expect(esIOS("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15", 0)).toBe(false);
    expect(esIOS("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36", 5)).toBe(false);
    expect(esIOS("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36", 0)).toBe(false);
  });
});
