/**
 * Client-side compliance evaluation engine.
 *
 * Evaluates fixtures against ASHRAE 90.1-2022, CA Title 24-2022, IECC 2021,
 * IES illuminance recommendations, and DLC QPL v5.1 efficacy requirements.
 *
 * All LPD calculations use full JavaScript float64 precision.
 * Comparison tolerance: ±0.001 W/ft².
 */

import type {
  Fixture,
  StandardId,
  ComplianceResult,
  ComplianceStatus,
  FixtureEvaluation,
} from "./types";
import {
  STANDARD_DEFINITIONS,
  EXEMPT_SPACE_TYPES,
  findLpdAllowance,
  findIlluminance,
  findEfficacy,
} from "./standards";

const LPD_TOLERANCE = 0.001; // W/ft²

let _idCounter = 0;
function nextId(): string {
  return `cr_${++_idCounter}_${Date.now()}`;
}

function makeDataError(
  fixtureId: string,
  standardId: StandardId,
  notes: string
): ComplianceResult {
  const def = STANDARD_DEFINITIONS[standardId];
  return {
    id: nextId(),
    fixtureId,
    standard: standardId,
    standardName: def?.name ?? standardId,
    codeSection: "N/A",
    status: "data_error",
    allowedLpd: null,
    calculatedLpd: null,
    delta: null,
    efficacy: null,
    minEfficacy: null,
    notes,
  };
}

function evaluateLpd(fixture: Fixture, standardId: StandardId): ComplianceResult {
  const def = STANDARD_DEFINITIONS[standardId];
  const stdName = def?.name ?? standardId;

  // Check exempt
  if (EXEMPT_SPACE_TYPES.has(fixture.spaceType.trim().toLowerCase())) {
    return {
      id: nextId(),
      fixtureId: fixture.id,
      standard: standardId,
      standardName: stdName,
      codeSection: "Exempt",
      status: "exempt",
      allowedLpd: null,
      calculatedLpd: null,
      delta: null,
      efficacy: null,
      minEfficacy: null,
      notes: `Space type '${fixture.spaceType}' is exempt from LPD requirements under ${stdName}.`,
    };
  }

  // Validate required fields
  const missing: string[] = [];
  if (fixture.wattage == null || fixture.wattage < 0) missing.push("wattage");
  if (fixture.lumenOutput == null || fixture.lumenOutput < 0) missing.push("lumenOutput");
  if (!fixture.spaceType?.trim()) missing.push("spaceType");
  if (fixture.spaceArea == null || fixture.spaceArea <= 0) missing.push("spaceArea");

  if (missing.length > 0) {
    return makeDataError(
      fixture.id,
      standardId,
      `Missing required fields: ${missing.join(", ")}. Cannot evaluate.`
    );
  }

  // Look up allowance
  const allowance = findLpdAllowance(standardId, fixture.spaceType);
  if (!allowance) {
    return makeDataError(
      fixture.id,
      standardId,
      `Space type '${fixture.spaceType}' not found in ${stdName} tables. Cannot evaluate.`
    );
  }

  // Calculate LPD: (wattage × quantity) / space_area
  const totalWattage = fixture.wattage * fixture.quantity;
  const calculatedLpd = totalWattage / fixture.spaceArea;
  const allowed = allowance.allowedLpd;
  const delta = calculatedLpd - allowed;

  let status: ComplianceStatus;
  let notes: string;

  if (calculatedLpd <= allowed + LPD_TOLERANCE) {
    status = "pass";
    notes =
      `LPD ${calculatedLpd.toFixed(6)} W/ft² is within allowance of ${allowed.toFixed(3)} W/ft² ` +
      `(delta: ${delta >= 0 ? "+" : ""}${delta.toFixed(6)} W/ft²). Compliant with ${allowance.codeSection}.`;
  } else {
    status = "fail";
    notes =
      `LPD ${calculatedLpd.toFixed(6)} W/ft² EXCEEDS allowance of ${allowed.toFixed(3)} W/ft² ` +
      `by ${delta.toFixed(6)} W/ft². Reduce total wattage by at least ` +
      `${(delta * fixture.spaceArea).toFixed(2)}W to comply with ${allowance.codeSection}.`;
  }

  return {
    id: nextId(),
    fixtureId: fixture.id,
    standard: standardId,
    standardName: stdName,
    codeSection: allowance.codeSection,
    status,
    allowedLpd: allowed,
    calculatedLpd: parseFloat(calculatedLpd.toFixed(6)),
    delta: parseFloat(delta.toFixed(6)),
    efficacy: null,
    minEfficacy: null,
    notes,
  };
}

