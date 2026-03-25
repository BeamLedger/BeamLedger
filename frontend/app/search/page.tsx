"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  Search, Filter, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  AlertCircle, ArrowRight, ArrowUpDown, X, Calendar, Download,
} from "lucide-react"
import { sampleFixtures } from "../../lib/compliance/sampleData"
import { evaluateFixture, computeComplianceScore } from "../../lib/compliance/engine"
import { STANDARD_DEFINITIONS } from "../../lib/compliance/standards"
import type { Fixture, ComplianceStatus, StandardId, SortField, SortDirection, FixtureEvaluation } from "../../lib/compliance/types"

const mono = { fontFamily: "'Ubin Sans', monospace" } as const

// ── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ── Highlight matched terms ──────────────────────────────────────────────────

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <>{text}</>
  const terms = query.trim().split(/\s+/).filter(Boolean)
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi")
  const parts = text.split(pattern)
  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark
            key={i}
            style={{ background: "#fef08a", color: "#1f2937", padding: "0 1px", borderRadius: "1px" }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ComplianceStatus }) {
  const config: Record<ComplianceStatus, { color: string; bg: string; border: string; label: string; Icon: typeof CheckCircle2 }> = {
    pass:       { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", label: "PASS",       Icon: CheckCircle2 },
    fail:       { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", label: "FAIL",       Icon: XCircle },
    exempt:     { color: "#2563eb", bg: "#eff6ff", border: "#93c5fd", label: "EXEMPT",     Icon: AlertCircle },
    data_error: { color: "#d97706", bg: "#fffbeb", border: "#fcd34d", label: "DATA ERROR", Icon: AlertCircle },
  }
  const c = config[status]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] tracking-widest uppercase border whitespace-nowrap"
      style={{ ...mono, color: c.color, background: c.bg, borderColor: c.border }}
    >
      <c.Icon size={9} /> {c.label}
    </span>
  )
}

// ── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626"
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="flex-1 h-1.5 bg-gray-200 overflow-hidden" style={{ minWidth: 0, maxWidth: "48px" }}>
        <div
          className="h-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-[10px] flex-shrink-0" style={{ ...mono, color }}>
        {score}%
      </span>
    </div>
  )
}

// ── Filter checkbox ──────────────────────────────────────────────────────────

