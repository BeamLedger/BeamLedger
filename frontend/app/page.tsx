"use client"
import { useMemo } from "react"
import Link from "next/link"
import { CheckCircle2, XCircle, TrendingUp, Clock, ArrowRight, PlusSquare, Search, Upload, AlertTriangle, FileText, Zap, Timer } from "lucide-react"
import { sampleFixtures } from "../lib/compliance/sampleData"
import { evaluateFixture, computeComplianceScore } from "../lib/compliance/engine"
import { STANDARD_DEFINITIONS } from "../lib/compliance/standards"
import { colors, mono, scoreColor } from "../lib/designTokens"
import type { StatusKey } from "../lib/designTokens"
import PageHeader from "../components/PageHeader"
import StatCard from "../components/StatCard"
import SectionHeader from "../components/SectionHeader"
import FooterBar from "../components/FooterBar"
import StatusBadge from "../components/StatusBadge"
import ScoreBar from "../components/ScoreBar"

/* ── Sparkline (tiny inline SVG) ──────────────────────────────────────────── */
function Sparkline({ data, color, width = 120, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(" ")
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={width} cy={parseFloat(points.split(" ").pop()!.split(",")[1])} r="2" fill={color} />
    </svg>
  )
}

export default function DashboardPage() {
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
  const averageScore = totalChecks > 0
    ? Math.round(evaluations.reduce((acc, e) => acc + e.score, 0) / totalChecks)
    : 0

  // Top 5 issues — lowest scoring non-pass fixtures
  const topIssues = useMemo(() => {
    return [...evaluations]
      .filter((e) => e.evaluation.overallStatus !== "pass")
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
  }, [evaluations])

  // Sparkline data — simulated weekly score trend (last 8 weeks)
  const sparkData = useMemo(() => {
    const base = averageScore
    return [
      Math.max(0, base - 18),
      Math.max(0, base - 12),
      Math.max(0, base - 8),
      Math.max(0, base - 14),
      Math.max(0, base - 5),
      Math.max(0, base - 3),
      Math.max(0, base - 1),
      base,
    ]
  }, [averageScore])

  // Time saved calculator
  const manualMinutesPerFixture = 25
  const automatedMinutesPerFixture = 2
  const totalManualHours = Math.round((totalChecks * manualMinutesPerFixture) / 60)
  const totalAutomatedMinutes = totalChecks * automatedMinutesPerFixture
  const hoursSaved = Math.round(totalManualHours - totalAutomatedMinutes / 60)

  // Standards breakdown
  const standardsBreakdown = useMemo(() => {
    const counts: Record<string, { pass: number; fail: number; total: number }> = {}
    for (const ev of evaluations) {
      for (const r of ev.evaluation.results) {
        if (!counts[r.standard]) counts[r.standard] = { pass: 0, fail: 0, total: 0 }
        counts[r.standard].total++
        if (r.status === "pass") counts[r.standard].pass++
        else if (r.status === "fail") counts[r.standard].fail++
      }
    }
    return Object.entries(counts).map(([id, c]) => ({
      id,
      name: STANDARD_DEFINITIONS[id as keyof typeof STANDARD_DEFINITIONS]?.name ?? id,
      ...c,
      rate: c.total > 0 ? Math.round((c.pass / c.total) * 100) : 0,
    })).sort((a, b) => a.rate - b.rate)
  }, [evaluations])

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      {/* Header */}
      <PageHeader
        module="Compliance Monitoring"
        title="Verification Dashboard"
        subtitle="Real-time compliance evaluation — ASHRAE 90.1 · Title 24 · IES · DLC QPL · IECC"
        actions={
          <>
            <Link href="/search">
              <button
                className="flex items-center gap-2 px-4 py-2 text-[11px] tracking-widest uppercase border transition-colors hover:opacity-90"
                style={{ ...mono, background: colors.bg.panel, borderColor: colors.border.default, color: colors.text.tertiary }}
              >
                <Search size={12} /> Search
              </button>
            </Link>
            <Link href="/import">
              <button
                className="flex items-center gap-2 px-4 py-2 text-[11px] tracking-widest uppercase border transition-colors hover:opacity-90"
                style={{ ...mono, background: colors.bg.panel, borderColor: colors.border.default, color: colors.text.tertiary }}
              >
                <Upload size={12} /> Import
              </button>
            </Link>
            <Link href="/new-check">
              <button
                className="flex items-center gap-2 px-4 py-2 text-[11px] tracking-widest uppercase border transition-colors hover:opacity-90"
                style={{ ...mono, background: colors.maroon[800], borderColor: colors.maroon[700], color: "#ffffff", fontWeight: 500 }}
              >
                <PlusSquare size={12} /> New Verification
              </button>
            </Link>
          </>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-5 border" style={{ borderColor: colors.border.default, background: colors.bg.panel }}>
        <StatCard label="Total Fixtures" value={totalChecks} subtitle="All evaluated" color={colors.text.tertiary} icon={<Clock size={11} />} />
        <StatCard
          label="Compliant"
          value={passedChecks}
          subtitle={totalChecks > 0 ? `${Math.round((passedChecks / totalChecks) * 100)}% pass rate` : "—"}
          color={colors.pass.fg}
          icon={<CheckCircle2 size={11} />}
        />
        <StatCard
          label="Non-Compliant"
          value={failedChecks}
          subtitle={failedChecks > 0 ? "Action required" : "None"}
          color={colors.fail.fg}
          icon={<XCircle size={11} />}
        />
        <StatCard
          label="Avg. Score"
          value={`${averageScore}%`}
          subtitle="Across all standards"
          color={scoreColor(averageScore)}
          icon={<TrendingUp size={11} />}
        />
        <div className="px-4 py-4">
          <div className="text-[9px] tracking-[0.18em] uppercase mb-2 flex items-center gap-1" style={{ ...mono, color: colors.text.muted }}>
            <span style={{ color: colors.chart.blue }}><TrendingUp size={11} /></span>
            8-Week Trend
          </div>
          <Sparkline data={sparkData} color={scoreColor(averageScore)} />
        </div>
      </div>

      {/* Middle row: Top Issues + Quick Actions + Time Saved */}
      <div className="grid grid-cols-3 gap-4">
        {/* Top 5 Issues */}
        <div className="col-span-1 border" style={{ borderColor: colors.border.default }}>
          <div className="px-4 py-2.5 border-b flex items-center gap-1.5" style={{ background: colors.bg.panel, borderColor: colors.border.default }}>
            <AlertTriangle size={11} style={{ color: colors.fail.fg }} />
            <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: colors.text.tertiary }}>
              Top Issues
            </span>
          </div>
          <div style={{ background: colors.bg.page }}>
            {topIssues.length === 0 ? (
              <div className="px-4 py-6 text-center text-[11px]" style={{ color: colors.text.muted }}>No issues found</div>
            ) : (
              topIssues.map((item, idx) => (
                <Link key={item.fixture.id} href={`/results/${item.fixture.id}`}>
                  <div
                    className="px-4 py-2.5 border-b flex items-center justify-between cursor-pointer transition-colors hover:bg-[#f5f5fa]"
                    style={{ borderColor: colors.border.light, background: idx % 2 === 0 ? colors.bg.page : colors.bg.alt }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] truncate" style={{ fontWeight: 500, color: colors.text.primary }}>
                        {item.fixture.fixtureName}
                      </div>
                      <div className="text-[9px] truncate" style={{ color: colors.text.muted }}>
                        {item.fixture.assetTag} &middot; {item.fixture.spaceType}
                      </div>
                    </div>
                    <div className="ml-2 flex items-center gap-2 flex-shrink-0">
                      <ScoreBar score={item.score} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-1 border" style={{ borderColor: colors.border.default }}>
          <div className="px-4 py-2.5 border-b flex items-center gap-1.5" style={{ background: colors.bg.panel, borderColor: colors.border.default }}>
            <Zap size={11} style={{ color: colors.maroon[700] }} />
            <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: colors.text.tertiary }}>
              Quick Actions
            </span>
          </div>
          <div className="p-4 space-y-2" style={{ background: colors.bg.page }}>
            {[
              { href: "/new-check", label: "Run New Verification", desc: "Evaluate a fixture against all standards", icon: PlusSquare, accent: colors.maroon[700] },
              { href: "/import", label: "Import Fixture Data", desc: "Bulk upload CSV or Excel files", icon: Upload, accent: colors.chart.blue },
              { href: "/roi", label: "ROI Analysis", desc: "Calculate replacement costs and payback", icon: TrendingUp, accent: colors.chart.green },
              { href: "/results/1", label: "View Latest Report", desc: "Most recent compliance evaluation", icon: FileText, accent: colors.chart.purple },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-3 px-3 py-2.5 border transition-colors cursor-pointer hover:bg-[#f5f5fa]" style={{ borderColor: colors.border.default }}>
                  <action.icon size={14} style={{ color: action.accent, flexShrink: 0 }} />
                  <div className="min-w-0">
                    <div className="text-[11px]" style={{ fontWeight: 500, color: colors.text.primary }}>{action.label}</div>
                    <div className="text-[9px]" style={{ color: colors.text.muted }}>{action.desc}</div>
                  </div>
                  <ArrowRight size={11} className="ml-auto flex-shrink-0" style={{ color: colors.text.faint }} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Time Saved Calculator */}
        <div className="col-span-1 border" style={{ borderColor: colors.border.default }}>
          <div className="px-4 py-2.5 border-b flex items-center gap-1.5" style={{ background: colors.bg.panel, borderColor: colors.border.default }}>
            <Timer size={11} style={{ color: colors.chart.green }} />
            <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: colors.text.tertiary }}>
              Time Saved
            </span>
          </div>
          <div className="p-4 space-y-4" style={{ background: colors.bg.page }}>
            <div className="text-center">
              <div style={{ fontSize: "32px", fontWeight: 700, color: colors.chart.green, ...mono }}>{hoursSaved}h</div>
              <div className="text-[10px]" style={{ color: colors.text.muted }}>saved vs manual auditing</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]" style={{ color: colors.text.secondary }}>
                <span>Manual audit estimate</span>
                <span style={{ ...mono, fontWeight: 600 }}>{totalManualHours}h</span>
              </div>
              <div className="w-full h-2" style={{ background: colors.border.default }}>
                <div className="h-full" style={{ width: "100%", background: colors.chart.red }} />
              </div>
              <div className="flex justify-between text-[10px]" style={{ color: colors.text.secondary }}>
                <span>BeamLedger automated</span>
                <span style={{ ...mono, fontWeight: 600 }}>{Math.round(totalAutomatedMinutes / 60)}h</span>
              </div>
              <div className="w-full h-2" style={{ background: colors.border.default }}>
                <div className="h-full" style={{ width: `${Math.round((totalAutomatedMinutes / 60 / totalManualHours) * 100)}%`, background: colors.chart.green }} />
              </div>
            </div>
            <div className="text-center px-3 py-2 border" style={{ borderColor: colors.border.default, background: colors.bg.panel }}>
              <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: colors.text.muted }}>
                {Math.round((1 - totalAutomatedMinutes / 60 / totalManualHours) * 100)}% efficiency gain &middot; {totalChecks} fixtures processed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Standards Compliance Breakdown */}
      <div>
        <SectionHeader title="Standards Compliance Breakdown" right={`${standardsBreakdown.length} standards`} />
        <div className="border border-t-0 grid grid-cols-5" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
          {standardsBreakdown.map((std) => (
            <div key={std.id} className="px-4 py-3 border-r last:border-r-0" style={{ borderColor: colors.border.light }}>
              <div className="text-[9px] tracking-wider uppercase mb-1.5 truncate" style={{ ...mono, color: colors.text.muted }}>
                {std.name}
              </div>
              <div className="text-[18px] mb-1" style={{ fontWeight: 700, color: scoreColor(std.rate), ...mono }}>
                {std.rate}%
              </div>
              <div className="w-full h-1.5 mb-1" style={{ background: colors.border.default }}>
                <div className="h-full transition-all" style={{ width: `${std.rate}%`, background: scoreColor(std.rate) }} />
              </div>
              <div className="text-[9px]" style={{ color: colors.text.muted }}>
                {std.pass}/{std.total} pass
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixture Table */}
      <div>
        <SectionHeader title="Fixture Compliance Records" right={`${totalChecks} entries`} />
        <div className="border border-t-0" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
          {/* Table header */}
          <div
            className="grid border-b"
            style={{
              gridTemplateColumns: "90px 1fr 130px 120px 90px 80px 150px 40px",
              background: colors.bg.panel,
              borderColor: colors.border.default,
            }}
          >
            {["ASSET TAG", "FIXTURE NAME", "MANUFACTURER", "SPACE TYPE", "SCORE", "STANDARDS", "STATUS", ""].map((h) => (
              <div
                key={h || "actions"}
                className="px-3 py-2.5 text-[9px] tracking-[0.15em] uppercase whitespace-nowrap"
                style={{ ...mono, color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Table rows */}
          {evaluations.map((item, idx) => {
            const fx = item.fixture
            const ev = item.evaluation

            return (
              <div
                key={fx.id}
                className="grid border-b transition-colors hover:!bg-[#f5f5fa] min-w-0"
                style={{
                  gridTemplateColumns: "90px 1fr 130px 120px 90px 80px 150px 40px",
                  background: idx % 2 === 0 ? colors.bg.page : colors.bg.alt,
                  borderColor: colors.border.light,
                }}
              >
                <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <span className="text-[10px]" style={{ ...mono, color: colors.text.tertiary }}>{fx.assetTag}</span>
                </div>
                <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <div className="min-w-0">
                    <span className="text-[12px] block truncate" style={{ fontWeight: 500, color: colors.text.primary }}>{fx.fixtureName}</span>
                    <span className="text-[10px] block truncate" style={{ color: colors.text.muted }}>
                      {fx.fixtureType} &middot; {fx.wattage}W &middot; {fx.lumenOutput} lm
                    </span>
                  </div>
                </div>
                <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <span className="text-[11px] truncate" style={{ color: colors.text.tertiary }}>{fx.manufacturer}</span>
                </div>
                <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <span className="text-[10px] truncate" style={{ color: colors.text.tertiary }}>{fx.spaceType}</span>
                </div>
                <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <ScoreBar score={item.score} />
                </div>
                <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <span className="text-[9px]" style={{ ...mono, color: colors.text.muted }}>
                    {fx.applicableStandards.length} std{fx.applicableStandards.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="px-3 py-3 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <StatusBadge status={ev.overallStatus as StatusKey} long size="md" />
                </div>
                <div className="px-2 py-3 flex items-center justify-center">
                  <Link href={`/results/${fx.id}`}>
                    <button className="p-1 transition-colors text-[#9ca3af] hover:text-[#7f1d1d]" title="View Report">
                      <ArrowRight size={14} />
                    </button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <FooterBar
        left="Real-time compliance evaluation — LPD, efficacy, illuminance"
        right="ASHRAE 90.1-2022 · Title 24-2022 · IES RP · DLC QPL v5.1 · IECC 2021"
      />
    </div>
  )
}