function evaluateIes(fixture: Fixture): ComplianceResult {
  const standardId: StandardId = "IES_ILLUMINANCE";
  const stdName = "IES Illuminance";

  if (!fixture.spaceType?.trim()) {
    return makeDataError(fixture.id, standardId, "Missing required field: spaceType. Cannot evaluate IES illuminance.");
  }
  if (fixture.lumenOutput == null || fixture.lumenOutput < 0) {
    return makeDataError(fixture.id, standardId, "Missing required field: lumenOutput. Cannot evaluate IES illuminance.");
  }

  const req = findIlluminance(fixture.spaceType);
  if (!req) {
    return makeDataError(fixture.id, standardId, `Space type '${fixture.spaceType}' not found in IES illuminance tables.`);
  }

  if (fixture.spaceArea == null || fixture.spaceArea <= 0) {
    return {
      id: nextId(),
      fixtureId: fixture.id,
      standard: standardId,
      standardName: stdName,
      codeSection: req.codeSection,
      status: "data_error",
      allowedLpd: null,
      calculatedLpd: null,
      delta: null,
      efficacy: null,
      minEfficacy: null,
      notes: `Missing spaceArea — cannot estimate illuminance. Target for '${req.spaceType}': ${req.targetFc} fc.`,
    };
  }

  const cu = 0.6;
  const totalLumens = fixture.lumenOutput * fixture.quantity;
  const estimatedFc = (totalLumens * cu) / fixture.spaceArea;

  let status: ComplianceStatus;
  let notes: string;

  if (estimatedFc < req.minFc) {
    status = "fail";
    notes = `Estimated illuminance ${estimatedFc.toFixed(1)} fc is below minimum ${req.minFc} fc for '${req.spaceType}'. Target: ${req.targetFc} fc (${req.codeSection}).`;
  } else if (estimatedFc > req.maxFc) {
    status = "fail";
    notes = `Estimated illuminance ${estimatedFc.toFixed(1)} fc exceeds maximum ${req.maxFc} fc for '${req.spaceType}'. Consider reducing fixture count or lumens. Target: ${req.targetFc} fc (${req.codeSection}).`;
  } else {
    status = "pass";
    notes = `Estimated illuminance ${estimatedFc.toFixed(1)} fc is within recommended range (${req.minFc}–${req.maxFc} fc) for '${req.spaceType}'. Target: ${req.targetFc} fc (${req.codeSection}).`;
  }

  return {
    id: nextId(),
    fixtureId: fixture.id,
    standard: standardId,
    standardName: stdName,
    codeSection: req.codeSection,
    status,
    allowedLpd: null,
    calculatedLpd: null,
    delta: null,
    efficacy: null,
    minEfficacy: null,
    notes,
  };
}

function evaluateDlc(fixture: Fixture): ComplianceResult {
  const standardId: StandardId = "DLC_QPL_5_1";
  const stdName = "DLC QPL v5.1";

  if (fixture.wattage == null || fixture.wattage <= 0) {
    return makeDataError(fixture.id, standardId, "Missing or zero wattage. Cannot calculate efficacy.");
  }
  if (fixture.lumenOutput == null || fixture.lumenOutput < 0) {
    return makeDataError(fixture.id, standardId, "Missing lumenOutput. Cannot calculate efficacy.");
  }

  const req = findEfficacy(fixture.fixtureType);
  if (!req) {
    return makeDataError(fixture.id, standardId, `Fixture type '${fixture.fixtureType}' not found in DLC QPL v5.1 categories.`);
  }

  const efficacy = fixture.lumenOutput / fixture.wattage;
  const minEff = req.minEfficacy;

  let status: ComplianceStatus;
  let notes: string;

  if (efficacy >= minEff) {
    status = "pass";
    notes = `Efficacy ${efficacy.toFixed(2)} lm/W meets minimum ${minEff} lm/W for ${req.fixtureCategory} (${req.codeSection}).`;
  } else {
    status = "fail";
    notes = `Efficacy ${efficacy.toFixed(2)} lm/W is below minimum ${minEff} lm/W for ${req.fixtureCategory}. Shortfall: ${(minEff - efficacy).toFixed(2)} lm/W (${req.codeSection}).`;
  }

  return {
    id: nextId(),
    fixtureId: fixture.id,
    standard: standardId,
    standardName: stdName,
    codeSection: req.codeSection,
    status,
    allowedLpd: null,
    calculatedLpd: null,
    delta: null,
    efficacy: parseFloat(efficacy.toFixed(6)),
    minEfficacy: minEff,
    notes,
  };
}

export function evaluateFixture(fixture: Fixture): FixtureEvaluation {
  const results: ComplianceResult[] = [];

  for (const stdId of fixture.applicableStandards) {
    if (stdId === "ASHRAE_90_1_2022" || stdId === "TITLE_24_2022" || stdId === "IECC_2021") {
      results.push(evaluateLpd(fixture, stdId));
    } else if (stdId === "IES_ILLUMINANCE") {
      results.push(evaluateIes(fixture));
    } else if (stdId === "DLC_QPL_5_1") {
      results.push(evaluateDlc(fixture));
    } else {
      results.push(makeDataError(fixture.id, stdId as StandardId, `Unknown standard '${stdId}'. Cannot evaluate.`));
    }
  }

  return {
    fixtureId: fixture.id,
    fixture,
    results,
    overallStatus: computeOverallStatus(results),
    timestamp: new Date().toISOString(),
  };
}

export function computeOverallStatus(results: ComplianceResult[]): ComplianceStatus {
  if (results.length === 0) return "data_error";
  const statuses = new Set(results.map((r) => r.status));
  if (statuses.has("fail")) return "fail";
  if (statuses.has("data_error")) return "data_error";
  if (statuses.size === 1 && statuses.has("exempt")) return "exempt";
  return "pass";
}

export function computeComplianceScore(results: ComplianceResult[]): number {
  if (results.length === 0) return 0;
  const scoreMap: Record<string, number> = { pass: 100, exempt: 100, fail: 0, data_error: 0 };
  const total = results.reduce((sum, r) => sum + (scoreMap[r.status] ?? 0), 0);
  return Math.round(total / results.length);
}
