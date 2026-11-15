import { describe, expect, it } from "vitest";
import { evaluateContrast, verifyAllDesignTokenPairs, DESIGN_TOKENS } from "../lib/contrast-check";

describe("Design Token Contrast Verification (WCAG 2.2 AA)", () => {
  it("verifies primary text text-hi achieves >= 4.5:1 on all ink surfaces", () => {
    const res950 = evaluateContrast(DESIGN_TOKENS.textHi, DESIGN_TOKENS.ink950);
    const res900 = evaluateContrast(DESIGN_TOKENS.textHi, DESIGN_TOKENS.ink900);
    const res800 = evaluateContrast(DESIGN_TOKENS.textHi, DESIGN_TOKENS.ink800);

    expect(res950.ratio).toBeGreaterThanOrEqual(13.0);
    expect(res950.passesAA).toBe(true);

    expect(res900.ratio).toBeGreaterThanOrEqual(12.0);
    expect(res900.passesAA).toBe(true);

    expect(res800.ratio).toBeGreaterThanOrEqual(10.0);
    expect(res800.passesAA).toBe(true);
  });

  it("verifies secondary body text text-mid achieves >= 4.5:1 on ink surfaces", () => {
    const res950 = evaluateContrast(DESIGN_TOKENS.textMid, DESIGN_TOKENS.ink950);
    const res900 = evaluateContrast(DESIGN_TOKENS.textMid, DESIGN_TOKENS.ink900);
    const res800 = evaluateContrast(DESIGN_TOKENS.textMid, DESIGN_TOKENS.ink800);

    expect(res950.ratio).toBeGreaterThanOrEqual(7.0);
    expect(res950.passesAA).toBe(true);

    expect(res900.ratio).toBeGreaterThanOrEqual(6.5);
    expect(res900.passesAA).toBe(true);

    expect(res800.ratio).toBeGreaterThanOrEqual(5.5);
    expect(res800.passesAA).toBe(true);
  });

  it("verifies accent colors achieve >= 4.5:1 for indicators on dark surfaces", () => {
    const amberOn950 = evaluateContrast(DESIGN_TOKENS.amber400, DESIGN_TOKENS.ink950);
    const violetOn950 = evaluateContrast(DESIGN_TOKENS.violet300, DESIGN_TOKENS.ink950);
    const blueOn950 = evaluateContrast(DESIGN_TOKENS.blue300, DESIGN_TOKENS.ink950);

    expect(amberOn950.ratio).toBeGreaterThanOrEqual(9.0);
    expect(amberOn950.passesAA).toBe(true);

    expect(violetOn950.ratio).toBeGreaterThanOrEqual(7.0);
    expect(violetOn950.passesAA).toBe(true);

    expect(blueOn950.ratio).toBeGreaterThanOrEqual(8.0);
    expect(blueOn950.passesAA).toBe(true);
  });

  it("confirms complete design token suite passes AA thresholds", () => {
    const allResults = verifyAllDesignTokenPairs();
    for (const [name, res] of Object.entries(allResults)) {
      expect(res.compliant, `Pair ${name} failed threshold with ratio ${res.ratio}`).toBe(true);
    }
  });
});