function FilterCheckbox({
  label, checked, onChange, color,
}: { label: string; checked: boolean; onChange: () => void; color?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer py-0.5">
      <div
        className="w-3 h-3 border flex items-center justify-center flex-shrink-0"
        style={{ borderColor: checked ? (color || "#991b1b") : "#d1d5db", background: checked ? (color || "#991b1b") : "transparent" }}
      >
        {checked && (
          <svg viewBox="0 0 10 10" className="w-2 h-2" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <span className="text-[11px]" style={{ color: color || "#4b5563" }}>{label}</span>
    </label>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [rawQuery, setRawQuery] = useState("")
  const debouncedQuery = useDebounce(rawQuery, 300)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [statusFilters, setStatusFilters] = useState<Set<ComplianceStatus>>(new Set())
  const [standardFilters, setStandardFilters] = useState<Set<StandardId>>(new Set())
  const [sourceFilters, setSourceFilters] = useState<Set<string>>(new Set())
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  // Sort
  const [sortField, setSortField] = useState<SortField>("complianceScore")
  const [sortDir, setSortDir] = useState<SortDirection>("desc")

  // Evaluate all fixtures once
  const evaluations = useMemo(() => {
    const map = new Map<string, FixtureEvaluation>()
    for (const fx of sampleFixtures) {
      map.set(fx.id, evaluateFixture(fx))
    }
    return map
  }, [])

  const toggleStatus = (s: ComplianceStatus) => {
    setStatusFilters((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s); else next.add(s)
      return next
    })
  }

  const toggleStandard = (s: StandardId) => {
    setStandardFilters((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s); else next.add(s)
      return next
    })
  }

  const toggleSource = (s: string) => {
    setSourceFilters((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s); else next.add(s)
      return next
    })
  }

  const clearFilters = () => {
    setStatusFilters(new Set())
    setStandardFilters(new Set())
    setSourceFilters(new Set())
    setDateFrom("")
    setDateTo("")
  }

  const hasActiveFilters = statusFilters.size > 0 || standardFilters.size > 0 || sourceFilters.size > 0 || dateFrom || dateTo

  // Filter + search + sort
  const filteredFixtures = useMemo(() => {
    let list = [...sampleFixtures]

    // Text search
    if (debouncedQuery.trim()) {
      const terms = debouncedQuery.toLowerCase().split(/\s+/).filter(Boolean)
      list = list.filter((fx) => {
        const searchable = [
          fx.id, fx.assetTag, fx.fixtureName, fx.manufacturer, fx.model,
          fx.fixtureType, String(fx.wattage), String(fx.lumenOutput),
          String(fx.cct), String(fx.cri), fx.spaceType,
          ...fx.applicableStandards.map((s) => STANDARD_DEFINITIONS[s]?.name ?? s),
        ].join(" ").toLowerCase()
        return terms.every((t) => searchable.includes(t))
      })
    }

    // Compliance status filter
    if (statusFilters.size > 0) {
      list = list.filter((fx) => {
        const ev = evaluations.get(fx.id)
        return ev && statusFilters.has(ev.overallStatus)
      })
    }

    // Standard filter
    if (standardFilters.size > 0) {
      list = list.filter((fx) =>
        fx.applicableStandards.some((s) => standardFilters.has(s))
      )
    }

    // Source filter
    if (sourceFilters.size > 0) {
      list = list.filter((fx) => sourceFilters.has(fx.importSource))
    }

    // Date range
    if (dateFrom) {
      const from = new Date(dateFrom).getTime()
      list = list.filter((fx) => new Date(fx.importedAt).getTime() >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000
      list = list.filter((fx) => new Date(fx.importedAt).getTime() <= to)
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0
      if (sortField === "complianceScore") {
        const sa = computeComplianceScore(evaluations.get(a.id)?.results ?? [])
        const sb = computeComplianceScore(evaluations.get(b.id)?.results ?? [])
        cmp = sa - sb
      } else if (sortField === "importedAt") {
        cmp = new Date(a.importedAt).getTime() - new Date(b.importedAt).getTime()
      } else if (sortField === "fixtureName") {
        cmp = (a.fixtureName || "").localeCompare(b.fixtureName || "")
      }
      return sortDir === "desc" ? -cmp : cmp
    })

    return list
  }, [debouncedQuery, statusFilters, standardFilters, sourceFilters, dateFrom, dateTo, sortField, sortDir, evaluations])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={10} style={{ opacity: 0.3 }} />
    return sortDir === "desc" ? <ChevronDown size={10} /> : <ChevronUp size={10} />
  }

  // Stats
  const stats = useMemo(() => {
    let pass = 0, fail = 0, error = 0, exempt = 0
    for (const fx of filteredFixtures) {
      const ev = evaluations.get(fx.id)
      if (!ev) continue
      if (ev.overallStatus === "pass") pass++
      else if (ev.overallStatus === "fail") fail++
      else if (ev.overallStatus === "exempt") exempt++
      else error++
    }
    return { pass, fail, error, exempt, total: filteredFixtures.length }
  }, [filteredFixtures, evaluations])

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#e5e7eb] pb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ ...mono, color: "#6b7280" }}>
            Module: Fixture Search & Compliance
          </p>
          <h1 className="tracking-tight" style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937" }}>
            Search Fixtures
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
            Real-time search across all fixture data with compliance evaluation
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
          <input
            className="w-full pl-9 pr-8 py-2.5 text-[12px] border outline-none transition-colors"
            style={{ background: "#ffffff", borderColor: "#e5e7eb", color: "#1f2937" }}
            placeholder="Search by ID, name, manufacturer, wattage, CCT, CRI, space type, standard..."
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
          />
          {rawQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
              onClick={() => setRawQuery("")}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border transition-colors"
          style={{
            ...mono,
            background: showFilters ? "rgba(127,29,29,0.08)" : "#f9fafb",
            borderColor: showFilters ? "#991b1b" : "#e5e7eb",
            color: showFilters ? "#7f1d1d" : "#6b7280",
          }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={12} />
          Filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#991b1b]" />
          )}
        </button>
      </div>

      {/* Filter pane */}
      {showFilters && (
        <div className="border border-[#e5e7eb] p-4" style={{ background: "#fafafa" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
              Filter Options
            </span>
            {hasActiveFilters && (
              <button
                className="text-[10px] tracking-widest uppercase hover:underline"
                style={{ ...mono, color: "#991b1b" }}
                onClick={clearFilters}
              >
                Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-6">
            {/* Compliance Status */}
            <div>
              <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: "#9ca3af" }}>
                Compliance Status
              </div>
              <div className="space-y-1">
                <FilterCheckbox label="Pass" checked={statusFilters.has("pass")} onChange={() => toggleStatus("pass")} color="#16a34a" />
                <FilterCheckbox label="Fail" checked={statusFilters.has("fail")} onChange={() => toggleStatus("fail")} color="#dc2626" />
                <FilterCheckbox label="Exempt" checked={statusFilters.has("exempt")} onChange={() => toggleStatus("exempt")} color="#2563eb" />
                <FilterCheckbox label="Data Error" checked={statusFilters.has("data_error")} onChange={() => toggleStatus("data_error")} color="#d97706" />
              </div>
            </div>

            {/* Standards */}
            <div>
              <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: "#9ca3af" }}>
                Standard
              </div>
              <div className="space-y-1">
                {(Object.entries(STANDARD_DEFINITIONS) as [StandardId, { name: string }][]).map(([id, def]) => (
                  <FilterCheckbox key={id} label={def.name} checked={standardFilters.has(id)} onChange={() => toggleStandard(id)} />
                ))}
              </div>
            </div>

            {/* Import Source */}
            <div>
              <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: "#9ca3af" }}>
                Import Source
              </div>
              <div className="space-y-1">
                <FilterCheckbox label="Manual" checked={sourceFilters.has("manual")} onChange={() => toggleSource("manual")} />
                <FilterCheckbox label="CSV" checked={sourceFilters.has("csv")} onChange={() => toggleSource("csv")} />
                <FilterCheckbox label="XLSX" checked={sourceFilters.has("xlsx")} onChange={() => toggleSource("xlsx")} />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: "#9ca3af" }}>
                Date Imported
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[9px] block mb-0.5" style={{ ...mono, color: "#9ca3af" }}>From</label>
                  <input
                    type="date"
                    className="w-full px-2 py-1 text-[11px] border"
                    style={{ borderColor: "#e5e7eb", color: "#4b5563" }}
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] block mb-0.5" style={{ ...mono, color: "#9ca3af" }}>To</label>
                  <input
                    type="date"
                    className="w-full px-2 py-1 text-[11px] border"
                    style={{ borderColor: "#e5e7eb", color: "#4b5563" }}
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-5 border border-[#e5e7eb]" style={{ background: "#f9fafb" }}>
        {[
          { label: "TOTAL", value: stats.total, color: "#6b7280" },
          { label: "PASS", value: stats.pass, color: "#16a34a" },
          { label: "FAIL", value: stats.fail, color: "#dc2626" },
          { label: "EXEMPT", value: stats.exempt, color: "#2563eb" },
          { label: "DATA ERROR", value: stats.error, color: "#d97706" },
        ].map((s) => (
          <div key={s.label} className="px-4 py-2.5 border-r border-[#e5e7eb] last:border-r-0">
            <div className="text-[9px] tracking-widest uppercase mb-1" style={{ ...mono, color: "#9ca3af" }}>
              {s.label}
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: s.color, ...mono }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Results table */}
      <div>
        <div
          className="flex items-center justify-between px-4 py-2 border border-b-0 border-[#e5e7eb]"
          style={{ background: "#f9fafb" }}
        >
          <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
            Search Results
          </span>
          <span className="text-[10px]" style={{ ...mono, color: "#9ca3af" }}>
            {filteredFixtures.length} of {sampleFixtures.length} fixtures
          </span>
        </div>

        <div className="border border-[#e5e7eb]" style={{ background: "#ffffff" }}>
          {/* Header */}
          <div
            className="grid border-b border-[#e5e7eb]"
            style={{
              gridTemplateColumns: "80px 1fr 120px 70px 70px 100px 110px 120px 36px",
              background: "#f9fafb",
            }}
          >
            {[
              { label: "ASSET TAG", field: null },
              { label: "FIXTURE NAME", field: "fixtureName" as SortField },
              { label: "MANUFACTURER", field: null },
              { label: "WATTAGE", field: null },
              { label: "LUMENS", field: null },
              { label: "SPACE TYPE", field: null },
              { label: "SCORE", field: "complianceScore" as SortField },
              { label: "STATUS", field: null },
              { label: "", field: null },
            ].map((h, i) => (
              <div
                key={h.label || `col-${i}`}
                className={`px-3 py-2 text-[9px] tracking-[0.15em] uppercase flex items-center gap-1 ${h.field ? "cursor-pointer hover:text-[#7f1d1d]" : ""}`}
                style={{ ...mono, color: "#6b7280", borderRight: "1px solid #f0f0f2" }}
                onClick={h.field ? () => toggleSort(h.field!) : undefined}
              >
                {h.label}
                {h.field && <SortIcon field={h.field} />}
              </div>
            ))}
          </div>

          {/* Rows */}
          {filteredFixtures.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Search size={24} style={{ color: "#d1d5db", margin: "0 auto 8px" }} />
              <p className="text-[12px]" style={{ color: "#9ca3af" }}>
                No fixtures match your search criteria.
              </p>
            </div>
          ) : (
            filteredFixtures.map((fx, idx) => {
              const ev = evaluations.get(fx.id)!
              const score = computeComplianceScore(ev.results)
              return (
                <div
                  key={fx.id}
                  className="grid border-b border-[#f0f0f2] transition-colors hover:!bg-[#f5f5fa] min-w-0"
                  style={{
                    gridTemplateColumns: "80px 1fr 120px 70px 70px 100px 110px 120px 36px",
                    background: idx % 2 === 0 ? "#ffffff" : "#fafafa",
                  }}
                >
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[10px] truncate" style={{ ...mono, color: "#6b7280" }}>
                      <HighlightText text={fx.assetTag} query={debouncedQuery} />
                    </span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <div className="min-w-0">
                      <div className="text-[12px] truncate" style={{ fontWeight: 500, color: "#1f2937" }}>
                        <HighlightText text={fx.fixtureName} query={debouncedQuery} />
                      </div>
                      <div className="text-[10px] truncate" style={{ color: "#9ca3af" }}>
                        <HighlightText text={fx.fixtureType} query={debouncedQuery} />
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[11px] truncate" style={{ color: "#6b7280" }}>
                      <HighlightText text={fx.manufacturer} query={debouncedQuery} />
                    </span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[11px]" style={{ ...mono, color: "#4b5563" }}>
                      {fx.wattage}W
                    </span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[11px]" style={{ ...mono, color: "#4b5563" }}>
                      {fx.lumenOutput}
                    </span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <span className="text-[10px] truncate" style={{ color: "#6b7280" }}>
                      <HighlightText text={fx.spaceType} query={debouncedQuery} />
                    </span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <ScoreBar score={score} />
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                    <StatusBadge status={ev.overallStatus} />
                  </div>
                  <div className="px-1 py-2.5 flex items-center justify-center">
                    <Link href={`/results/${fx.id}`}>
                      <button className="p-1 transition-colors text-[#9ca3af] hover:text-[#7f1d1d]" title="View Details">
                        <ArrowRight size={14} />
                      </button>
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2 border border-[#e5dfd0]"
        style={{ background: "#fdfcf8" }}
      >
        <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: "#92800a" }}>
          Client-side evaluation — dataset &lt; 10K rows
        </span>
        <span className="text-[9px]" style={{ ...mono, color: "#a0903a" }}>
          ASHRAE 90.1 &middot; Title 24 &middot; IES &middot; DLC QPL &middot; IECC
        </span>
      </div>
    </div>
  )
}
