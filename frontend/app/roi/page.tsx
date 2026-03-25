"use client"

import { useMemo, useState } from "react"
import {
  DollarSign, TrendingDown, Clock, Zap, Award, AlertCircle,
  ChevronDown, ChevronUp, Settings2,
} from "lucide-react"
import { sampleFixtures } from "../../lib/compliance/sampleData"
import { evaluateFixture, computeComplianceScore } from "../../lib/compliance/engine"
import {
  calculateSiteROI, estimateFixtureCost, FIXTURE_PRICING_DB,
  DEFAULT_UTILITY_RATE, DEFAULT_ANNUAL_HOURS,
} from "../../lib/compliance/costEstimator"
import type { ComplianceStatus } from "../../lib/compliance/types"

const mono = { fontFamily: "'Ubin Sans', monospace" } as const

function fmt$(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function fmtK(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0)
}

export default function ROIPage() {
  const [utilityRate, setUtilityRate] = useState(DEFAULT_UTILITY_RATE)
  const [annualHours, setAnnualHours] = useState(DEFAULT_ANNUAL_HOURS)
  const [showSettings, setShowSettings] = useState(false)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Evaluate all fixtures, identify failing ones
  const { roi, allEvals } = useMemo(() => {
    const evals = sampleFixtures.map((fx) => {
      const ev = evaluateFixture(fx)
      return { fixture: fx, evaluation: ev, score: computeComplianceScore(ev.results) }
    })

    const failing = evals
      .filter((e) => e.evaluation.overallStatus === "fail")
      .map((e) => ({
        fixtureId: e.fixture.id,
        fixtureType: e.fixture.fixtureType,
        fixtureName: e.fixture.fixtureName,
        wattage: e.fixture.wattage,
        quantity: e.fixture.quantity,
      }))

    const roiResult = calculateSiteROI(failing, evals.length, utilityRate, annualHours)
    return { roi: roiResult, allEvals: evals }
  }, [utilityRate, annualHours])

  const savingsPercent = roi.totalAnnualCostCurrent > 0
    ? Math.round((roi.totalAnnualSavings / roi.totalAnnualCostCurrent) * 100)
    : 0

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#e5e7eb] pb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ ...mono, color: "#6b7280" }}>
            Module: Financial Analysis
          </p>
          <h1 className="tracking-tight" style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937" }}>
            ROI Analysis &amp; Cost-to-Comply
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
            Know your payback before you spend a dollar — replacement costs, energy savings, and rebate eligibility
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border transition-colors"
          style={{
            ...mono,
            background: showSettings ? "rgba(127,29,29,0.08)" : "#f9fafb",
            borderColor: showSettings ? "#991b1b" : "#e5e7eb",
            color: showSettings ? "#7f1d1d" : "#6b7280",
          }}
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings2 size={12} /> Configure
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="border border-[#e5e7eb] p-4 grid grid-cols-2 gap-6" style={{ background: "#fafafa" }}>
          <div>
            <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ ...mono, color: "#6b7280" }}>
              Utility Rate ($/kWh)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full px-3 py-2 text-[12px] border outline-none"
              style={{ borderColor: "#e5e7eb", color: "#1f2937" }}
              value={utilityRate}
              onChange={(e) => setUtilityRate(Number(e.target.value) || 0.01)}
            />
          </div>
          <div>
            <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ ...mono, color: "#6b7280" }}>
              Annual Operating Hours
            </label>
            <input
              type="number"
              step="100"
              min="100"
              className="w-full px-3 py-2 text-[12px] border outline-none"
              style={{ borderColor: "#e5e7eb", color: "#1f2937" }}
              value={annualHours}
              onChange={(e) => setAnnualHours(Number(e.target.value) || 100)}
            />
          </div>
        </div>
      )}

      {/* Pitch banner */}
      <div className="border border-[#991b1b] p-4" style={{ background: "rgba(127,29,29,0.04)" }}>
        <p className="text-[12px]" style={{ color: "#7f1d1d", fontWeight: 500 }}>
          Compliance in seconds, not spreadsheets.
          <span style={{ fontWeight: 400, color: "#991b1b" }}>
            {" "}BeamLedger identified {roi.failingFixtures} non-compliant fixture(s) out of {roi.totalFixtures} total.
            Estimated replacement investment: {fmt$(roi.totalReplacementCostAvg)} with {fmt$(roi.totalAnnualSavings)}/yr in energy savings.
          </span>
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 border border-[#e5e7eb]" style={{ background: "#f9fafb" }}>
        {[
          { label: "REPLACEMENT COST", value: fmt$(roi.totalReplacementCostAvg), sub: `${fmt$(roi.totalReplacementCostMin)} – ${fmt$(roi.totalReplacementCostMax)}`, color: "#dc2626", icon: <DollarSign size={11} /> },
          { label: "ANNUAL SAVINGS", value: fmt$(roi.totalAnnualSavings), sub: `${savingsPercent}% energy reduction`, color: "#16a34a", icon: <TrendingDown size={11} /> },
          { label: "PAYBACK PERIOD", value: roi.avgPaybackYears ? `${roi.avgPaybackYears} yr` : "—", sub: "Average across all", color: "#d97706", icon: <Clock size={11} /> },
          { label: "ENERGY SAVED", value: `${fmtK(roi.totalAnnualEnergySavings)} kWh`, sub: "Per year", color: "#2563eb", icon: <Zap size={11} /> },
          { label: "REBATE ELIGIBLE", value: `${roi.rebateEligibleCount}`, sub: `${fmt$(roi.estimatedTotalRebateMin)}–${fmt$(roi.estimatedTotalRebateMax)}`, color: "#7c3aed", icon: <Award size={11} /> },
        ].map((stat) => (
          <div key={stat.label} className="px-4 py-4 border-r border-[#e5e7eb] last:border-r-0">
            <div className="text-[9px] tracking-[0.18em] uppercase mb-2 flex items-center gap-1" style={{ ...mono, color: "#9ca3af" }}>
              <span style={{ color: stat.color }}>{stat.icon}</span> {stat.label}
            </div>
            <div className="mb-1" style={{ fontSize: "22px", fontWeight: 700, color: stat.color, ...mono }}>
              {stat.value}
            </div>
            <div className="text-[10px]" style={{ color: "#9ca3af" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Energy cost comparison bar chart */}
      <div>
        <div className="flex items-center gap-3 px-4 py-2.5 border border-b-0 border-[#e5e7eb]" style={{ background: "#f9fafb" }}>
          <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
            Annual Energy Cost Comparison
          </span>
        </div>
        <div className="border border-[#e5e7eb] p-6" style={{ background: "#ffffff" }}>
          <div className="space-y-4">
            {/* Current */}
            <div className="flex items-center gap-4">
              <span className="text-[10px] w-24 text-right flex-shrink-0" style={{ ...mono, color: "#6b7280" }}>CURRENT</span>
              <div className="flex-1 h-8 relative" style={{ background: "#fef2f2" }}>
                <div
                  className="h-full flex items-center justify-end px-3"
                  style={{
                    width: "100%",
                    background: "#dc2626",
                  }}
                >
                  <span className="text-[11px] text-white" style={mono}>{fmt$(roi.totalAnnualCostCurrent)}/yr</span>
                </div>
              </div>
            </div>
            {/* After compliance */}
            <div className="flex items-center gap-4">
              <span className="text-[10px] w-24 text-right flex-shrink-0" style={{ ...mono, color: "#6b7280" }}>COMPLIANT</span>
              <div className="flex-1 h-8 relative" style={{ background: "#f0fdf4" }}>
                <div
                  className="h-full flex items-center justify-end px-3"
                  style={{
                    width: roi.totalAnnualCostCurrent > 0
                      ? `${Math.max(10, (roi.totalAnnualCostReplacement / roi.totalAnnualCostCurrent) * 100)}%`
                      : "10%",
                    background: "#16a34a",
                  }}
                >
                  <span className="text-[11px] text-white" style={mono}>{fmt$(roi.totalAnnualCostReplacement)}/yr</span>
                </div>
              </div>
            </div>
            {/* Savings delta */}
            <div className="flex items-center gap-4">
              <span className="text-[10px] w-24 text-right flex-shrink-0" style={{ ...mono, color: "#16a34a", fontWeight: 600 }}>SAVINGS</span>
              <div className="flex-1 h-8 relative border border-dashed border-[#86efac]" style={{ background: "#f0fdf4" }}>
                <div
                  className="h-full flex items-center px-3"
                  style={{
                    width: roi.totalAnnualCostCurrent > 0
                      ? `${Math.max(10, (roi.totalAnnualSavings / roi.totalAnnualCostCurrent) * 100)}%`
                      : "10%",
                    background: "rgba(22,163,74,0.15)",
                  }}
                >
                  <span className="text-[11px]" style={{ ...mono, color: "#16a34a", fontWeight: 600 }}>
                    {fmt$(roi.totalAnnualSavings)}/yr
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-fixture breakdown table */}
      <div>
        <div className="flex items-center justify-between px-4 py-2.5 border border-b-0 border-[#e5e7eb]" style={{ background: "#f9fafb" }}>
          <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
            Per-Fixture Cost Breakdown
          </span>
          <span className="text-[10px]" style={{ ...mono, color: "#9ca3af" }}>
            {roi.failingFixtures} non-compliant fixture(s)
          </span>
        </div>

        <div className="border border-[#e5e7eb]" style={{ background: "#ffffff" }}>
          {/* Header */}
          <div
            className="grid border-b border-[#e5e7eb]"
            style={{ gridTemplateColumns: "1fr 100px 100px 110px 100px 100px 90px", background: "#f9fafb" }}
          >
            {["FIXTURE", "CURRENT W", "REPL. W", "REPL. COST", "SAVINGS/YR", "PAYBACK", "REBATE"].map((h) => (
              <div
                key={h}
                className="px-3 py-2 text-[9px] tracking-[0.15em] uppercase overflow-hidden"
                style={{ ...mono, color: "#6b7280", borderRight: "1px solid #f0f0f2" }}
              >
                {h}
              </div>
            ))}
          </div>

          {roi.fixtureEstimates.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <AlertCircle size={24} style={{ color: "#86efac", margin: "0 auto 8px" }} />
              <p className="text-[12px]" style={{ color: "#16a34a", fontWeight: 500 }}>All fixtures are compliant!</p>
              <p className="text-[11px] mt-1" style={{ color: "#6b7280" }}>No replacement costs needed.</p>
            </div>
          ) : (
            roi.fixtureEstimates.map((est, idx) => (
              <div key={est.fixtureId}>
                <div
                  className="grid border-b border-[#f0f0f2] cursor-pointer transition-colors hover:!bg-[#f5f5fa] min-w-0"
                  style={{
                    gridTemplateColumns: "1fr 100px 100px 110px 100px 100px 90px",
                    background: idx % 2 === 0 ? "#ffffff" : "#fafafa",
                  }}
                  onClick={() => setExpandedRow(expandedRow === est.fixtureId ? null : est.fixtureId)}
                >
                  <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <div className="min-w-0">
                      <span className="text-[12px] block truncate" style={{ fontWeight: 500, color: "#1f2937" }}>
                        {est.fixtureName}
                      </span>
                      <span className="text-[10px] block truncate" style={{ color: "#9ca3af" }}>
                        {est.fixtureType} &middot; Qty {est.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[11px]" style={{ ...mono, color: "#dc2626" }}>{est.currentWattage}W</span>
                  </div>
                  <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[11px]" style={{ ...mono, color: "#16a34a" }}>{est.replacementWattage}W</span>
                  </div>
                  <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[11px]" style={{ ...mono, color: "#1f2937" }}>{fmt$(est.replacementCostAvg)}</span>
                  </div>
                  <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[11px]" style={{ ...mono, color: "#16a34a", fontWeight: 600 }}>{fmt$(est.annualSavings)}</span>
                  </div>
                  <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[11px]" style={{ ...mono, color: est.paybackYears && est.paybackYears < 5 ? "#16a34a" : "#d97706" }}>
                      {est.paybackYears ? `${est.paybackYears} yr` : "—"}
                    </span>
                  </div>
                  <div className="px-3 py-3 flex items-center overflow-hidden">
                    {est.dlcListed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] tracking-wider uppercase border whitespace-nowrap"
                        style={{ ...mono, color: "#7c3aed", background: "#f5f3ff", borderColor: "#c4b5fd" }}>
                        <Award size={8} /> DLC
                      </span>
                    ) : (
                      <span className="text-[10px]" style={{ color: "#9ca3af" }}>—</span>
                    )}
                  </div>
                </div>

                {/* Expanded detail row */}
                {expandedRow === est.fixtureId && (
                  <div className="border-b border-[#e5e7eb] px-6 py-4" style={{ background: "#fafafa" }}>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: "#9ca3af" }}>COST RANGE</div>
                        <p className="text-[11px]" style={{ color: "#4b5563" }}>
                          {fmt$(est.replacementCostMin)} – {fmt$(est.replacementCostMax)} (avg {fmt$(est.replacementCostAvg)})
                        </p>
                      </div>
                      <div>
                        <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: "#9ca3af" }}>ENERGY</div>
                        <p className="text-[11px]" style={{ color: "#4b5563" }}>
                          Current: {est.annualEnergyCurrent.toFixed(0)} kWh/yr &rarr; {est.annualEnergyReplacement.toFixed(0)} kWh/yr
                        </p>
                        <p className="text-[11px]" style={{ color: "#16a34a" }}>
                          Saves {est.annualEnergySavings.toFixed(0)} kWh/yr
                        </p>
                      </div>
                      <div>
                        {est.dlcListed && (
                          <>
                            <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: "#9ca3af" }}>REBATE ESTIMATE</div>
                            <p className="text-[11px]" style={{ color: "#7c3aed" }}>
                              {fmt$(est.estimatedRebateMin)} – {fmt$(est.estimatedRebateMax)}
                            </p>
                            <p className="text-[10px] mt-1" style={{ color: "#6b7280" }}>
                              This fixture qualifies for utility rebates in most jurisdictions — typical rebate: $20-50/fixture
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pricing reference table */}
      <div>
        <div className="flex items-center gap-3 px-4 py-2.5 border border-b-0 border-[#e5e7eb]" style={{ background: "#f9fafb" }}>
          <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
            Reference: Fixture Pricing Database
          </span>
          <span className="text-[10px]" style={{ ...mono, color: "#9ca3af" }}>
            {Object.keys(FIXTURE_PRICING_DB).length} fixture types
          </span>
        </div>
        <div className="border border-[#e5e7eb] overflow-hidden" style={{ background: "#ffffff" }}>
          <div className="grid border-b border-[#e5e7eb]"
            style={{ gridTemplateColumns: "1fr 90px 90px 90px 80px 80px", background: "#f9fafb" }}>
            {["FIXTURE TYPE", "MIN $", "MAX $", "AVG $", "REPL. W", "DLC"].map((h) => (
              <div key={h} className="px-3 py-2 text-[9px] tracking-[0.15em] uppercase overflow-hidden"
                style={{ ...mono, color: "#6b7280", borderRight: "1px solid #f0f0f2" }}>{h}</div>
            ))}
          </div>
          {Object.values(FIXTURE_PRICING_DB).map((p, idx) => (
            <div key={p.fixtureType}
              className="grid border-b border-[#f0f0f2]"
              style={{ gridTemplateColumns: "1fr 90px 90px 90px 80px 80px", background: idx % 2 === 0 ? "#ffffff" : "#fafafa" }}>
              <div className="px-3 py-2 overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                <span className="text-[11px]" style={{ color: "#1f2937" }}>{p.fixtureType}</span>
              </div>
              <div className="px-3 py-2 overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                <span className="text-[10px]" style={{ ...mono, color: "#6b7280" }}>${p.minPrice}</span>
              </div>
              <div className="px-3 py-2 overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                <span className="text-[10px]" style={{ ...mono, color: "#6b7280" }}>${p.maxPrice}</span>
              </div>
              <div className="px-3 py-2 overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                <span className="text-[10px]" style={{ ...mono, color: "#1f2937", fontWeight: 500 }}>${p.avgPrice}</span>
              </div>
              <div className="px-3 py-2 overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                <span className="text-[10px]" style={{ ...mono, color: "#6b7280" }}>{p.typicalWattage}W</span>
              </div>
              <div className="px-3 py-2 overflow-hidden">
                {p.dlcListed ? (
                  <span className="text-[9px] px-1.5 py-0.5 border" style={{ ...mono, color: "#7c3aed", background: "#f5f3ff", borderColor: "#c4b5fd" }}>YES</span>
                ) : (
                  <span className="text-[9px]" style={{ color: "#9ca3af" }}>NO</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border border-[#e5dfd0]" style={{ background: "#fdfcf8" }}>
        <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: "#92800a" }}>
          Rate: ${utilityRate}/kWh &middot; {annualHours.toLocaleString()} hrs/yr &middot; Pricing: 2024-2025 commercial LED
        </span>
        <span className="text-[9px]" style={{ ...mono, color: "#a0903a" }}>
          DLC QPL fixtures eligible for utility rebates ($20-50/unit typical)
        </span>
      </div>
    </div>
  )
}
