"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Search, Filter, ChevronDown, ChevronUp, ArrowRight, ArrowUpDown, X, Download,
} from "lucide-react"
import { sampleFixtures } from "../../lib/compliance/sampleData"
import { evaluateFixture, computeComplianceScore } from "../../lib/compliance/engine"
import { STANDARD_DEFINITIONS } from "../../lib/compliance/standards"
import { colors, mono, scoreColor } from "../../lib/designTokens"
import type { StatusKey } from "../../lib/designTokens"
import type { Fixture, ComplianceStatus, StandardId, SortField, SortDirection, FixtureEvaluation } from "../../lib/compliance/types"
import PageHeader from "../../components/PageHeader"
import StatCard from "../../components/StatCard"
import SectionHeader from "../../components/SectionHeader"
import FooterBar from "../../components/FooterBar"
import StatusBadge from "../../components/StatusBadge"
import ScoreBarComponent from "../../components/ScoreBar"

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
          <mark key={i} style={{ background: "#fef08a", color: colors.text.primary, padding: "0 1px" }}>{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
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
        style={{ borderColor: checked ? (color || colors.maroon[700]) : colors.text.faint, background: checked ? (color || colors.maroon[700]) : "transparent" }}
      >
        {checked && (
          <svg viewBox="0 0 10 10" className="w-2 h-2" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <span className="text-[11px]" style={{ color: color || colors.text.secondary }}>{label}</span>
    </label>
  )
}

// ── Score Histogram ──────────────────────────────────────────────────────────

function ScoreHistogram({ scores }: { scores: number[] }) {
  const buckets = [
    { label: "0-20", min: 0, max: 20 },
    { label: "21-40", min: 21, max: 40 },
    { label: "41-60", min: 41, max: 60 },
    { label: "61-80", min: 61, max: 80 },
    { label: "81-100", min: 81, max: 100 },
  ]
  const counts = buckets.map((b) => scores.filter((s) => s >= b.min && s <= b.max).length)
  const max = Math.max(...counts, 1)

  return (
    <div className="flex items-end gap-1" style={{ height: 40 }}>
      {buckets.map((b, i) => (
        <div key={b.label} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full transition-all"
            style={{
              height: `${Math.max(2, (counts[i] / max) * 32)}px`,
              background: scoreColor((b.min + b.max) / 2),
              opacity: counts[i] === 0 ? 0.2 : 1,
            }}
          />
          <span className="text-[7px]" style={{ ...mono, color: colors.text.muted }}>{b.label}</span>
        </div>
      ))}
    </div>
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
    setStatusFilters((prev) => { const next = new Set(prev); if (next.has(s)) next.delete(s); else next.add(s); return next })
  }
  const toggleStandard = (s: StandardId) => {
    setStandardFilters((prev) => { const next = new Set(prev); if (next.has(s)) next.delete(s); else next.add(s); return next })
  }
  const toggleSource = (s: string) => {
    setSourceFilters((prev) => { const next = new Set(prev); if (next.has(s)) next.delete(s); else next.add(s); return next })
  }
  const clearFilters = () => {
    setStatusFilters(new Set()); setStandardFilters(new Set()); setSourceFilters(new Set()); setDateFrom(""); setDateTo("")
  }
  const hasActiveFilters = statusFilters.size > 0 || standardFilters.size > 0 || sourceFilters.size > 0 || dateFrom || dateTo

  // Filter + search + sort
  const filteredFixtures = useMemo(() => {
    let list = [...sampleFixtures]

    // Text search — each field searched individually for proper matching
    if (debouncedQuery.trim()) {
      const terms = debouncedQuery.toLowerCase().split(/\s+/).filter(Boolean)
      list = list.filter((fx) => {
        const fields = [
          fx.id, fx.assetTag, fx.fixtureName, fx.manufacturer, fx.model,
          fx.fixtureType, String(fx.wattage), String(fx.lumenOutput),
          String(fx.cct), String(fx.cri), fx.spaceType,
          ...fx.applicableStandards.map((s) => STANDARD_DEFINITIONS[s]?.name ?? s),
        ].map((f) => f.toLowerCase())
        return terms.every((t) => fields.some((f) => f.includes(t)))
      })
    }

    // Compliance status filter
    if (statusFilters.size > 0) {
      list = list.filter((fx) => { const ev = evaluations.get(fx.id); return ev && statusFilters.has(ev.overallStatus) })
    }
    // Standard filter
    if (standardFilters.size > 0) {
      list = list.filter((fx) => fx.applicableStandards.some((s) => standardFilters.has(s)))
    }
    // Source filter
    if (sourceFilters.size > 0) {
      list = list.filter((fx) => sourceFilters.has(fx.importSource))
    }
    // Date range
    if (dateFrom) { const from = new Date(dateFrom).getTime(); list = list.filter((fx) => new Date(fx.importedAt).getTime() >= from) }
    if (dateTo) { const to = new Date(dateTo).getTime() + 86400000; list = list.filter((fx) => new Date(fx.importedAt).getTime() <= to) }

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
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    else { setSortField(field); setSortDir("desc") }
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

  // Score distribution for histogram
  const scores = useMemo(() => {
    return filteredFixtures.map((fx) => computeComplianceScore(evaluations.get(fx.id)?.results ?? []))
  }, [filteredFixtures, evaluations])

  // CSV export
  const exportCSV = () => {
    const header = "Asset Tag,Fixture Name,Manufacturer,Type,Wattage,Lumens,CCT,CRI,Space Type,Score,Status\n"
    const rows = filteredFixtures.map((fx) => {
      const ev = evaluations.get(fx.id)!
      const score = computeComplianceScore(ev.results)
      return [fx.assetTag, `"${fx.fixtureName}"`, `"${fx.manufacturer}"`, fx.fixtureType, fx.wattage, fx.lumenOutput, fx.cct, fx.cri, fx.spaceType, score, ev.overallStatus].join(",")
    }).join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "beamledger-fixtures.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      {/* Header */}
      <PageHeader
        module="Fixture Search & Compliance"
        title="Search Fixtures"
        subtitle="Real-time search across all fixture data with compliance evaluation"
        actions={
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-[11px] tracking-widest uppercase border transition-colors hover:opacity-90"
            style={{ ...mono, background: colors.bg.panel, borderColor: colors.border.default, color: colors.text.tertiary }}
          >
            <Download size={12} /> Export CSV
          </button>
        }
      />

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.muted }} />
          <input
            className="w-full pl-9 pr-8 py-2.5 text-[12px] border outline-none transition-colors"
            style={{ background: colors.bg.page, borderColor: colors.border.default, color: colors.text.primary }}
            placeholder="Search by ID, name, manufacturer, wattage, CCT, CRI, space type, standard..."
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
          />
          {rawQuery && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.muted }} onClick={() => setRawQuery("")}>
              <X size={12} />
            </button>
          )}
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border transition-colors"
          style={{
            ...mono,
            background: showFilters ? colors.maroon[100] : colors.bg.panel,
            borderColor: showFilters ? colors.maroon[700] : colors.border.default,
            color: showFilters ? colors.maroon[800] : colors.text.tertiary,
          }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={12} /> Filters
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.maroon[700] }} />}
        </button>
      </div>

      {/* Filter pane */}
      {showFilters && (
        <div className="border p-4" style={{ borderColor: colors.border.default, background: colors.bg.alt }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: colors.text.tertiary }}>Filter Options</span>
            {hasActiveFilters && (
              <button className="text-[10px] tracking-widest uppercase hover:underline" style={{ ...mono, color: colors.maroon[700] }} onClick={clearFilters}>
                Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: colors.text.muted }}>Compliance Status</div>
              <div className="space-y-1">
                <FilterCheckbox label="Pass" checked={statusFilters.has("pass")} onChange={() => toggleStatus("pass")} color={colors.pass.fg} />
                <FilterCheckbox label="Fail" checked={statusFilters.has("fail")} onChange={() => toggleStatus("fail")} color={colors.fail.fg} />
                <FilterCheckbox label="Exempt" checked={statusFilters.has("exempt")} onChange={() => toggleStatus("exempt")} color={colors.exempt.fg} />
                <FilterCheckbox label="Data Error" checked={statusFilters.has("data_error")} onChange={() => toggleStatus("data_error")} color={colors.dataError.fg} />
              </div>
            </div>
            <div>
              <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: colors.text.muted }}>Standard</div>
              <div className="space-y-1">
                {(Object.entries(STANDARD_DEFINITIONS) as [StandardId, { name: string }][]).map(([id, def]) => (
                  <FilterCheckbox key={id} label={def.name} checked={standardFilters.has(id)} onChange={() => toggleStandard(id)} />
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: colors.text.muted }}>Import Source</div>
              <div className="space-y-1">
                <FilterCheckbox label="Manual" checked={sourceFilters.has("manual")} onChange={() => toggleSource("manual")} />
                <FilterCheckbox label="CSV" checked={sourceFilters.has("csv")} onChange={() => toggleSource("csv")} />
                <FilterCheckbox label="XLSX" checked={sourceFilters.has("xlsx")} onChange={() => toggleSource("xlsx")} />
              </div>
            </div>
            <div>
              <div className="text-[9px] tracking-widest uppercase mb-2" style={{ ...mono, color: colors.text.muted }}>Date Imported</div>
              <div className="space-y-2">
                <div>
                  <label className="text-[9px] block mb-0.5" style={{ ...mono, color: colors.text.muted }}>From</label>
                  <input type="date" className="w-full px-2 py-1 text-[11px] border" style={{ borderColor: colors.border.default, color: colors.text.secondary }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] block mb-0.5" style={{ ...mono, color: colors.text.muted }}>To</label>
                  <input type="date" className="w-full px-2 py-1 text-[11px] border" style={{ borderColor: colors.border.default, color: colors.text.secondary }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats strip + histogram */}
      <div className="grid grid-cols-6 border" style={{ borderColor: colors.border.default, background: colors.bg.panel }}>
        <StatCard label="Total" value={stats.total} color={colors.text.tertiary} />
        <StatCard label="Pass" value={stats.pass} color={colors.pass.fg} />
        <StatCard label="Fail" value={stats.fail} color={colors.fail.fg} />
        <StatCard label="Exempt" value={stats.exempt} color={colors.exempt.fg} />
        <StatCard label="Data Error" value={stats.error} color={colors.dataError.fg} />
        <div className="px-4 py-3">
          <div className="text-[9px] tracking-widest uppercase mb-1.5" style={{ ...mono, color: colors.text.muted }}>
            Score Distribution
          </div>
          <ScoreHistogram scores={scores} />
        </div>
      </div>

      {/* Results table */}
      <div>
        <SectionHeader title="Search Results" right={`${filteredFixtures.length} of ${sampleFixtures.length} fixtures`} />

        <div className="border border-t-0" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
          {/* Header */}
          <div
            className="grid border-b"
            style={{
              gridTemplateColumns: "80px 1fr 120px 70px 70px 100px 110px 120px 36px",
              background: colors.bg.panel,
              borderColor: colors.border.default,
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
                style={{ ...mono, color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}
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
              <Search size={24} style={{ color: colors.text.faint, margin: "0 auto 8px" }} />
              <p className="text-[12px]" style={{ color: colors.text.muted }}>No fixtures match your search criteria.</p>
            </div>
          ) : (
            filteredFixtures.map((fx, idx) => {
              const ev = evaluations.get(fx.id)!
              const score = computeComplianceScore(ev.results)
              return (
                <div
                  key={fx.id}
                  className="grid border-b transition-colors hover:!bg-[#f5f5fa] min-w-0"
                  style={{
                    gridTemplateColumns: "80px 1fr 120px 70px 70px 100px 110px 120px 36px",
                    background: idx % 2 === 0 ? colors.bg.page : colors.bg.alt,
                    borderColor: colors.border.light,
                  }}
                >
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[10px] truncate" style={{ ...mono, color: colors.text.tertiary }}>
                      <HighlightText text={fx.assetTag} query={debouncedQuery} />
                    </span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <div className="min-w-0">
                      <div className="text-[12px] truncate" style={{ fontWeight: 500, color: colors.text.primary }}>
                        <HighlightText text={fx.fixtureName} query={debouncedQuery} />
                      </div>
                      <div className="text-[10px] truncate" style={{ color: colors.text.muted }}>
                        <HighlightText text={fx.fixtureType} query={debouncedQuery} />
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[11px] truncate" style={{ color: colors.text.tertiary }}>
                      <HighlightText text={fx.manufacturer} query={debouncedQuery} />
                    </span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[11px]" style={{ ...mono, color: colors.text.secondary }}>{fx.wattage}W</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[11px]" style={{ ...mono, color: colors.text.secondary }}>{fx.lumenOutput}</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <span className="text-[10px] truncate" style={{ color: colors.text.tertiary }}>
                      <HighlightText text={fx.spaceType} query={debouncedQuery} />
                    </span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <ScoreBarComponent score={score} />
                  </div>
                  <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                    <StatusBadge status={ev.overallStatus as StatusKey} />
                  </div>
                  <div className="px-1 py-2.5 flex items-center justify-center">
                    <Link href={`/results/${fx.id}`}>
                      <button className="p-1 transition-colors hover:text-[#7f1d1d]" style={{ color: colors.text.muted }} title="View Details">
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

      <FooterBar
        left="Client-side evaluation — dataset < 10K rows"
        right="ASHRAE 90.1 · Title 24 · IES · DLC QPL · IECC"
      />
    </div>
  )
}
