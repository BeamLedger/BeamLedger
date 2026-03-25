"use client"

import { useMemo, useState } from "react"
import {
  Map, CheckCircle2, XCircle, AlertCircle, ChevronRight, Zap,
  BarChart3, Grid3X3, Eye,
} from "lucide-react"
import { sampleFixtures } from "../../lib/compliance/sampleData"
import { evaluateFixture, computeComplianceScore } from "../../lib/compliance/engine"
import type { ComplianceStatus, Fixture, FixtureEvaluation } from "../../lib/compliance/types"
import { findLpdAllowance } from "../../lib/compliance/standards"

const mono = { fontFamily: "'Ubin Sans', monospace" } as const

const STATUS_CONFIG: Record<ComplianceStatus, { color: string; bg: string; border: string; label: string }> = {
  pass:       { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", label: "PASS" },
  fail:       { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", label: "FAIL" },
  exempt:     { color: "#2563eb", bg: "#eff6ff", border: "#93c5fd", label: "EXEMPT" },
  data_error: { color: "#d97706", bg: "#fffbeb", border: "#fcd34d", label: "DATA ERROR" },
}

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

  // Group fixtures by space type (as pseudo-zones) and evaluate
  const zones = useMemo(() => {
    const bySpace: Record<string, ZoneData> = {}

    for (const fx of sampleFixtures) {
      const ev = evaluateFixture(fx)
      const score = computeComplianceScore(ev.results)
      const key = fx.spaceType || "Unassigned"

      if (!bySpace[key]) {
        bySpace[key] = {
          spaceType: key,
          fixtures: [],
          totalWattage: 0,
          totalArea: 0,
          calculatedLpd: null,
          allowedLpd: null,
          overallStatus: "pass",
          passCount: 0,
          failCount: 0,
          avgScore: 0,
        }
      }

      bySpace[key].fixtures.push({ fixture: fx, evaluation: ev, score })
      bySpace[key].totalWattage += (fx.wattage || 0) * (fx.quantity || 1)
      bySpace[key].totalArea = Math.max(bySpace[key].totalArea, fx.spaceArea || 0)
    }

    // Calculate per-zone aggregates
    for (const zone of Object.values(bySpace)) {
      // LPD
      if (zone.totalArea > 0) {
        zone.calculatedLpd = Math.round((zone.totalWattage / zone.totalArea) * 1000) / 1000
      }
      // Allowed LPD (check ASHRAE first)
      const allowance = findLpdAllowance("ASHRAE_90_1_2022", zone.spaceType)
      zone.allowedLpd = allowance ? allowance.allowedLpd : null

      // Status counts
      zone.passCount = zone.fixtures.filter((f) => f.evaluation.overallStatus === "pass").length
      zone.failCount = zone.fixtures.filter((f) => f.evaluation.overallStatus === "fail").length
      zone.avgScore = zone.fixtures.length > 0
        ? Math.round(zone.fixtures.reduce((a, f) => a + f.score, 0) / zone.fixtures.length)
        : 0

      // Overall zone status
      if (zone.fixtures.some((f) => f.evaluation.overallStatus === "fail")) {
        zone.overallStatus = "fail"
      } else if (zone.fixtures.every((f) => f.evaluation.overallStatus === "exempt")) {
        zone.overallStatus = "exempt"
      } else if (zone.fixtures.some((f) => f.evaluation.overallStatus === "data_error")) {
        zone.overallStatus = "data_error"
      } else {
        zone.overallStatus = "pass"
      }
    }

    return Object.values(bySpace).sort((a, b) => {
      const order: ComplianceStatus[] = ["fail", "data_error", "exempt", "pass"]
      return order.indexOf(a.overallStatus) - order.indexOf(b.overallStatus)
    })
  }, [])

  const selectedZoneData = zones.find((z) => z.spaceType === selectedZone)

  // Heatmap color based on score
  function heatColor(score: number): string {
    if (score >= 80) return "#16a34a"
    if (score >= 60) return "#65a30d"
    if (score >= 40) return "#d97706"
    if (score >= 20) return "#ea580c"
    return "#dc2626"
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#e5e7eb] pb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ ...mono, color: "#6b7280" }}>
            Module: Spatial Compliance
          </p>
          <h1 className="tracking-tight" style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937" }}>
            Compliance Map
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
            Site-wide compliance posture at a glance — zone-level LPD aggregation with color-coded status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 text-[10px] tracking-widest uppercase border"
            style={{
              ...mono,
              background: viewMode === "grid" ? "rgba(127,29,29,0.08)" : "#f9fafb",
              borderColor: viewMode === "grid" ? "#991b1b" : "#e5e7eb",
              color: viewMode === "grid" ? "#7f1d1d" : "#6b7280",
            }}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 size={11} /> Grid
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 text-[10px] tracking-widest uppercase border"
            style={{
              ...mono,
              background: viewMode === "heatmap" ? "rgba(127,29,29,0.08)" : "#f9fafb",
              borderColor: viewMode === "heatmap" ? "#991b1b" : "#e5e7eb",
              color: viewMode === "heatmap" ? "#7f1d1d" : "#6b7280",
            }}
            onClick={() => setViewMode("heatmap")}
          >
            <BarChart3 size={11} /> Heatmap
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 border border-[#e5e7eb]" style={{ background: "#f9fafb" }}>
        {[
          { label: "ZONES", value: zones.length, color: "#6b7280" },
          { label: "COMPLIANT", value: zones.filter((z) => z.overallStatus === "pass").length, color: "#16a34a" },
          { label: "NON-COMPLIANT", value: zones.filter((z) => z.overallStatus === "fail").length, color: "#dc2626" },
          { label: "AVG SCORE", value: `${zones.length > 0 ? Math.round(zones.reduce((a, z) => a + z.avgScore, 0) / zones.length) : 0}%`, color: "#2563eb" },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3 border-r border-[#e5e7eb] last:border-r-0">
            <div className="text-[9px] tracking-widest uppercase mb-1" style={{ ...mono, color: "#9ca3af" }}>{s.label}</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: s.color, ...mono }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Zone cards / heatmap */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-3 gap-4">
          {zones.map((zone) => {
            const cfg = STATUS_CONFIG[zone.overallStatus]
            const isSelected = selectedZone === zone.spaceType
            return (
              <div
                key={zone.spaceType}
                className="border cursor-pointer transition-all"
                style={{
                  borderColor: isSelected ? cfg.color : "#e5e7eb",
                  borderWidth: isSelected ? "2px" : "1px",
                  background: isSelected ? cfg.bg : "#ffffff",
                }}
                onClick={() => setSelectedZone(isSelected ? null : zone.spaceType)}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: isSelected ? cfg.border : "#f0f0f2", background: "#f9fafb" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ fontWeight: 600, color: "#1f2937" }}>{zone.spaceType}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] tracking-wider uppercase border whitespace-nowrap"
                      style={{ ...mono, color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[8px] tracking-widest uppercase" style={{ ...mono, color: "#9ca3af" }}>FIXTURES</div>
                      <div className="text-[14px]" style={{ ...mono, fontWeight: 600, color: "#1f2937" }}>{zone.fixtures.length}</div>
                    </div>
                    <div>
                      <div className="text-[8px] tracking-widest uppercase" style={{ ...mono, color: "#9ca3af" }}>AVG SCORE</div>
                      <div className="text-[14px]" style={{ ...mono, fontWeight: 600, color: heatColor(zone.avgScore) }}>{zone.avgScore}%</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[8px] tracking-widest uppercase" style={{ ...mono, color: "#9ca3af" }}>TOTAL LPD</div>
                      <div className="text-[12px]" style={{ ...mono, color: zone.calculatedLpd !== null && zone.allowedLpd !== null && zone.calculatedLpd > zone.allowedLpd ? "#dc2626" : "#1f2937" }}>
                        {zone.calculatedLpd !== null ? `${zone.calculatedLpd.toFixed(3)} W/ft²` : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] tracking-widest uppercase" style={{ ...mono, color: "#9ca3af" }}>ALLOWED</div>
                      <div className="text-[12px]" style={{ ...mono, color: "#6b7280" }}>
                        {zone.allowedLpd !== null ? `${zone.allowedLpd.toFixed(2)} W/ft²` : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px]" style={{ color: "#16a34a" }}>{zone.passCount} pass</span>
                    <span className="text-[9px]" style={{ color: "#dc2626" }}>{zone.failCount} fail</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Heatmap view */
        <div className="border border-[#e5e7eb]" style={{ background: "#ffffff" }}>
          <div className="px-4 py-2 border-b border-[#e5e7eb]" style={{ background: "#f9fafb" }}>
            <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
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
                    background: `${heatColor(zone.avgScore)}15`,
                    borderColor: selectedZone === zone.spaceType ? heatColor(zone.avgScore) : `${heatColor(zone.avgScore)}40`,
                    borderWidth: selectedZone === zone.spaceType ? "2px" : "1px",
                  }}
                  onClick={() => setSelectedZone(selectedZone === zone.spaceType ? null : zone.spaceType)}
                >
                  <div className="text-[11px] truncate" style={{ fontWeight: 500, color: "#1f2937" }}>{zone.spaceType}</div>
                  <div className="mt-2 flex items-end justify-between">
                    <div style={{ fontSize: "28px", fontWeight: 700, color: heatColor(zone.avgScore), ...mono }}>
                      {zone.avgScore}%
                    </div>
                    <div className="text-right">
                      <div className="text-[9px]" style={{ ...mono, color: "#6b7280" }}>{zone.fixtures.length} fixtures</div>
                      <div className="text-[9px]" style={{ ...mono, color: "#6b7280" }}>{zone.totalWattage}W total</div>
                    </div>
                  </div>
                  {/* Mini bar */}
                  <div className="mt-2 h-1.5 w-full" style={{ background: "#e5e7eb" }}>
                    <div className="h-full" style={{ width: `${zone.avgScore}%`, background: heatColor(zone.avgScore) }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#e5e7eb]">
              <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: "#9ca3af" }}>LEGEND:</span>
              {[
                { label: "0-20%", color: "#dc2626" },
                { label: "20-40%", color: "#ea580c" },
                { label: "40-60%", color: "#d97706" },
                { label: "60-80%", color: "#65a30d" },
                { label: "80-100%", color: "#16a34a" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-3 h-3" style={{ background: l.color }} />
                  <span className="text-[9px]" style={{ ...mono, color: "#6b7280" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expanded zone detail */}
      {selectedZoneData && (
        <div>
          <div className="flex items-center gap-3 px-4 py-2.5 border border-b-0 border-[#e5e7eb]" style={{ background: "#f9fafb" }}>
            <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
              Zone Detail: {selectedZoneData.spaceType}
            </span>
            <ChevronRight size={10} color="#9ca3af" />
            <span className="text-[10px]" style={{ ...mono, color: "#9ca3af" }}>
              {selectedZoneData.fixtures.length} fixtures
            </span>
          </div>
          <div className="border border-[#e5e7eb]" style={{ background: "#ffffff" }}>
            {/* Zone detail header */}
            <div className="grid border-b border-[#e5e7eb]"
              style={{ gridTemplateColumns: "1fr 90px 90px 80px 100px 100px", background: "#f9fafb" }}>
              {["FIXTURE", "WATTAGE", "LUMENS", "SCORE", "LPD", "STATUS"].map((h) => (
                <div key={h} className="px-3 py-2 text-[9px] tracking-[0.15em] uppercase overflow-hidden"
                  style={{ ...mono, color: "#6b7280", borderRight: "1px solid #f0f0f2" }}>{h}</div>
              ))}
            </div>
            {selectedZoneData.fixtures.map((item, idx) => {
              const fx = item.fixture
              const ev = item.evaluation
              const cfg = STATUS_CONFIG[ev.overallStatus]
              const lpdVal = fx.spaceArea && fx.spaceArea > 0
                ? ((fx.wattage || 0) * (fx.quantity || 1)) / fx.spaceArea
                : null
              return (
                <div key={fx.id} className="grid border-b border-[#f0f0f2] min-w-0"
                  style={{ gridTemplateColumns: "1fr 90px 90px 80px 100px 100px", background: idx % 2 === 0 ? "#ffffff" : "#fafafa" }}>
                  <div className="px-3 py-2.5 overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <div className="text-[11px] truncate" style={{ fontWeight: 500, color: "#1f2937" }}>{fx.fixtureName}</div>
                    <div className="text-[9px] truncate" style={{ color: "#9ca3af" }}>{fx.fixtureType} &middot; Qty {fx.quantity}</div>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[10px]" style={{ ...mono, color: "#4b5563" }}>{fx.wattage}W</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[10px]" style={{ ...mono, color: "#4b5563" }}>{fx.lumenOutput} lm</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[10px]" style={{ ...mono, fontWeight: 600, color: heatColor(item.score) }}>{item.score}%</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[10px]" style={{ ...mono, color: "#6b7280" }}>
                      {lpdVal !== null ? `${lpdVal.toFixed(3)} W/ft²` : "—"}
                    </span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] tracking-wider uppercase border whitespace-nowrap"
                      style={{ ...mono, color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border border-[#e5dfd0]" style={{ background: "#fdfcf8" }}>
        <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: "#92800a" }}>
          Zone-level LPD = sum(fixture wattage &times; qty) / zone area
        </span>
        <span className="text-[9px]" style={{ ...mono, color: "#a0903a" }}>
          LPD allowances per ASHRAE 90.1-2022 Table 9.6.1
        </span>
      </div>
    </div>
  )
}
