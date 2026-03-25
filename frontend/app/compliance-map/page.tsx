"use client"

import { useMemo, useState } from "react"
import { ChevronRight, Grid3X3, BarChart3 } from "lucide-react"
import { sampleFixtures } from "../../lib/compliance/sampleData"
import { evaluateFixture, computeComplianceScore } from "../../lib/compliance/engine"
import { findLpdAllowance } from "../../lib/compliance/standards"
import { colors, mono, scoreColor } from "../../lib/designTokens"
import type { StatusKey } from "../../lib/designTokens"
import type { ComplianceStatus, Fixture, FixtureEvaluation } from "../../lib/compliance/types"
import PageHeader from "../../components/PageHeader"
import StatCard from "../../components/StatCard"
import SectionHeader from "../../components/SectionHeader"
import FooterBar from "../../components/FooterBar"
import StatusBadge from "../../components/StatusBadge"
import ScoreBar from "../../components/ScoreBar"

interface ZoneData {
  spaceType: string
  fixtures: { fixture: Fixture; evaluation: FixtureEvaluation; score: number }[]
  totalWattage: number
  totalArea: number
  calculatedLpd: number | null
  allowedLpd: number | null
  overallStatus: ComplianceStatus
  passCount: number
  failCount: number
  avgScore: number
}

