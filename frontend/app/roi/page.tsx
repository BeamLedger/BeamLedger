"use client"

import { useMemo, useState } from "react"
import {
  DollarSign, TrendingDown, Clock, Zap, Award, AlertCircle,
  Settings2, Printer, ShieldAlert,
} from "lucide-react"
import { sampleFixtures } from "../../lib/compliance/sampleData"
import { evaluateFixture, computeComplianceScore } from "../../lib/compliance/engine"
import {
  calculateSiteROI, FIXTURE_PRICING_DB,
  DEFAULT_UTILITY_RATE, DEFAULT_ANNUAL_HOURS,
} from "../../lib/compliance/costEstimator"
import { colors, mono } from "../../lib/designTokens"
import PageHeader from "../../components/PageHeader"
import StatCard from "../../components/StatCard"
import SectionHeader from "../../components/SectionHeader"
import FooterBar from "../../components/FooterBar"

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

  // Cost of non-compliance estimates
  const dailyPenalty = 250
  const avgDaysToRemediate = 90
  const potentialFines = roi.failingFixtures * dailyPenalty * avgDaysToRemediate
  const auditFailureCost = roi.failingFixtures > 0 ? 15000 : 0

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <PageHeader
        module="Financial Analysis"
        title="ROI Analysis & Cost-to-Comply"
        subtitle="Know your payback before you spend a dollar — replacement costs, energy savings, and rebate eligibility"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border transition-colors hover:opacity-90 print:hidden"
              style={{ ...mono, borderColor: colors.border.default, color: colors.text.tertiary, background: colors.bg.panel }}
            >
              <Printer size={12} /> Print
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border transition-colors print:hidden"
              style={{
                ...mono,
                background: showSettings ? colors.maroon[100] : colors.bg.panel,
                borderColor: showSettings ? colors.maroon[700] : colors.border.default,
                color: showSettings ? colors.maroon[800] : colors.text.tertiary,
              }}
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 size={12} /> Configure
            </button>
          </div>
        }
      />

      {/* Settings panel */}
      {showSettings && (
        <div className="border p-4 grid grid-cols-2 gap-6 print:hidden" style={{ borderColor: colors.border.default, background: colors.bg.alt }}>
          <div>
            <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ ...mono, color: colors.text.tertiary }}>Utility Rate ($/kWh)</label>
            <input
              type="number" step="0.01" min="0.01"
              className="w-full px-3 py-2 text-[12px] border outline-none"
              style={{ borderColor: colors.border.default, color: colors.text.primary }}
              value={utilityRate}
              onChange={(e) => setUtilityRate(Number(e.target.value) || 0.01)}
            />
          </div>
          <div>
            <label className="block text-[9px] tracking-widest uppercase mb-1.5" style={{ ...mono, color: colors.text.tertiary }}>Annual Operating Hours</label>
            <input
              type="number" step="100" min="100"
              className="w-full px-3 py-2 text-[12px] border outline-none"
              style={{ borderColor: colors.border.default, color: colors.text.primary }}
              value={annualHours}
              onChange={(e) => setAnnualHours(Number(e.target.value) || 100)}
            />
          </div>
        </div>
      )}

      {/* Pitch banner */}
      <div className="border p-4" style={{ borderColor: colors.maroon[700], background: colors.maroon[50] }}>
        <p className="text-[12px]" style={{ color: colors.maroon[800], fontWeight: 500 }}>
          Compliance in seconds, not spreadsheets.
          <span style={{ fontWeight: 400, color: colors.maroon[700] }}>
            {" "}BeamLedger identified {roi.failingFixtures} non-compliant fixture(s) out of {roi.totalFixtures} total.
            Estimated replacement investment: {fmt$(roi.totalReplacementCostAvg)} with {fmt$(roi.totalAnnualSavings)}/yr in energy savings.
          </span>
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 border" style={{ borderColor: colors.border.default, background: colors.bg.panel }}>
        <StatCard label="Replacement Cost" value={fmt$(roi.totalReplacementCostAvg)} subtitle={`${fmt$(roi.totalReplacementCostMin)} – ${fmt$(roi.totalReplacementCostMax)}`} color={colors.fail.fg} icon={<DollarSign size={11} />} />
        <StatCard label="Annual Savings" value={fmt$(roi.totalAnnualSavings)} subtitle={`${savingsPercent}% energy reduction`} color={colors.pass.fg} icon={<TrendingDown size={11} />} />
        <StatCard label="Payback Period" value={roi.avgPaybackYears ? `${roi.avgPaybackYears} yr` : "—"} subtitle="Average across all" color={colors.dataError.fg} icon={<Clock size={11} />} />
        <StatCard label="Energy Saved" value={`${fmtK(roi.totalAnnualEnergySavings)} kWh`} subtitle="Per year" color={colors.exempt.fg} icon={<Zap size={11} />} />
        <StatCard label="Rebate Eligible" value={`${roi.rebateEligibleCount}`} subtitle={`${fmt$(roi.estimatedTotalRebateMin)}–${fmt$(roi.estimatedTotalRebateMax)}`} color={colors.chart.purple} icon={<Award size={11} />} />
      </div>

      {/* Energy cost comparison */}
      <div>
        <SectionHeader title="Annual Energy Cost Comparison" />
        <div className="border border-t-0 p-6" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] w-24 text-right flex-shrink-0" style={{ ...mono, color: colors.text.tertiary }}>CURRENT</span>
              <div className="flex-1 h-8 relative" style={{ background: colors.fail.bg }}>
                <div className="h-full flex items-center justify-end px-3" style={{ width: "100%", background: colors.fail.fg }}>
                  <span className="text-[11px] text-white" style={mono}>{fmt$(roi.totalAnnualCostCurrent)}/yr</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] w-24 text-right flex-shrink-0" style={{ ...mono, color: colors.text.tertiary }}>COMPLIANT</span>
              <div className="flex-1 h-8 relative" style={{ background: colors.pass.bg }}>
                <div
                  className="h-full flex items-center justify-end px-3"
                  style={{
                    width: roi.totalAnnualCostCurrent > 0 ? `${Math.max(10, (roi.totalAnnualCostReplacement / roi.totalAnnualCostCurrent) * 100)}%` : "10%",
                    background: colors.pass.fg,
                  }}
                >
                  <span className="text-[11px] text-white" style={mono}>{fmt$(roi.totalAnnualCostReplacement)}/yr</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] w-24 text-right flex-shrink-0" style={{ ...mono, color: colors.pass.fg, fontWeight: 600 }}>SAVINGS</span>
              <div className="flex-1 h-8 relative border border-dashed" style={{ borderColor: colors.pass.border, background: colors.pass.bg }}>
                <div
                  className="h-full flex items-center px-3"
                  style={{
                    width: roi.totalAnnualCostCurrent > 0 ? `${Math.max(10, (roi.totalAnnualSavings / roi.totalAnnualCostCurrent) * 100)}%` : "10%",
                    background: "rgba(22,163,74,0.15)",
                  }}
                >
                  <span className="text-[11px]" style={{ ...mono, color: colors.pass.fg, fontWeight: 600 }}>{fmt$(roi.totalAnnualSavings)}/yr</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost of Non-Compliance */}
      {roi.failingFixtures > 0 && (
        <div>
          <SectionHeader title="Cost of Non-Compliance" right="Risk exposure estimate" />
          <div className="border border-t-0 p-5" style={{ borderColor: colors.border.default, background: colors.fail.bg }}>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-[9px] tracking-widest uppercase mb-1.5 flex items-center gap-1" style={{ ...mono, color: colors.fail.fg }}>
                  <ShieldAlert size={10} /> Potential Fines
                </div>
                <div className="text-[20px] mb-1" style={{ fontWeight: 700, color: colors.fail.fg, ...mono }}>{fmt$(potentialFines)}</div>
                <div className="text-[10px]" style={{ color: colors.text.muted }}>
                  Based on ~${dailyPenalty}/day per violation over {avgDaysToRemediate}-day remediation
                </div>
              </div>
              <div>
                <div className="text-[9px] tracking-widest uppercase mb-1.5 flex items-center gap-1" style={{ ...mono, color: colors.dataError.fg }}>
                  <AlertCircle size={10} /> Audit Failure Cost
                </div>
                <div className="text-[20px] mb-1" style={{ fontWeight: 700, color: colors.dataError.fg, ...mono }}>{fmt$(auditFailureCost)}</div>
                <div className="text-[10px]" style={{ color: colors.text.muted }}>
                  Re-inspection fees, remediation labor, project delays
                </div>
              </div>
              <div>
                <div className="text-[9px] tracking-widest uppercase mb-1.5 flex items-center gap-1" style={{ ...mono, color: colors.maroon[700] }}>
                  <DollarSign size={10} /> Total Risk Exposure
                </div>
                <div className="text-[20px] mb-1" style={{ fontWeight: 700, color: colors.maroon[700], ...mono }}>{fmt$(potentialFines + auditFailureCost)}</div>
                <div className="text-[10px]" style={{ color: colors.text.muted }}>
                  vs {fmt$(roi.totalReplacementCostAvg)} to achieve compliance now
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-fixture breakdown */}
      <div>
        <SectionHeader title="Per-Fixture Cost Breakdown" right={`${roi.failingFixtures} non-compliant fixture(s)`} />
        <div className="border border-t-0" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
          <div className="grid border-b" style={{ gridTemplateColumns: "1fr 100px 100px 110px 100px 100px 90px", background: colors.bg.panel, borderColor: colors.border.default }}>
            {["FIXTURE", "CURRENT W", "REPL. W", "REPL. COST", "SAVINGS/YR", "PAYBACK", "REBATE"].map((h) => (
              <div key={h} className="px-3 py-2 text-[9px] tracking-[0.15em] uppercase whitespace-nowrap" style={{ ...mono, color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>{h}</div>
            ))}
          </div>

          {roi.fixtureEstimates.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <AlertCircle size={24} style={{ color: colors.pass.border, margin: "0 auto 8px" }} />
              <p className="text-[12px]" style={{ color: colors.pass.fg, fontWeight: 500 }}>All fixtures are compliant!</p>
              <p className="text-[11px] mt-1" style={{ color: colors.text.tertiary }}>No replacement costs needed.</p>
            </div>
          ) : (
            roi.fixtureEstimates.map((est, idx) => (
              <div key={est.fixtureId}>
                <div
                  className="grid border-b cursor-pointer transition-colors hover:!bg-[#f5f5fa] min-w-0"
                  style={{
                    gridTemplateColumns: "1fr 100px 100px 110px 100px 100px 90px",
                    background: idx % 2 === 0 ? colors.bg.page : colors.bg.alt,
                    borderColor: colors.border.light,
                  }}
                  onClick={() => setExpandedRow(expandedRow === est.fixtureId ? null : est.fixtureId)}
                >
                  <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <div className="min-w-0">
                      <span className="text-[12px] block truncate" style={{ fontWeight: 500, color: colors.text.primary }}>{est.fixtureName}</span>
                      <span className="text-[10px] block truncate" style={{ color: colors.text.muted }}>{est.fixtureType} &middot; Qty {est.quantity}</span>
                    </div>
                  </div>
                  <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[11px]" style={{ ...mono, color: colors.fail.fg }}>{est.currentWattage}W</span>
                  </div>
                  <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[11px]" style={{ ...mono, color: colors.pass.fg }}>{est.replacementWattage}W</span>
                  </div>
                  <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[11px]" style={{ ...mono, color: colors.text.primary }}>{fmt$(est.replacementCostAvg)}</span>
                  </div>
                  <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[11px]" style={{ ...mono, color: colors.pass.fg, fontWeight: 600 }}>{fmt$(est.annualSavings)}</span>
                  </div>
                  <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[11px]" style={{ ...mono, color: est.paybackYears && est.paybackYears < 5 ? colors.pass.fg : colors.dataError.fg }}>
                      {est.paybackYears ? `${est.paybackYears} yr` : "—"}
                    </span>
                  </div>
                  <div className="px-3 py-3 flex items-center overflow-hidden">
                    {est.dlcListed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] tracking-wider uppercase border whitespace-nowrap"
                        style={{ ...mono, color: colors.chart.purple, background: "#f5f3ff", borderColor: "#c4b5fd" }}>
                        <Award size={8} /> DLC
                      </span>
                    ) : (
                      <span className="text-[10px]" style={{ color: colors.text.muted }}>—</span>
                    )}
                  </div>
                </div>

                {expandedRow === est.fixtureId && (
                  <div className="border-b px-6 py-4" style={{ borderColor: colors.border.default, background: colors.bg.alt }}>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: colors.text.muted }}>COST RANGE</div>
                        <p className="text-[11px]" style={{ color: colors.text.secondary }}>
                          {fmt$(est.replacementCostMin)} – {fmt$(est.replacementCostMax)} (avg {fmt$(est.replacementCostAvg)})
                        </p>
                      </div>
                      <div>
                        <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: colors.text.muted }}>ENERGY</div>
                        <p className="text-[11px]" style={{ color: colors.text.secondary }}>
                          Current: {est.annualEnergyCurrent.toFixed(0)} kWh/yr &rarr; {est.annualEnergyReplacement.toFixed(0)} kWh/yr
                        </p>
                        <p className="text-[11px]" style={{ color: colors.pass.fg }}>Saves {est.annualEnergySavings.toFixed(0)} kWh/yr</p>
                      </div>
                      <div>
                        {est.dlcListed && (
                          <>
                            <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: colors.text.muted }}>REBATE ESTIMATE</div>
                            <p className="text-[11px]" style={{ color: colors.chart.purple }}>{fmt$(est.estimatedRebateMin)} – {fmt$(est.estimatedRebateMax)}</p>
                            <p className="text-[10px] mt-1" style={{ color: colors.text.tertiary }}>DLC QPL qualifies for utility rebates — typical $20-50/fixture</p>
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

      {/* Pricing reference */}
      <div>
        <SectionHeader title="Reference: Fixture Pricing Database" right={`${Object.keys(FIXTURE_PRICING_DB).length} fixture types`} />
        <div className="border border-t-0 overflow-hidden" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
          <div className="grid border-b" style={{ gridTemplateColumns: "1fr 90px 90px 90px 80px 80px", background: colors.bg.panel, borderColor: colors.border.default }}>
            {["FIXTURE TYPE", "MIN $", "MAX $", "AVG $", "REPL. W", "DLC"].map((h) => (
              <div key={h} className="px-3 py-2 text-[9px] tracking-[0.15em] uppercase whitespace-nowrap" style={{ ...mono, color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>{h}</div>
            ))}
          </div>
          {Object.values(FIXTURE_PRICING_DB).map((p, idx) => (
            <div key={p.fixtureType} className="grid border-b" style={{ gridTemplateColumns: "1fr 90px 90px 90px 80px 80px", background: idx % 2 === 0 ? colors.bg.page : colors.bg.alt, borderColor: colors.border.light }}>
              <div className="px-3 py-2 overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                <span className="text-[11px]" style={{ color: colors.text.primary }}>{p.fixtureType}</span>
              </div>
              <div className="px-3 py-2 overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                <span className="text-[10px]" style={{ ...mono, color: colors.text.tertiary }}>${p.minPrice}</span>
              </div>
              <div className="px-3 py-2 overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                <span className="text-[10px]" style={{ ...mono, color: colors.text.tertiary }}>${p.maxPrice}</span>
              </div>
              <div className="px-3 py-2 overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                <span className="text-[10px]" style={{ ...mono, color: colors.text.primary, fontWeight: 500 }}>${p.avgPrice}</span>
              </div>
              <div className="px-3 py-2 overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                <span className="text-[10px]" style={{ ...mono, color: colors.text.tertiary }}>{p.typicalWattage}W</span>
              </div>
              <div className="px-3 py-2 overflow-hidden">
                {p.dlcListed ? (
                  <span className="text-[9px] px-1.5 py-0.5 border" style={{ ...mono, color: colors.chart.purple, background: "#f5f3ff", borderColor: "#c4b5fd" }}>YES</span>
                ) : (
                  <span className="text-[9px]" style={{ color: colors.text.muted }}>NO</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <FooterBar
        left={`Rate: $${utilityRate}/kWh · ${annualHours.toLocaleString()} hrs/yr · Pricing: 2024-2025 commercial LED`}
        right="DLC QPL fixtures eligible for utility rebates ($20-50/unit typical)"
      />
    </div>
  )
}
