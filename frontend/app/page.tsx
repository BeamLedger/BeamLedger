"use client"
import { useMemo } from "react"
import Link from "next/link"
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Clock, ArrowRight, PlusSquare, Search, Upload } from "lucide-react"
import { sampleFixtures } from "../lib/compliance/sampleData"
import { evaluateFixture, computeComplianceScore } from "../lib/compliance/engine"
import { STANDARD_DEFINITIONS } from "../lib/compliance/standards"
import type { ComplianceStatus, FixtureEvaluation } from "../lib/compliance/types"

const mono = { fontFamily: "'Ubin Sans', monospace" } as const

function StatusStamp({ status }: { status: ComplianceStatus }) {
  const config: Record<ComplianceStatus, { color: string; bg: string; border: string; label: string; Icon: typeof CheckCircle2 }> = {
    pass:       { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", label: "COMPLIANT",      Icon: CheckCircle2 },
    fail:       { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", label: "NON-COMPLIANT",  Icon: XCircle },
    exempt:     { color: "#2563eb", bg: "#eff6ff", border: "#93c5fd", label: "EXEMPT",         Icon: AlertCircle },
    data_error: { color: "#d97706", bg: "#fffbeb", border: "#fcd34d", label: "DATA ERROR",     Icon: AlertCircle },
  }
  const c = config[status]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] tracking-widest uppercase border whitespace-nowrap"
      style={{ ...mono, color: c.color, borderColor: c.border, background: c.bg }}
    >
      <c.Icon size={9} /> {c.label}
    </span>
  )
}