export default function ComplianceMapPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "heatmap">("grid")
  const [expandAll, setExpandAll] = useState(false)

  const zones = useMemo(() => {
    const bySpace: Record<string, ZoneData> = {}

    for (const fx of sampleFixtures) {
      const ev = evaluateFixture(fx)
      const score = computeComplianceScore(ev.results)
      const key = fx.spaceType || "Unassigned"

      if (!bySpace[key]) {
        bySpace[key] = {
          spaceType: key, fixtures: [], totalWattage: 0, totalArea: 0,
          calculatedLpd: null, allowedLpd: null, overallStatus: "pass",
          passCount: 0, failCount: 0, avgScore: 0,
        }
      }

      bySpace[key].fixtures.push({ fixture: fx, evaluation: ev, score })
      bySpace[key].totalWattage += (fx.wattage || 0) * (fx.quantity || 1)
      bySpace[key].totalArea = Math.max(bySpace[key].totalArea, fx.spaceArea || 0)
    }

    for (const zone of Object.values(bySpace)) {
      if (zone.totalArea > 0) zone.calculatedLpd = Math.round((zone.totalWattage / zone.totalArea) * 1000) / 1000
      const allowance = findLpdAllowance("ASHRAE_90_1_2022", zone.spaceType)
      zone.allowedLpd = allowance ? allowance.allowedLpd : null
      zone.passCount = zone.fixtures.filter((f) => f.evaluation.overallStatus === "pass").length
      zone.failCount = zone.fixtures.filter((f) => f.evaluation.overallStatus === "fail").length
      zone.avgScore = zone.fixtures.length > 0
        ? Math.round(zone.fixtures.reduce((a, f) => a + f.score, 0) / zone.fixtures.length)
        : 0

      if (zone.fixtures.some((f) => f.evaluation.overallStatus === "fail")) zone.overallStatus = "fail"
      else if (zone.fixtures.every((f) => f.evaluation.overallStatus === "exempt")) zone.overallStatus = "exempt"
      else if (zone.fixtures.some((f) => f.evaluation.overallStatus === "data_error")) zone.overallStatus = "data_error"
      else zone.overallStatus = "pass"
    }

    return Object.values(bySpace).sort((a, b) => {
      const order: ComplianceStatus[] = ["fail", "data_error", "exempt", "pass"]
      return order.indexOf(a.overallStatus) - order.indexOf(b.overallStatus)
    })
  }, [])

  const selectedZoneData = zones.find((z) => z.spaceType === selectedZone)

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <PageHeader
        module="Spatial Compliance"
        title="Compliance Map"
        subtitle="Site-wide compliance posture at a glance — zone-level LPD aggregation with color-coded status"
        actions={
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-3 py-2 text-[10px] tracking-widest uppercase border"
              style={{
                ...mono,
                background: viewMode === "grid" ? colors.maroon[100] : colors.bg.panel,
                borderColor: viewMode === "grid" ? colors.maroon[700] : colors.border.default,
                color: viewMode === "grid" ? colors.maroon[800] : colors.text.tertiary,
              }}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 size={11} /> Grid
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 text-[10px] tracking-widest uppercase border"
              style={{
                ...mono,
                background: viewMode === "heatmap" ? colors.maroon[100] : colors.bg.panel,
                borderColor: viewMode === "heatmap" ? colors.maroon[700] : colors.border.default,
                color: viewMode === "heatmap" ? colors.maroon[800] : colors.text.tertiary,
              }}
              onClick={() => setViewMode("heatmap")}
            >
              <BarChart3 size={11} /> Heatmap
            </button>
            <button
              className="px-3 py-2 text-[10px] tracking-widest uppercase border"
              style={{
                ...mono,
                background: expandAll ? colors.maroon[100] : colors.bg.panel,
                borderColor: expandAll ? colors.maroon[700] : colors.border.default,
                color: expandAll ? colors.maroon[800] : colors.text.tertiary,
              }}
              onClick={() => { setExpandAll(!expandAll); setSelectedZone(null) }}
            >
              {expandAll ? "Collapse All" : "Expand All"}
            </button>
          </div>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-4 border" style={{ borderColor: colors.border.default, background: colors.bg.panel }}>
        <StatCard label="Zones" value={zones.length} color={colors.text.tertiary} />
        <StatCard label="Compliant" value={zones.filter((z) => z.overallStatus === "pass").length} color={colors.pass.fg} />
        <StatCard label="Non-Compliant" value={zones.filter((z) => z.overallStatus === "fail").length} color={colors.fail.fg} />
        <StatCard label="Avg Score" value={`${zones.length > 0 ? Math.round(zones.reduce((a, z) => a + z.avgScore, 0) / zones.length) : 0}%`} color={colors.exempt.fg} />
      </div>

      {/* Zone summary table */}
      <div>
        <SectionHeader title="Zone Summary" right={`${zones.length} zones`} />
        <div className="border border-t-0" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
          <div className="grid border-b" style={{ gridTemplateColumns: "1fr 80px 80px 100px 100px 100px", background: colors.bg.panel, borderColor: colors.border.default }}>
            {["ZONE / SPACE TYPE", "FIXTURES", "AVG SCORE", "CALC. LPD", "ALLOWED LPD", "STATUS"].map((h) => (
              <div key={h} className="px-3 py-2 text-[9px] tracking-[0.15em] uppercase" style={{ ...mono, color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>{h}</div>
            ))}
          </div>
          {zones.map((zone, idx) => (
            <div key={zone.spaceType} className="grid border-b cursor-pointer transition-colors hover:!bg-[#f5f5fa]"
              style={{ gridTemplateColumns: "1fr 80px 80px 100px 100px 100px", background: idx % 2 === 0 ? colors.bg.page : colors.bg.alt, borderColor: colors.border.light }}
              onClick={() => setSelectedZone(selectedZone === zone.spaceType ? null : zone.spaceType)}
            >
              <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                <span className="text-[11px] truncate" style={{ fontWeight: 500, color: colors.text.primary }}>{zone.spaceType}</span>
              </div>
              <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                <span className="text-[11px]" style={{ ...mono, color: colors.text.secondary }}>{zone.fixtures.length}</span>
              </div>
              <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                <ScoreBar score={zone.avgScore} />
              </div>
              <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                <span className="text-[10px]" style={{
                  ...mono,
                  color: zone.calculatedLpd !== null && zone.allowedLpd !== null && zone.calculatedLpd > zone.allowedLpd ? colors.fail.fg : colors.text.secondary,
                }}>
                  {zone.calculatedLpd !== null ? `${zone.calculatedLpd.toFixed(3)} W/ft²` : "—"}
                </span>
              </div>
              <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                <span className="text-[10px]" style={{ ...mono, color: colors.text.tertiary }}>
                  {zone.allowedLpd !== null ? `${zone.allowedLpd.toFixed(2)} W/ft²` : "—"}
                </span>
              </div>
              <div className="px-3 py-2.5 flex items-center overflow-hidden">
                <StatusBadge status={zone.overallStatus as StatusKey} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone cards / heatmap */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-3 gap-4">
          {zones.map((zone) => {
            const isSelected = selectedZone === zone.spaceType || expandAll
            const statusCfg = { pass: colors.pass, fail: colors.fail, exempt: colors.exempt, data_error: colors.dataError }[zone.overallStatus]
            return (
              <div
                key={zone.spaceType}
                className="border cursor-pointer transition-all"
                style={{
                  borderColor: isSelected ? statusCfg.fg : colors.border.default,
                  borderWidth: isSelected ? "2px" : "1px",
                  background: isSelected ? statusCfg.bg : colors.bg.page,
                }}
                onClick={() => setSelectedZone(isSelected && !expandAll ? null : zone.spaceType)}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: isSelected ? statusCfg.border : colors.border.light, background: colors.bg.panel }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ fontWeight: 600, color: colors.text.primary }}>{zone.spaceType}</span>
                    <StatusBadge status={zone.overallStatus as StatusKey} />
                  </div>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[8px] tracking-widest uppercase" style={{ ...mono, color: colors.text.muted }}>FIXTURES</div>
                      <div className="text-[14px]" style={{ ...mono, fontWeight: 600, color: colors.text.primary }}>{zone.fixtures.length}</div>
                    </div>
                    <div>
                      <div className="text-[8px] tracking-widest uppercase" style={{ ...mono, color: colors.text.muted }}>AVG SCORE</div>
                      <div className="text-[14px]" style={{ ...mono, fontWeight: 600, color: scoreColor(zone.avgScore) }}>{zone.avgScore}%</div>
                    </div>
                  </div>
                  {/* Mini progress bar */}
                  <div className="w-full h-1.5" style={{ background: colors.border.default }}>
                    <div className="h-full transition-all" style={{ width: `${zone.avgScore}%`, background: scoreColor(zone.avgScore) }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[8px] tracking-widest uppercase" style={{ ...mono, color: colors.text.muted }}>TOTAL LPD</div>
                      <div className="text-[12px]" style={{
                        ...mono,
                        color: zone.calculatedLpd !== null && zone.allowedLpd !== null && zone.calculatedLpd > zone.allowedLpd ? colors.fail.fg : colors.text.primary,
                      }}>
                        {zone.calculatedLpd !== null ? `${zone.calculatedLpd.toFixed(3)} W/ft²` : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] tracking-widest uppercase" style={{ ...mono, color: colors.text.muted }}>ALLOWED</div>
                      <div className="text-[12px]" style={{ ...mono, color: colors.text.tertiary }}>
                        {zone.allowedLpd !== null ? `${zone.allowedLpd.toFixed(2)} W/ft²` : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px]" style={{ color: colors.pass.fg }}>{zone.passCount} pass</span>
                    <span className="text-[9px]" style={{ color: colors.fail.fg }}>{zone.failCount} fail</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="border" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
          <div className="px-4 py-2 border-b" style={{ borderColor: colors.border.default, background: colors.bg.panel }}>
            <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: colors.text.tertiary }}>
              Compliance Heatmap — Score by Zone
            </span>
          </div>
          <div className="p-4">
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(zones.length, 4)}, 1fr)` }}>
              {zones.map((zone) => (
                <div
                  key={zone.spaceType}
                  className="cursor-pointer transition-all border p-3"
                  style={{
                    background: `${scoreColor(zone.avgScore)}15`,
                    borderColor: selectedZone === zone.spaceType ? scoreColor(zone.avgScore) : `${scoreColor(zone.avgScore)}40`,
                    borderWidth: selectedZone === zone.spaceType ? "2px" : "1px",
                  }}
                  onClick={() => setSelectedZone(selectedZone === zone.spaceType ? null : zone.spaceType)}
                >
                  <div className="text-[11px] truncate" style={{ fontWeight: 500, color: colors.text.primary }}>{zone.spaceType}</div>
                  <div className="mt-2 flex items-end justify-between">
                    <div style={{ fontSize: "28px", fontWeight: 700, color: scoreColor(zone.avgScore), ...mono }}>{zone.avgScore}%</div>
                    <div className="text-right">
                      <div className="text-[9px]" style={{ ...mono, color: colors.text.tertiary }}>{zone.fixtures.length} fixtures</div>
                      <div className="text-[9px]" style={{ ...mono, color: colors.text.tertiary }}>{zone.totalWattage}W total</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full" style={{ background: colors.border.default }}>
                    <div className="h-full" style={{ width: `${zone.avgScore}%`, background: scoreColor(zone.avgScore) }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: colors.border.default }}>
              <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: colors.text.muted }}>LEGEND:</span>
              {[
                { label: "0-20%", color: colors.chart.red },
                { label: "20-40%", color: colors.chart.orange },
                { label: "40-60%", color: colors.chart.amber },
                { label: "60-80%", color: colors.chart.lime },
                { label: "80-100%", color: colors.chart.green },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-3 h-3" style={{ background: l.color }} />
                  <span className="text-[9px]" style={{ ...mono, color: colors.text.tertiary }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expanded zone detail */}
      {selectedZoneData && (
        <div>
          <SectionHeader title={`Zone Detail: ${selectedZoneData.spaceType}`} right={`${selectedZoneData.fixtures.length} fixtures`} />
          <div className="border border-t-0" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
            <div className="grid border-b" style={{ gridTemplateColumns: "1fr 90px 90px 80px 100px 100px", background: colors.bg.panel, borderColor: colors.border.default }}>
              {["FIXTURE", "WATTAGE", "LUMENS", "SCORE", "LPD", "STATUS"].map((h) => (
                <div key={h} className="px-3 py-2 text-[9px] tracking-[0.15em] uppercase whitespace-nowrap" style={{ ...mono, color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>{h}</div>
              ))}
            </div>
            {selectedZoneData.fixtures.map((item, idx) => {
              const fx = item.fixture
              const ev = item.evaluation
              const lpdVal = fx.spaceArea && fx.spaceArea > 0 ? ((fx.wattage || 0) * (fx.quantity || 1)) / fx.spaceArea : null
              return (
                <div key={fx.id} className="grid border-b min-w-0"
                  style={{ gridTemplateColumns: "1fr 90px 90px 80px 100px 100px", background: idx % 2 === 0 ? colors.bg.page : colors.bg.alt, borderColor: colors.border.light }}>
                  <div className="px-3 py-2.5 overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <div className="text-[11px] truncate" style={{ fontWeight: 500, color: colors.text.primary }}>{fx.fixtureName}</div>
                    <div className="text-[9px] truncate" style={{ color: colors.text.muted }}>{fx.fixtureType} &middot; Qty {fx.quantity}</div>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[10px]" style={{ ...mono, color: colors.text.secondary }}>{fx.wattage}W</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[10px]" style={{ ...mono, color: colors.text.secondary }}>{fx.lumenOutput} lm</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <ScoreBar score={item.score} />
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[10px]" style={{ ...mono, color: colors.text.tertiary }}>
                      {lpdVal !== null ? `${lpdVal.toFixed(3)} W/ft²` : "—"}
                    </span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden">
                    <StatusBadge status={ev.overallStatus as StatusKey} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <FooterBar
        left="Zone-level LPD = sum(fixture wattage x qty) / zone area"
        right="LPD allowances per ASHRAE 90.1-2022 Table 9.6.1"
      />
    </div>
  )
}
