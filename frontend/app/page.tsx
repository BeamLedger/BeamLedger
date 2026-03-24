"use client"
import Link from 'next/link'
import { mockComplianceChecks } from '../lib/mockData'
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Clock, ArrowRight, PlusSquare } from 'lucide-react'

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const

function StatusStamp({ status }: { status: string }) {
  if (status === "passed") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-widest uppercase border"
        style={{ ...mono, color: "#16a34a", borderColor: "#86efac", background: "#f0fdf4" }}
      >
        <CheckCircle2 size={9} /> COMPLIANT
      </span>
    )
  }
  if (status === "failed") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-widest uppercase border"
        style={{ ...mono, color: "#dc2626", borderColor: "#fca5a5", background: "#fef2f2" }}
      >
        <XCircle size={9} /> NON-COMPLIANT
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-widest uppercase border"
      style={{ ...mono, color: "#d97706", borderColor: "#fcd34d", background: "#fffbeb" }}
    >
      <AlertCircle size={9} /> PARTIAL
    </span>
  )
}

export default function DashboardPage() {
  const totalChecks = mockComplianceChecks.length
  const passedChecks = mockComplianceChecks.filter((c) => c.status === "passed").length
  const failedChecks = mockComplianceChecks.filter((c) => c.status === "failed").length
  const partialChecks = mockComplianceChecks.filter((c) => c.status === "partial").length
  const averageScore = Math.round(
    mockComplianceChecks.reduce((acc, check) => acc + check.overallScore, 0) / totalChecks
  )

  return (
    <div className="p-6 space-y-6">
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
            Displaying all compliance records — IEC, UL, FCC, Energy Star, RoHS, IEEE
          </p>
        </div>
        <Link href="/new-check">
          <button
            className="flex items-center gap-2 px-4 py-2 text-[11px] tracking-widest uppercase border transition-colors hover:opacity-90"
            style={{
              ...mono,
              background: "#7f1d1d",
              borderColor: "#991b1b",
              color: "#ffffff",
              fontWeight: 500,
            }}
          >
            <PlusSquare size={12} />
            New Verification
          </button>
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 border border-[#e5e7eb]" style={{ background: "#f9fafb" }}>
        {[
          { label: "TOTAL RECORDS", value: totalChecks, sub: "All time", color: "#6b7280", icon: <Clock size={11} /> },
          {
            label: "COMPLIANT",
            value: passedChecks,
            sub: `${Math.round((passedChecks / totalChecks) * 100)}% pass rate`,
            color: "#16a34a",
            icon: <CheckCircle2 size={11} />,
          },
          {
            label: "PARTIAL / REVIEW",
            value: partialChecks,
            sub: "Attention required",
            color: "#d97706",
            icon: <AlertCircle size={11} />,
          },
          {
            label: "AVG. COMPLIANCE",
            value: `${averageScore}%`,
            sub: "Across all standards",
            color: "#dc2626",
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
            Verification Records
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
              gridTemplateColumns: "100px 1fr 180px 180px 110px 120px 50px",
              background: "#f9fafb",
            }}
          >
            {["REF. ID", "PRODUCT NAME", "PRODUCT TYPE", "MANUFACTURER", "DATE FILED", "STATUS", ""].map((h) => (
              <div
                key={h || 'actions'}
                className="px-4 py-2.5 text-[9px] tracking-[0.18em] uppercase"
                style={{ ...mono, color: "#6b7280", borderRight: "1px solid #f0f0f2" }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Table rows */}
          {mockComplianceChecks.map((check, idx) => (
            <div
              key={check.id}
              className="grid border-b border-[#f0f0f2] transition-colors hover:!bg-[#f5f5fa]"
              style={{
                gridTemplateColumns: "100px 1fr 180px 180px 110px 120px 50px",
                background: idx % 2 === 0 ? "#ffffff" : "#fafafa",
              }}
            >
              <div
                className="px-4 py-3 flex items-center"
                style={{ borderRight: "1px solid #f0f0f2" }}
              >
                <span className="text-[10px]" style={{ ...mono, color: "#6b7280" }}>
                  BL-{String(idx + 1).padStart(3, "0")}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                <span className="text-[12px]" style={{ fontWeight: 500, color: "#1f2937" }}>
                  {check.productName}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                <span className="text-[11px]" style={{ color: "#6b7280" }}>
                  {check.productType}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                <span className="text-[11px]" style={{ color: "#6b7280" }}>
                  {check.manufacturer}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                <span className="text-[10px]" style={{ ...mono, color: "#6b7280" }}>
                  {new Date(check.date)
                    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
                    .toUpperCase()}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                <StatusStamp status={check.status} />
              </div>
              <div className="px-2 py-3 flex items-center justify-center">
                <Link href={`/results/${check.id}`}>
                  <button
                    className="p-1 transition-colors text-[#9ca3af] hover:text-[#7f1d1d]"
                    title="View Report"
                  >
                    <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer notice */}
      <div
        className="flex items-center justify-between px-4 py-2 border border-[#e5dfd0]"
        style={{ background: "#fdfcf8" }}
      >
        <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: "#92800a" }}>
          Data reflects real-time verification registry
        </span>
        <span className="text-[9px]" style={{ ...mono, color: "#a0903a" }}>
          Standards: IEC 60598 &middot; UL &middot; EN 55015 &middot; FCC Part 15 &middot; Energy Star &middot; RoHS &middot; IEEE 802.15.4
        </span>
      </div>
    </div>
  )
}
