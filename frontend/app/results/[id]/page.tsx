"use client"
import { useParams } from "next/navigation"
import Link from "next/link"
import { mockComplianceChecks } from "../../../lib/mockData"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Download,
  Printer,
  Shield,
  Zap,
  Radio,
  Leaf,
  FileText,
} from "lucide-react"

const mono = { fontFamily: "'Ubin Sans', monospace" } as const

const CATEGORY_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Safety:        { color: "#2563eb", bg: "#eff6ff", border: "#93c5fd", label: "SAFETY" },
  EMC:           { color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", label: "EMC" },
  Energy:        { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", label: "ENERGY" },
  Environmental: { color: "#059669", bg: "#ecfdf5", border: "#6ee7b7", label: "ENVIRONMENTAL" },
  Connectivity:  { color: "#4f46e5", bg: "#eef2ff", border: "#a5b4fc", label: "CONNECTIVITY" },
}

function getCatMeta(cat: string) {
  return CATEGORY_META[cat] ?? { color: "#6b7280", bg: "#f9fafb", border: "#d1d5db", label: cat.toUpperCase() }
}

function getCatIcon(cat: string) {
  switch (cat) {
    case "Safety": return <Shield size={11} />
    case "EMC": return <Radio size={11} />
    case "Energy": return <Zap size={11} />
    case "Environmental": return <Leaf size={11} />
    case "Connectivity": return <Radio size={11} />
    default: return <FileText size={11} />
  }
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 90 ? "#16a34a" : value >= 70 ? "#d97706" : "#dc2626"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1" style={{ background: "#e5e7eb" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color }} />
      </div>
      <span className="text-[10px] w-8 text-right" style={{ ...mono, color }}>
        {value}%
      </span>
    </div>
  )
}

