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

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const

const CATEGORY_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Safety:        { color: "#60a5fa", bg: "#03060f", border: "#1e3a5f", label: "SAFETY" },
  EMC:           { color: "#c084fc", bg: "#0a0312", border: "#3b1a5f", label: "EMC" },
  Energy:        { color: "#4ade80", bg: "#020f06", border: "#134a26", label: "ENERGY" },
  Environmental: { color: "#34d399", bg: "#020f08", border: "#0f3a20", label: "ENVIRONMENTAL" },
  Connectivity:  { color: "#818cf8", bg: "#03040f", border: "#1e2060", label: "CONNECTIVITY" },
}

function getCatMeta(cat: string) {
  return CATEGORY_META[cat] ?? { color: "#9ca3af", bg: "#0a0a0d", border: "#2a2a35", label: cat.toUpperCase() }
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
  const color = value >= 90 ? "#4ade80" : value >= 70 ? "#fbbf24" : "#f87171"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1" style={{ background: "#1a1a20" }}>
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
        <div className="border border-[#1e1e26] p-12 text-center" style={{ background: "#09090c" }}>
          <AlertCircle size={32} className="mx-auto mb-3" color="#3a3a50" />
          <h2 className="text-white mb-1" style={{ fontSize: "16px", fontWeight: 600 }}>
            Record Not Found
          </h2>
          <p className="text-[12px] mb-4" style={{ color: "#5a5a70" }}>
            The verification record you requested does not exist or has been archived.
          </p>
          <Link href="/">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-[11px] tracking-widest uppercase border"
              style={{ ...mono, background: "#1a0505", borderColor: "#2a1010", color: "#9b6b6b" }}
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
    check.status === "passed" ? "#4ade80" : check.status === "failed" ? "#f87171" : "#fbbf24"
  const overallLabel =
    check.status === "passed" ? "COMPLIANT" : check.status === "failed" ? "NON-COMPLIANT" : "PARTIAL / REVIEW"
  const overallBorder =
    check.status === "passed" ? "#134a26" : check.status === "failed" ? "#7f1d1d" : "#78350f"
  const overallBg =
    check.status === "passed" ? "#020f06" : check.status === "failed" ? "#1c0505" : "#1c0e00"

  return (
    <div className="p-6 space-y-5">
      {/* Top actions */}
      <div className="flex items-center justify-between">
        <Link href="/">
          <button
            className="inline-flex items-center gap-2 text-[11px] tracking-wider uppercase transition-colors text-[#5a5a70] hover:text-[#9ca3af]"
            style={mono}
          >
            <ArrowLeft size={11} /> Back to Dashboard
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors text-[#5a5a70] hover:text-[#9ca3af]"
            style={{ ...mono, background: "#0a0a0d", borderColor: "#1e1e26" }}
          >
            <Download size={11} /> Export PDF
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-widest uppercase border transition-colors text-[#5a5a70] hover:text-[#9ca3af]"
            style={{ ...mono, background: "#0a0a0d", borderColor: "#1e1e26" }}
          >
            <Printer size={11} /> Print Report
          </button>
        </div>
      </div>

      {/* Report header banner */}
      <div
        className="border border-[#1e1e26] px-6 py-4 flex items-start justify-between"
        style={{ background: "#0a0a0d" }}
      >
        <div>
          <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: "#4a4a5e" }}>
            Compliance Verification Report
          </div>
          <h1 className="text-white mb-0.5" style={{ fontSize: "22px", fontWeight: 700 }}>
            {check.productName}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-[11px]" style={{ color: "#6b6b80" }}>
              {check.manufacturer}
            </span>
            <span style={{ color: "#2a2a35" }}>&middot;</span>
            <span className="text-[11px]" style={{ color: "#6b6b80" }}>
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
          <div className="text-[10px] flex flex-col items-end gap-0.5" style={{ ...mono, color: "#4a4a5e" }}>
            <span>REF: {refId}</span>
            <span>FILED: {new Date(check.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Metadata strip */}
      <div className="grid grid-cols-4 border border-[#1e1e26]" style={{ background: "#09090c" }}>
        {[
          { label: "OVERALL SCORE", value: `${check.overallScore}%`, color: overallColor },
          { label: "STANDARDS PASSED", value: `${passedCount} / ${totalCount}`, color: "#9ca3af" },
          { label: "DATE PROCESSED", value: new Date(check.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase(), color: "#9ca3af" },
          { label: "JURISDICTION", value: "IEC \u00b7 FCC \u00b7 UL \u00b7 EU", color: "#9ca3af" },
        ].map((item) => (
          <div
            key={item.label}
            className="px-5 py-3 border-r border-[#1e1e26] last:border-r-0"
          >
            <div className="text-[9px] tracking-[0.18em] uppercase mb-1.5" style={{ ...mono, color: "#4a4a5e" }}>
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
          className="px-4 py-2.5 border border-b-0 border-[#1e1e26] flex items-center justify-between"
          style={{ background: "#0a0a0d" }}
        >
          <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#5a5a70" }}>
            Standards Breakdown
          </span>
          <span className="text-[10px]" style={{ ...mono, color: "#3a3a50" }}>
            {totalCount} standards evaluated
          </span>
        </div>

        <div className="border border-[#1e1e26]">
          {/* Header */}
          <div
            className="grid border-b border-[#1e1e26]"
            style={{
              gridTemplateColumns: "24px 130px 100px 1fr 180px 90px",
              background: "#0d0d12",
            }}
          >
            {["", "STANDARD", "CATEGORY", "DESCRIPTION", "TEST DETAILS", "SCORE"].map((h) => (
              <div
                key={h || 'icon'}
                className="px-4 py-2.5 text-[9px] tracking-widest uppercase"
                style={{ ...mono, color: "#3a3a50", borderRight: "1px solid #141419" }}
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
                className="grid border-b border-[#131318]"
                style={{
                  gridTemplateColumns: "24px 130px 100px 1fr 180px 90px",
                  background: idx % 2 === 0 ? "#09090c" : "#0b0b0f",
                  borderLeft: `2px solid ${passedRow ? "#134a26" : std.status === "failed" ? "#7f1d1d" : "#78350f"}`,
                }}
              >
                <div
                  className="flex items-center justify-center py-3"
                  style={{ borderRight: "1px solid #141419" }}
                >
                  {passedRow ? (
                    <CheckCircle2 size={12} color="#4ade80" />
                  ) : std.status === "failed" ? (
                    <XCircle size={12} color="#f87171" />
                  ) : (
                    <AlertCircle size={12} color="#fbbf24" />
                  )}
                </div>
                <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #141419" }}>
                  <span className="text-[11px] text-white" style={{ ...mono, fontWeight: 600 }}>
                    {std.name}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #141419" }}>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] tracking-widest uppercase border"
                    style={{ ...mono, color: meta.color, background: meta.bg, borderColor: meta.border }}
                  >
                    {getCatIcon(std.category)} {meta.label}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center" style={{ borderRight: "1px solid #141419" }}>
                  <span className="text-[11px]" style={{ color: "#6b6b80" }}>
                    {std.description}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-start" style={{ borderRight: "1px solid #141419" }}>
                  <span className="text-[10px] leading-relaxed" style={{ color: "#5a5a70" }}>
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
            className="px-4 py-2.5 border border-b-0 border-[#2a1515]"
            style={{ background: "#120505" }}
          >
            <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#7f3333" }}>
              Findings Requiring Corrective Action
            </span>
          </div>
          <div className="border border-[#2a1515]" style={{ background: "#0d0505" }}>
            {check.standards
              .filter((s) => s.status === "failed")
              .map((std) => (
                <div
                  key={std.id}
                  className="grid border-b border-[#1a0808] last:border-b-0"
                  style={{ gridTemplateColumns: "130px 1fr 200px" }}
                >
                  <div
                    className="px-4 py-3 flex items-center"
                    style={{ borderRight: "1px solid #1a0808" }}
                  >
                    <span className="text-[11px]" style={{ ...mono, color: "#f87171", fontWeight: 600 }}>
                      {std.name}
                    </span>
                  </div>
                  <div className="px-4 py-3" style={{ borderRight: "1px solid #1a0808" }}>
                    <p className="text-[11px] leading-relaxed" style={{ color: "#9b6b6b" }}>
                      {std.details}
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[10px] leading-relaxed" style={{ color: "#7a3a3a" }}>
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
        className="flex items-center justify-between px-4 py-2.5 border border-[#1e1e26]"
        style={{ background: "#08080b" }}
      >
        <span className="text-[9px] tracking-widest" style={{ ...mono, color: "#3a3a50" }}>
          BEAMLEDGER CVRS &middot; Report {refId} &middot; Generated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}
        </span>
        <span className="text-[9px]" style={{ ...mono, color: "#3a3a50" }}>
          This report is for regulatory reference only. Not for public distribution.
        </span>
      </div>
    </div>
  )
}
