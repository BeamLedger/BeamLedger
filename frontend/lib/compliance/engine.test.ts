import { describe, it, expect } from "vitest";
import { evaluateFixture, computeOverallStatus, computeComplianceScore } from "./engine";
import type { Fixture, StandardId, ComplianceStatus } from "./types";

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "TEST-001",
    assetTag: "BL-TEST-001",
    fixtureName: "Test Fixture",
    manufacturer: "TestCo",
    model: "T-100",
    fixtureType: "LED Troffer",
    wattage: 40,
    lumenOutput: 4400,
    cct: 4000,
    cri: 82,
    quantity: 10,
    spaceType: "Office - Open Plan",
    spaceArea: 800,
    applicableStandards: ["ASHRAE_90_1_2022"],
    importSource: "manual",
    importedAt: "2026-03-20T00:00:00Z",
    notes: "",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  ASHRAE 90.1 LPD Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("ASHRAE 90.1-2022 LPD", () => {
  it("passes when LPD is under allowance", () => {
    // 10 × 40W / 800 ft² = 0.5 W/ft² → under 0.61
    const fx = makeFixture({ wattage: 40, quantity: 10, spaceArea: 800 });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("pass");
    expect(ev.results[0].calculatedLpd).toBeCloseTo(0.5, 6);
    expect(ev.results[0].allowedLpd).toBe(0.61);
  });

  it("fails when LPD exceeds allowance", () => {
    // 10 × 60W / 800 ft² = 0.75 W/ft²
    const fx = makeFixture({ wattage: 60, quantity: 10, spaceArea: 800 });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("fail");
    expect(ev.results[0].notes).toContain("EXCEEDS");
  });

  it("passes at boundary within tolerance", () => {
    // 0.6105 W/ft² → within 0.001 tolerance of 0.61
    const fx = makeFixture({ wattage: 48.84, quantity: 10, spaceArea: 800 });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("pass");
  });

  it("fails at boundary over tolerance", () => {
    // 0.612 W/ft² → over 0.001 tolerance
    const fx = makeFixture({ wattage: 48.96, quantity: 10, spaceArea: 800 });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("fail");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Missing / Invalid Fields
// ═══════════════════════════════════════════════════════════════════════════

describe("Missing field handling", () => {
  it("returns data_error for missing wattage", () => {
    const fx = makeFixture({ wattage: undefined as any });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("data_error");
    expect(ev.results[0].notes).toContain("wattage");
  });

  it("returns data_error for missing spaceType", () => {
    const fx = makeFixture({ spaceType: "" });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("data_error");
    expect(ev.results[0].notes).toContain("spaceType");
  });

  it("returns data_error for missing spaceArea", () => {
    const fx = makeFixture({ spaceArea: 0 });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("data_error");
  });

  it("returns data_error for unknown space type", () => {
    const fx = makeFixture({ spaceType: "Underwater Cave" });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("data_error");
    expect(ev.results[0].notes).toContain("not found");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Exempt Spaces
// ═══════════════════════════════════════════════════════════════════════════

describe("Exempt spaces", () => {
  it("returns exempt for dwelling unit", () => {
    const fx = makeFixture({ spaceType: "dwelling unit" });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("exempt");
  });

  it("returns exempt for theatrical performance", () => {
    const fx = makeFixture({ spaceType: "theatrical performance" });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("exempt");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  DLC Efficacy
// ═══════════════════════════════════════════════════════════════════════════

describe("DLC QPL v5.1 efficacy", () => {
  it("passes when efficacy meets minimum", () => {
    // 4400 / 40 = 110 lm/W → meets 110 for troffer
    const fx = makeFixture({
      applicableStandards: ["DLC_QPL_5_1"],
      wattage: 40,
      lumenOutput: 4400,
      fixtureType: "LED Troffer",
    });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("pass");
    expect(ev.results[0].efficacy).toBeCloseTo(110, 1);
  });

  it("fails when efficacy is below minimum", () => {
    // 3000 / 40 = 75 lm/W → below 110
    const fx = makeFixture({
      applicableStandards: ["DLC_QPL_5_1"],
      wattage: 40,
      lumenOutput: 3000,
      fixtureType: "LED Troffer",
    });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("fail");
    expect(ev.results[0].notes).toContain("below minimum");
  });

  it("returns data_error for zero wattage", () => {
    const fx = makeFixture({
      applicableStandards: ["DLC_QPL_5_1"],
      wattage: 0,
    });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("data_error");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  IES Illuminance
// ═══════════════════════════════════════════════════════════════════════════

describe("IES illuminance", () => {
  it("passes when illuminance is in range", () => {
    // 10 × 4400 × 0.6 / 800 = 33 fc → in range (20–50)
    const fx = makeFixture({
      applicableStandards: ["IES_ILLUMINANCE"],
      lumenOutput: 4400,
      quantity: 10,
      spaceArea: 800,
    });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("pass");
  });

  it("fails when illuminance is below minimum", () => {
    const fx = makeFixture({
      applicableStandards: ["IES_ILLUMINANCE"],
      lumenOutput: 500,
      quantity: 1,
      spaceArea: 800,
    });
    const ev = evaluateFixture(fx);
    expect(ev.results[0].status).toBe("fail");
    expect(ev.results[0].notes).toContain("below minimum");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  Multi-standard & Scoring
// ═══════════════════════════════════════════════════════════════════════════

describe("Multi-standard evaluation", () => {
  it("all pass → score 100", () => {
    const fx = makeFixture({
      applicableStandards: ["ASHRAE_90_1_2022", "DLC_QPL_5_1"],
      wattage: 40,
      lumenOutput: 4400,
      fixtureType: "LED Troffer",
    });
    const ev = evaluateFixture(fx);
    expect(ev.overallStatus).toBe("pass");
    expect(computeComplianceScore(ev.results)).toBe(100);
  });

  it("mixed pass/fail → score 50, overall fail", () => {
    const fx = makeFixture({
      applicableStandards: ["ASHRAE_90_1_2022", "DLC_QPL_5_1"],
      wattage: 40,
      lumenOutput: 3000, // 75 lm/W → DLC fail
      fixtureType: "LED Troffer",
    });
    const ev = evaluateFixture(fx);
    expect(ev.overallStatus).toBe("fail");
    expect(computeComplianceScore(ev.results)).toBe(50);
  });

  it("no standards → data_error, score 0", () => {
    const fx = makeFixture({ applicableStandards: [] });
    const ev = evaluateFixture(fx);
    expect(ev.overallStatus).toBe("data_error");
    expect(computeComplianceScore(ev.results)).toBe(0);
  });
});