export default function DashboardPage() {
  // Evaluate all fixtures
  const evaluations = useMemo(() => {
    return sampleFixtures.map((fx) => ({
      fixture: fx,
      evaluation: evaluateFixture(fx),
      score: 0,
    })).map((item) => ({
      ...item,
      score: computeComplianceScore(item.evaluation.results),
    }))
  }, [])

  const totalChecks = evaluations.length
  const passedChecks = evaluations.filter((e) => e.evaluation.overallStatus === "pass").length
  const failedChecks = evaluations.filter((e) => e.evaluation.overallStatus === "fail").length
  const otherChecks = totalChecks - passedChecks - failedChecks
  const averageScore = totalChecks > 0
    ? Math.round(evaluations.reduce((acc, e) => acc + e.score, 0) / totalChecks)
    : 0

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Page title */}
      <div className="flex items-start justify-between border-b border-[#e5e7eb] pb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ ...mono, color: "#6b7280" }}>
            Module: Compliance Monitoring
          </p>
          <h1 className="tracking-tight" style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937" }}>
            Verification Dashboard
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
            Real-time compliance evaluation — ASHRAE 90.1 &middot; Title 24 &middot; IES &middot; DLC QPL &middot; IECC
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/search">
            <button
              className="flex items-center gap-2 px-4 py-2 text-[11px] tracking-widest uppercase border transition-colors hover:opacity-90"
              style={{ ...mono, background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }}
            >
              <Search size={12} />
              Search
            </button>
          </Link>
          <Link href="/import">
            <button
              className="flex items-center gap-2 px-4 py-2 text-[11px] tracking-widest uppercase border transition-colors hover:opacity-90"
              style={{ ...mono, background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }}
            >
              <Upload size={12} />
              Import
            </button>
          </Link>
          <Link href="/new-check">
            <button
              className="flex items-center gap-2 px-4 py-2 text-[11px] tracking-widest uppercase border transition-colors hover:opacity-90"
              style={{ ...mono, background: "#7f1d1d", borderColor: "#991b1b", color: "#ffffff", fontWeight: 500 }}
            >
              <PlusSquare size={12} />
              New Verification
            </button>
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 border border-[#e5e7eb]" style={{ background: "#f9fafb" }}>
        {[
          { label: "TOTAL FIXTURES", value: totalChecks, sub: "All evaluated", color: "#6b7280", icon: <Clock size={11} /> },
          {
            label: "COMPLIANT",
            value: passedChecks,
            sub: totalChecks > 0 ? `${Math.round((passedChecks / totalChecks) * 100)}% pass rate` : "—",
            color: "#16a34a",
            icon: <CheckCircle2 size={11} />,
          },
          {
            label: "NON-COMPLIANT",
            value: failedChecks,
            sub: failedChecks > 0 ? "Action required" : "None",
            color: "#dc2626",
            icon: <XCircle size={11} />,
          },
          {
            label: "AVG. SCORE",
            value: `${averageScore}%`,
            sub: "Across all standards",
            color: averageScore >= 80 ? "#16a34a" : averageScore >= 50 ? "#d97706" : "#dc2626",
            icon: <TrendingUp size={11} />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="px-5 py-4 border-r border-[#e5e7eb] last:border-r-0"
          >
            <div
              className="text-[9px] tracking-[0.18em] uppercase mb-2 flex items-center gap-1"
              style={{ ...mono, color: "#9ca3af" }}
            >
              <span style={{ color: stat.color }}>{stat.icon}</span>
              {stat.label}
            </div>
            <div
              className="mb-1"
              style={{ fontSize: "26px", fontWeight: 700, color: stat.color, ...mono }}
            >
              {stat.value}
            </div>
            <div className="text-[10px]" style={{ color: "#9ca3af" }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div>
        <div
          className="flex items-center justify-between px-4 py-2 border border-b-0 border-[#e5e7eb]"
          style={{ background: "#f9fafb" }}
        >
          <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
            Fixture Compliance Records
          </span>
          <span className="text-[10px]" style={{ ...mono, color: "#9ca3af" }}>
            {totalChecks} entries
          </span>
        </div>

        <div className="border border-[#e5e7eb]" style={{ background: "#ffffff" }}>
          {/* Table header */}
          <div
            className="grid border-b border-[#e5e7eb]"
            style={{
              gridTemplateColumns: "90px 1fr 150px 130px 70px 100px 120px 40px",
              background: "#f9fafb",
            }}
          >
            {["ASSET TAG", "FIXTURE NAME", "MANUFACTURER", "SPACE TYPE", "SCORE", "STANDARDS", "STATUS", ""].map((h) => (
              <div
                key={h || 'actions'}
                className="px-3 py-2.5 text-[9px] tracking-[0.15em] uppercase"
                style={{ ...mono, color: "#6b7280", borderRight: "1px solid #f0f0f2" }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Table rows */}
          {evaluations.map((item, idx) => {
            const fx = item.fixture
            const ev = item.evaluation
            const score = item.score
            const scoreColor = score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626"

            return (
              <div
                key={fx.id}
                className="grid border-b border-[#f0f0f2] transition-colors hover:!bg-[#f5f5fa]"
                style={{
                  gridTemplateColumns: "90px 1fr 150px 130px 70px 100px 120px 40px",
                  background: idx % 2 === 0 ? "#ffffff" : "#fafafa",
                }}
              >
                <div className="px-3 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                  <span className="text-[10px]" style={{ ...mono, color: "#6b7280" }}>
                    {fx.assetTag}
                  </span>
                </div>
                <div className="px-3 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                  <div className="min-w-0">
                    <span className="text-[12px] block truncate" style={{ fontWeight: 500, color: "#1f2937" }}>
                      {fx.fixtureName}
                    </span>
                    <span className="text-[10px] block truncate" style={{ color: "#9ca3af" }}>
                      {fx.fixtureType} &middot; {fx.wattage}W &middot; {fx.lumenOutput} lm
                    </span>
                  </div>
                </div>
                <div className="px-3 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                  <span className="text-[11px] truncate" style={{ color: "#6b7280" }}>
                    {fx.manufacturer}
                  </span>
                </div>
                <div className="px-3 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                  <span className="text-[10px] truncate" style={{ color: "#6b7280" }}>
                    {fx.spaceType}
                  </span>
                </div>
                <div className="px-3 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                  <span className="text-[11px]" style={{ ...mono, fontWeight: 600, color: scoreColor }}>
                    {score}%
                  </span>
                </div>
                <div className="px-3 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                  <span className="text-[9px]" style={{ ...mono, color: "#9ca3af" }}>
                    {fx.applicableStandards.length} std{fx.applicableStandards.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="px-3 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                  <StatusStamp status={ev.overallStatus} />
                </div>
                <div className="px-2 py-3 flex items-center justify-center">
                  <Link href={`/results/${fx.id}`}>
                    <button
                      className="p-1 transition-colors text-[#9ca3af] hover:text-[#7f1d1d]"
                      title="View Report"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer notice */}
      <div
        className="flex items-center justify-between px-4 py-2 border border-[#e5dfd0]"
        style={{ background: "#fdfcf8" }}
      >
        <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: "#92800a" }}>
          Real-time compliance evaluation — LPD, efficacy, illuminance
        </span>
        <span className="text-[9px]" style={{ ...mono, color: "#a0903a" }}>
          ASHRAE 90.1-2022 &middot; Title 24-2022 &middot; IES RP &middot; DLC QPL v5.1 &middot; IECC 2021
        </span>
      </div>
    </div>
  )
}
