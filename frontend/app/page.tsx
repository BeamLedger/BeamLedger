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
        style={{ ...mono, color: "#4ade80", borderColor: "#166534", background: "#052e0f" }}
      >
        <CheckCircle2 size={9} /> COMPLIANT
      </span>
    )
  }
  if (status === "failed") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-widest uppercase border"
        style={{ ...mono, color: "#f87171", borderColor: "#7f1d1d", background: "#1c0505" }}
      >
        <XCircle size={9} /> NON-COMPLIANT
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-widest uppercase border"
      style={{ ...mono, color: "#fbbf24", borderColor: "#78350f", background: "#1c0e00" }}
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
      <div className="flex items-start justify-between border-b border-[#1e1e26] pb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ ...mono, color: "#5a5a70" }}>
            Module: Compliance Monitoring
          </p>
          <h1 className="text-white tracking-tight" style={{ fontSize: "20px", fontWeight: 600 }}>
            Verification Dashboard
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#5a5a70" }}>
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
              color: "#fecaca",
              fontWeight: 500,
            }}
          >
            <PlusSquare size={12} />
            New Verification
          </button>
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 border border-[#1e1e26]" style={{ background: "#0a0a0d" }}>
        {[
          { label: "TOTAL RECORDS", value: totalChecks, sub: "All time", color: "#9ca3af", icon: <Clock size={11} /> },
          {
            label: "COMPLIANT",
            value: passedChecks,
            sub: `${Math.round((passedChecks / totalChecks) * 100)}% pass rate`,
            color: "#4ade80",
            icon: <CheckCircle2 size={11} />,
          },
          {
            label: "PARTIAL / REVIEW",
            value: partialChecks,
            sub: "Attention required",
            color: "#fbbf24",
            icon: <AlertCircle size={11} />,
          },
          {
            label: "AVG. COMPLIANCE",
            value: `${averageScore}%`,
            sub: "Across all standards",
            color: "#f87171",
            icon: <TrendingUp size={11} />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="px-5 py-4 border-r border-[#1e1e26] last:border-r-0"
          >
            <div
              className="text-[9px] tracking-[0.18em] uppercase mb-2 flex items-center gap-1"
              style={{ ...mono, color: "#4a4a5e" }}
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
            <div className="text-[10px]" style={{ color: "#4a4a5e" }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div>
        <div
          className="flex items-center justify-between px-4 py-2 border border-b-0 border-[#1e1e26]"
          style={{ background: "#0a0a0d" }}
        >
          <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#5a5a70" }}>
            Verification Records
          </span>
          <span className="text-[10px]" style={{ ...mono, color: "#3a3a50" }}>
            {totalChecks} entries
          </span>
        </div>

        <div className="border border-[#1e1e26]" style={{ background: "#09090c" }}>
          {/* Table header */}
          <div
            className="grid border-b border-[#1e1e26]"
            style={{
              gridTemplateColumns: "100px 1fr 180px 180px 110px 120px 50px",
              background: "#0d0d12",
            }}
          >
            {["REF. ID", "PRODUCT NAME", "PRODUCT TYPE", "MANUFACTURER", "DATE FILED", "STATUS", ""].map((h) => (
              <div
                key={h || 'actions'}
                className="px-4 py-2.5 text-[9px] tracking-[0.18em] uppercase"
                style={{ ...mono, color: "#3d3d52", borderRight: "1px solid #141419" }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Table rows */}
          {mockComplianceChecks.map((check, idx) => (
            <div
              key={check.id}
              className="grid border-b border-[#131318] transition-colors hover:!bg-[#121220]"
              style={{
                gridTemplateColumns: "100px 1fr 180px 180px 110px 120px 50px",
                background: idx % 2 === 0 ? "#09090c" : "#0b0b0f",
              }}
            >
              <div
                className="px-4 py-3 flex items-center"
                style={{ borderRight: "1px solid #141419" }}
              >
                <span className="text-[10px]" style={{ ...mono, color: "#5a5a70" }}>
                  BL-{String(idx + 1).padStart(3, "0")}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #141419" }}>
                <span className="text-[12px] text-white" style={{ fontWeight: 500 }}>
                  {check.productName}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #141419" }}>
                <span className="text-[11px]" style={{ color: "#6b6b80" }}>
                  {check.productType}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #141419" }}>
                <span className="text-[11px]" style={{ color: "#6b6b80" }}>
                  {check.manufacturer}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #141419" }}>
                <span className="text-[10px]" style={{ ...mono, color: "#5a5a70" }}>
                  {new Date(check.date)
                    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
                    .toUpperCase()}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #141419" }}>
                <StatusStamp status={check.status} />
              </div>
              <div className="px-2 py-3 flex items-center justify-center">
                <Link href={`/results/${check.id}`}>
                  <button
                    className="p-1 transition-colors text-[#3a3a55] hover:text-[#f87171]"
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
        className="flex items-center justify-between px-4 py-2 border border-[#1a1008]"
        style={{ background: "#0d0a05" }}
      >
        <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: "#4a3a20" }}>
          Data reflects real-time verification registry
        </span>
        <span className="text-[9px]" style={{ ...mono, color: "#3a2a10" }}>
          Standards: IEC 60598 &middot; UL &middot; EN 55015 &middot; FCC Part 15 &middot; Energy Star &middot; RoHS &middot; IEEE 802.15.4
        </span>
      </div>
    </div>
  )
}
