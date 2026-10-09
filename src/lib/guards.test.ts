import { describe, it, expect, beforeEach } from "vitest";
import { canSpend, recordCall, recordFailure, rateLimit, _reset, dailyCap } from "./guards";
beforeEach(() => { _reset(); delete process.env.SEARCH_DAILY_CAP; });
describe("guards", () => {
  it("tope diario", () => {
    process.env.SEARCH_DAILY_CAP = "2";
    expect(canSpend().ok).toBe(true); recordCall(); recordCall();
    expect(canSpend()).toEqual({ ok: false, reason: "cap" });
  });
  it("tope máximo absoluto de 50", () => { process.env.SEARCH_DAILY_CAP = "9999"; expect(dailyCap()).toBe(50); });
  it("enfriamiento tras fallo", () => { recordFailure(1000); expect(canSpend(2000)).toEqual({ ok: false, reason: "cooldown" }); expect(canSpend(1000 + 11 * 60_000).ok).toBe(true); });
  it("límite por IP", () => { for (let i = 0; i < 20; i++) expect(rateLimit("a", 1000)).toBe(true); expect(rateLimit("a", 1000)).toBe(false); expect(rateLimit("b", 1000)).toBe(true); });
});
