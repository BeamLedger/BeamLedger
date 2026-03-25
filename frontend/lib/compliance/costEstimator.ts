/**
 * Client-side Cost-to-Comply Estimator & ROI Calculator
 * Mirrors backend/app/services/cost_estimator.py
 */

import type { Fixture, ComplianceStatus } from "./types"

// ── Fixture Pricing Database ────────────────────────────────────────────────

export interface FixturePricing {
  fixtureType: string
  minPrice: number
  maxPrice: number
  avgPrice: number
  typicalWattage: number
  dlcListed: boolean
}

const RAW_PRICING: [string, number, number, number, boolean][] = [
  ["LED Troffer",         45,   120,   30,  true],
  ["LED Panel",           40,   110,   32,  true],
  ["LED High Bay",        80,   250,  150,  true],
  ["LED Low Bay",         55,   150,   75,  true],
  ["LED Downlight",       15,    65,   12,  true],
  ["LED Strip",           10,    45,   14,  false],
  ["LED Wall Pack",       50,   180,   30,  true],
  ["LED Flood Light",     60,   220,   80,  true],
  ["LED Area Light",      90,   350,  100,  true],
  ["LED Bollard",         80,   250,   15,  true],
  ["LED Canopy",          65,   200,   45,  true],
  ["LED Parking Garage",  70,   220,   40,  true],
  ["LED Stairwell",       35,   100,   20,  true],
  ["LED Vapor Tight",     45,   130,   35,  true],
  ["LED Track Light",     20,    80,   10,  false],
  ["LED Pendant",         55,   250,   25,  true],
  ["LED Sconce",          25,    90,   10,  false],
  ["LED Emergency",       30,    85,    5,  false],
  ["LED Exit Sign",       20,    60,    2,  false],
  ["Other",               40,   150,   30,  false],
]

export const FIXTURE_PRICING_DB: Record<string, FixturePricing> = {}
for (const [type, min, max, watt, dlc] of RAW_PRICING) {
  FIXTURE_PRICING_DB[type] = {
    fixtureType: type,
    minPrice: min,
    maxPrice: max,
    avgPrice: Math.round(((min + max) / 2) * 100) / 100,
    typicalWattage: watt,
    dlcListed: dlc,
  }
}

// ── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_UTILITY_RATE = 0.12    // $/kWh
export const DEFAULT_ANNUAL_HOURS = 4380    // hrs/yr (commercial)
export const TYPICAL_REBATE_MIN = 20        // $/fixture
export const TYPICAL_REBATE_MAX = 50        // $/fixture

// ── Types ───────────────────────────────────────────────────────────────────

export interface FixtureCostEstimate {
  fixtureId: string
  fixtureType: string
  fixtureName: string
  currentWattage: number
  replacementWattage: number
  quantity: number
  replacementCostMin: number
  replacementCostMax: number
  replacementCostAvg: number
  annualEnergyCurrent: number   // kWh
  annualEnergyReplacement: number
  annualEnergySavings: number
  annualCostCurrent: number     // $
  annualCostReplacement: number
  annualSavings: number
  paybackYears: number | null
  dlcListed: boolean
  rebateEligible: boolean
  estimatedRebateMin: number
  estimatedRebateMax: number
}

export interface SiteROISummary {
  totalFixtures: number
  failingFixtures: number
  totalReplacementCostMin: number
  totalReplacementCostMax: number
  totalReplacementCostAvg: number
  totalAnnualEnergyCurrent: number
  totalAnnualEnergyReplacement: number
  totalAnnualEnergySavings: number
  totalAnnualCostCurrent: number
  totalAnnualCostReplacement: number
  totalAnnualSavings: number
  avgPaybackYears: number | null
  rebateEligibleCount: number
  estimatedTotalRebateMin: number
  estimatedTotalRebateMax: number
  fixtureEstimates: FixtureCostEstimate[]
}

// ── Calculator ──────────────────────────────────────────────────────────────

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