export default function ResultsPage() {
  const params = useParams()
  const id = params.id as string
  const check = mockComplianceChecks.find((c) => c.id === id)

  if (!check) {
    return (
      <div className="p-6">
        <div className="border border-[#e5e7eb] p-12 text-center" style={{ background: "#ffffff" }}>
          <AlertCircle size={32} className="mx-auto mb-3" color="#9ca3af" />
          <h2 className="mb-1" style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>
            Record Not Found
          </h2>
          <p className="text-[12px] mb-4" style={{ color: "#6b7280" }}>
            The verification record you requested does not exist or has been archived.
          </p>
          <Link href="/">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-[11px] tracking-widest uppercase border"
              style={{ ...mono, background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }}
            >
              <ArrowLeft size={11} /> Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const passedCount = check.standards.filter((s) => s.status === "passed").length
  const totalCount = check.standards.length
  const refId = `BL-2026-${String(id).padStart(3, "0")}`

  const overallColor =
    check.status === "passed" ? "#16a34a" : check.status === "failed" ? "#dc2626" : "#d97706"
  const overallLabel =
    check.status === "passed" ? "COMPLIANT" : check.status === "failed" ? "NON-COMPLIANT" : "PARTIAL / REVIEW"
  const overallBorder =
    check.status === "passed" ? "#86efac" : check.status === "failed" ? "#fca5a5" : "#fcd34d"
  const overallBg =
    check.status === "passed" ? "#f0fdf4" : check.status === "failed" ? "#fef2f2" : "#fffbeb"

  return (
    <div className="p-6 space-y-5">
      {/* Top actions */}
      <div className="flex items-center justify-between">
        <Link href="/">
          <button
            className="inline-flex items-center gap-2 text-[11px] tracking-wider uppercase transition-colors text-[#6b7280] hover:text-[#1f2937]"
            style={mono}
          >
            <ArrowLeft size={11} /> Back to Dashboard
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors text-[#6b7280] hover:text-[#1f2937]"
            style={{ ...mono, background: "#f9fafb", borderColor: "#e5e7eb" }}
          >
            <Download size={11} /> Export PDF
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors text-[#6b7280] hover:text-[#1f2937]"
            style={{ ...mono, background: "#f9fafb", borderColor: "#e5e7eb" }}
          >
            <Printer size={11} /> Print Report
          </button>
        </div>
      </div>

      {/* Report header banner */}
      <div
        className="border border-[#e5e7eb] px-6 py-4 flex items-start justify-between"
        style={{ background: "#f9fafb" }}
      >
        <div>
          <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: "#9ca3af" }}>
            Compliance Verification Report
          </div>
          <h1 className="mb-0.5" style={{ fontSize: "22px", fontWeight: 700, color: "#1f2937" }}>
            {check.productName}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-[11px]" style={{ color: "#6b7280" }}>
              {check.manufacturer}
            </span>
            <span style={{ color: "#d1d5db" }}>&middot;</span>
            <span className="text-[11px]" style={{ color: "#6b7280" }}>
              {check.productType}
            </span>
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 border text-[12px] tracking-widest uppercase"
            style={{ ...mono, color: overallColor, background: overallBg, borderColor: overallBorder, fontWeight: 600 }}
          >
            {check.status === "passed" ? <CheckCircle2 size={13} /> : check.status === "failed" ? <XCircle size={13} /> : <AlertCircle size={13} />}
            {overallLabel}
          </div>
          <div className="text-[10px] flex flex-col items-end gap-0.5" style={{ ...mono, color: "#9ca3af" }}>
            <span>REF: {refId}</span>
            <span>FILED: {new Date(check.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Metadata strip */}
      <div className="grid grid-cols-4 border border-[#e5e7eb]" style={{ background: "#ffffff" }}>
        {[
          { label: "OVERALL SCORE", value: `${check.overallScore}%`, color: overallColor },
          { label: "STANDARDS PASSED", value: `${passedCount} / ${totalCount}`, color: "#4b5563" },
          { label: "DATE PROCESSED", value: new Date(check.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(), color: "#4b5563" },
          { label: "JURISDICTION", value: "IEC \u00b7 FCC \u00b7 UL \u00b7 EU", color: "#4b5563" },
        ].map((item) => (
          <div
            key={item.label}
            className="px-5 py-3 border-r border-[#e5e7eb] last:border-r-0"
          >
            <div className="text-[9px] tracking-[0.18em] uppercase mb-1.5" style={{ ...mono, color: "#9ca3af" }}>
              {item.label}
            </div>
            <div className="text-[14px]" style={{ ...mono, color: item.color, fontWeight: 600 }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Standards table */}
      <div>
        <div
          className="px-4 py-2.5 border border-b-0 border-[#e5e7eb] flex items-center justify-between"
          style={{ background: "#f9fafb" }}
        >
          <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
            Standards Breakdown
          </span>
          <span className="text-[10px]" style={{ ...mono, color: "#9ca3af" }}>
            {totalCount} standards evaluated
          </span>
        </div>

        <div className="border border-[#e5e7eb]">
          {/* Header */}
          <div
            className="grid border-b border-[#e5e7eb]"
            style={{
              gridTemplateColumns: "24px 130px 100px 1fr 180px 90px",
              background: "#f9fafb",
            }}
          >
            {["", "STANDARD", "CATEGORY", "DESCRIPTION", "TEST DETAILS", "SCORE"].map((h) => (
              <div
                key={h || 'icon'}
                className="px-4 py-2.5 text-[9px] tracking-widest uppercase"
                style={{ ...mono, color: "#6b7280", borderRight: "1px solid #f0f0f2" }}
              >
                {h}
              </div>
            ))}
          </div>

          {check.standards.map((std, idx) => {
            const meta = getCatMeta(std.category)
            const passedRow = std.status === "passed"
            return (
              <div
                key={std.id}
                className="grid border-b border-[#f0f0f2]"
                style={{
                  gridTemplateColumns: "24px 130px 100px 1fr 180px 90px",
                  background: idx % 2 === 0 ? "#ffffff" : "#fafafa",
                  borderLeft: `2px solid ${passedRow ? "#86efac" : std.status === "failed" ? "#fca5a5" : "#fcd34d"}`,
                }}
              >
                <div
                  className="flex items-center justify-center py-3"
                  style={{ borderRight: "1px solid #f0f0f2" }}
                >
                  {passedRow ? (
                    <CheckCircle2 size={12} color="#16a34a" />
                  ) : std.status === "failed" ? (
                    <XCircle size={12} color="#dc2626" />
                  ) : (
                    <AlertCircle size={12} color="#d97706" />
                  )}
                </div>
                <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                  <span className="text-[11px]" style={{ ...mono, fontWeight: 600, color: "#1f2937" }}>
                    {std.name}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] tracking-widest uppercase border"
                    style={{ ...mono, color: meta.color, background: meta.bg, borderColor: meta.border }}
                  >
                    {getCatIcon(std.category)} {meta.label}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #f0f0f2" }}>
                  <span className="text-[11px]" style={{ color: "#6b7280" }}>
                    {std.description}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-start" style={{ borderRight: "1px solid #f0f0f2" }}>
                  <span className="text-[10px] leading-relaxed" style={{ color: "#6b7280" }}>
                    {std.details}
                  </span>
                </div>
                <div className="px-4 py-3 flex flex-col justify-center gap-1.5">
                  <ScoreBar value={std.score} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Findings / Recommendations */}
      {check.standards.some((s) => s.status === "failed") && (
        <div>
          <div
            className="px-4 py-2.5 border border-b-0 border-[#fca5a5]"
            style={{ background: "#fef2f2" }}
          >
            <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#dc2626" }}>
              Findings Requiring Corrective Action
            </span>
          </div>
          <div className="border border-[#fca5a5]" style={{ background: "#fff5f5" }}>
            {check.standards
              .filter((s) => s.status === "failed")
              .map((std) => (
                <div
                  key={std.id}
                  className="grid border-b border-[#fecaca] last:border-b-0"
                  style={{ gridTemplateColumns: "130px 1fr 200px" }}
                >
                  <div
                    className="px-4 py-3 flex items-center"
                    style={{ borderRight: "1px solid #fecaca" }}
                  >
                    <span className="text-[11px]" style={{ ...mono, color: "#dc2626", fontWeight: 600 }}>
                      {std.name}
                    </span>
                  </div>
                  <div className="px-4 py-3" style={{ borderRight: "1px solid #fecaca" }}>
                    <p className="text-[11px] leading-relaxed" style={{ color: "#7f5555" }}>
                      {std.details}
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[10px] leading-relaxed" style={{ color: "#9f4444" }}>
                      Review test parameters and consult certified compliance specialist. Re-test required before market submission.
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Report footer */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border border-[#e5e7eb]"
        style={{ background: "#f9fafb" }}
      >
        <span className="text-[9px] tracking-widest" style={{ ...mono, color: "#9ca3af" }}>
          BEAMLEDGER CVRS &middot; Report {refId} &middot; Generated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
        </span>
        <span className="text-[9px]" style={{ ...mono, color: "#9ca3af" }}>
          This report is for regulatory reference only. Not for public distribution.
        </span>
      </div>
    </div>
  )
}