export function estimateFixtureCost(
  fixtureId: string,
  fixtureType: string,
  fixtureName: string,
  currentWattage: number,
  quantity: number,
  utilityRate = DEFAULT_UTILITY_RATE,
  annualHours = DEFAULT_ANNUAL_HOURS,
): FixtureCostEstimate {
  const pricing = FIXTURE_PRICING_DB[fixtureType] ?? FIXTURE_PRICING_DB["Other"]
  const qty = Math.max(quantity, 1)
  const replW = pricing.typicalWattage

  const costMin = pricing.minPrice * qty
  const costMax = pricing.maxPrice * qty
  const costAvg = pricing.avgPrice * qty

  const currentKwh = (currentWattage * qty * annualHours) / 1000
  const replKwh = (replW * qty * annualHours) / 1000
  const savingsKwh = currentKwh - replKwh

  const annualCostCurr = currentKwh * utilityRate
  const annualCostRepl = replKwh * utilityRate
  const annualSavings = savingsKwh * utilityRate

  const payback = annualSavings > 0 ? r2(costAvg / annualSavings) : null

  const dlc = pricing.dlcListed
  const rebateMin = dlc ? TYPICAL_REBATE_MIN * qty : 0
  const rebateMax = dlc ? TYPICAL_REBATE_MAX * qty : 0

  return {
    fixtureId,
    fixtureType,
    fixtureName: fixtureName || fixtureType,
    currentWattage,
    replacementWattage: replW,
    quantity: qty,
    replacementCostMin: r2(costMin),
    replacementCostMax: r2(costMax),
    replacementCostAvg: r2(costAvg),
    annualEnergyCurrent: r2(currentKwh),
    annualEnergyReplacement: r2(replKwh),
    annualEnergySavings: r2(savingsKwh),
    annualCostCurrent: r2(annualCostCurr),
    annualCostReplacement: r2(annualCostRepl),
    annualSavings: r2(annualSavings),
    paybackYears: payback,
    dlcListed: dlc,
    rebateEligible: dlc,
    estimatedRebateMin: r2(rebateMin),
    estimatedRebateMax: r2(rebateMax),
  }
}

export function calculateSiteROI(
  failingFixtures: { fixtureId: string; fixtureType: string; fixtureName: string; wattage: number; quantity: number }[],
  totalFixtureCount: number,
  utilityRate = DEFAULT_UTILITY_RATE,
  annualHours = DEFAULT_ANNUAL_HOURS,
): SiteROISummary {
  const estimates = failingFixtures.map((fx) =>
    estimateFixtureCost(fx.fixtureId, fx.fixtureType, fx.fixtureName, fx.wattage, fx.quantity, utilityRate, annualHours)
  )

  const sum = (fn: (e: FixtureCostEstimate) => number) => r2(estimates.reduce((a, e) => a + fn(e), 0))

  const totalCostAvg = sum((e) => e.replacementCostAvg)
  const totalSavings = sum((e) => e.annualSavings)

  return {
    totalFixtures: totalFixtureCount,
    failingFixtures: estimates.length,
    totalReplacementCostMin: sum((e) => e.replacementCostMin),
    totalReplacementCostMax: sum((e) => e.replacementCostMax),
    totalReplacementCostAvg: totalCostAvg,
    totalAnnualEnergyCurrent: sum((e) => e.annualEnergyCurrent),
    totalAnnualEnergyReplacement: sum((e) => e.annualEnergyReplacement),
    totalAnnualEnergySavings: sum((e) => e.annualEnergySavings),
    totalAnnualCostCurrent: sum((e) => e.annualCostCurrent),
    totalAnnualCostReplacement: sum((e) => e.annualCostReplacement),
    totalAnnualSavings: totalSavings,
    avgPaybackYears: totalSavings > 0 ? r2(totalCostAvg / totalSavings) : null,
    rebateEligibleCount: estimates.filter((e) => e.rebateEligible).length,
    estimatedTotalRebateMin: sum((e) => e.estimatedRebateMin),
    estimatedTotalRebateMax: sum((e) => e.estimatedRebateMax),
    fixtureEstimates: estimates,
  }
}

export function getPricing(fixtureType: string): FixturePricing {
  return FIXTURE_PRICING_DB[fixtureType] ?? FIXTURE_PRICING_DB["Other"]
}
