"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, XCircle,
  Download, ChevronRight, X, FileText, Info, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const

// ── Types ────────────────────────────────────────────────────────────────────

interface ParsedRow {
  rowNumber: number
  data: Record<string, string>
}

interface RowValidation {
  rowNumber: number
  outcome: "valid" | "error" | "warning"
  errors: { field: string; message: string }[]
  warnings: { field: string; message: string }[]
}

interface ImportState {
  phase: "idle" | "preview" | "importing" | "complete"
  fileName: string
  fileType: "csv" | "xlsx" | ""
  headers: string[]
  rows: ParsedRow[]
  validations: RowValidation[]
  importedCount: number
  skippedCount: number
  errorCount: number
}

const REQUIRED_COLUMNS = ["asset_tag", "fixture_type", "wattage", "lumens"]
const ALL_KNOWN_COLUMNS = [
  "asset_tag", "fixture_name", "fixture_type", "manufacturer", "model",
  "wattage", "lumens", "cct", "cri", "quantity", "space_type", "space_area",
  "applicable_standards", "shielding", "tilt", "mount_height", "uplight_rating",
  "bug_rating", "installation_status", "notes", "site_id", "zone_id",
]

// ── Validation logic ─────────────────────────────────────────────────────────

function validateRow(row: ParsedRow, seenTags: Set<string>): RowValidation {
  const errors: { field: string; message: string }[] = []
  const warnings: { field: string; message: string }[] = []
  const data = row.data

  // Required fields
  for (const col of REQUIRED_COLUMNS) {
    const val = (data[col] || "").trim()
    if (!val) {
      errors.push({ field: col, message: `Missing required field: ${col}` })
    }
  }

  // Numeric validation
  for (const col of ["wattage", "lumens", "cct", "cri", "quantity", "space_area", "tilt", "mount_height"]) {
    const val = (data[col] || "").trim()
    if (val && val.toLowerCase() !== "none") {
      const num = parseFloat(val)
      if (isNaN(num)) {
        errors.push({ field: col, message: `Invalid numeric value: '${val}'` })
      } else if (num < 0 && col !== "tilt") {
        errors.push({ field: col, message: `${col} must be non-negative, got ${num}` })
      }
    }
  }

  // Wattage range
  const wattage = parseFloat(data["wattage"] || "")
  if (!isNaN(wattage) && wattage > 100000) {
    warnings.push({ field: "wattage", message: `Unusually high wattage: ${wattage}W` })
  }

  // Duplicate asset_tag
  const tag = (data["asset_tag"] || "").trim()
  if (tag) {
    if (seenTags.has(tag)) {
      errors.push({ field: "asset_tag", message: `Duplicate asset_tag: '${tag}'` })
    } else {
      seenTags.add(tag)
    }
  }

  // Site or zone
  if (!(data["site_id"] || "").trim() && !(data["zone_id"] || "").trim()) {
    errors.push({ field: "site_id", message: "Missing site_id or zone_id" })
  }

  // Compliance warnings
  if (!(data["space_type"] || "").trim()) {
    warnings.push({ field: "space_type", message: "Missing space_type — LPD compliance cannot be evaluated" })
  }
  if (!(data["applicable_standards"] || "").trim()) {
    warnings.push({ field: "applicable_standards", message: "Missing applicable_standards — no compliance evaluation" })
  }

  const outcome = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid"
  return { rowNumber: row.rowNumber, outcome, errors, warnings }
}

// ── CSV/XLSX Parsing ─────────────────────────────────────────────────────────

function parseCSVText(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  // Simple CSV parse (handles quoted fields)
  function parseLine(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"'
          i++
        } else if (ch === '"') {
          inQuotes = false
        } else {
          current += ch
        }
      } else {
        if (ch === '"') {
          inQuotes = true
        } else if (ch === ",") {
          result.push(current.trim())
          current = ""
        } else {
          current += ch
        }
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim())
  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    const data: Record<string, string> = {}
    headers.forEach((h, j) => {
      data[h] = values[j] || ""
    })
    rows.push({ rowNumber: i + 1, data })
  }
  return { headers, rows }
}

function parseXLSXBuffer(buffer: ArrayBuffer): { headers: string[]; rows: ParsedRow[] } {
  const wb = XLSX.read(buffer, { type: "array" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) return { headers: [], rows: [] }
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" })
  if (jsonData.length === 0) return { headers: [], rows: [] }
  const headers = Object.keys(jsonData[0]).map((h) => h.toLowerCase().trim())
  const rows: ParsedRow[] = jsonData.map((row, i) => {
    const data: Record<string, string> = {}
    for (const key of Object.keys(row)) {
      data[key.toLowerCase().trim()] = String(row[key] ?? "").trim()
    }
    return { rowNumber: i + 2, data }
  })
  return { headers, rows }
}

// ── Error report CSV generation ──────────────────────────────────────────────

function generateErrorReportCSV(validations: RowValidation[]): string {
  const lines = ["row,field,message,severity"]
  for (const v of validations) {
    for (const e of v.errors) {
      lines.push(`${v.rowNumber},"${e.field}","${e.message.replace(/"/g, '""')}",error`)
    }
    for (const w of v.warnings) {
      lines.push(`${v.rowNumber},"${w.field}","${w.message.replace(/"/g, '""')}",warning`)
    }
  }
  return lines.join("\n")
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [state, setState] = useState<ImportState>({
    phase: "idle",
    fileName: "",
    fileType: "",
    headers: [],
    rows: [],
    validations: [],
    importedCount: 0,
    skippedCount: 0,
    errorCount: 0,
  })

  const handleFile = useCallback((file: File) => {
    const name = file.name.toLowerCase()
    const isXlsx = name.endsWith(".xlsx")
    const isCsv = name.endsWith(".csv")
    if (!isXlsx && !isCsv) {
      toast.error("Invalid file format", { description: "Please upload a CSV or XLSX file." })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum file size is 5 MB." })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (!result) return

      let parsed: { headers: string[]; rows: ParsedRow[] }
      if (isXlsx) {
        parsed = parseXLSXBuffer(result as ArrayBuffer)
      } else {
        parsed = parseCSVText(result as string)
      }

      if (parsed.rows.length === 0) {
        toast.error("Empty file", { description: "No data rows found." })
        return
      }

      if (parsed.rows.length > 10000) {
        toast.error("Too many rows", { description: "Maximum 10,000 rows per import." })
        return
      }

      // Check required columns
      const missing = REQUIRED_COLUMNS.filter((c) => !parsed.headers.includes(c))
      if (missing.length > 0) {
        toast.error("Missing required columns", {
          description: `Required: ${missing.join(", ")}`,
        })
        return
      }

      // Validate all rows
      const seenTags = new Set<string>()
      const validations = parsed.rows.map((row) => validateRow(row, seenTags))

      setState({
        phase: "preview",
        fileName: file.name,
        fileType: isXlsx ? "xlsx" : "csv",
        headers: parsed.headers,
        rows: parsed.rows,
        validations,
        importedCount: 0,
        skippedCount: 0,
        errorCount: 0,
      })
    }

    if (isXlsx) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleImport = useCallback(() => {
    // Simulate server-side import using client-side validation
    const valid = state.validations.filter((v) => v.outcome !== "error").length
    const invalid = state.validations.filter((v) => v.outcome === "error").length

    setState((s) => ({ ...s, phase: "importing" }))

    // Simulated delay for realistic UX
    setTimeout(() => {
      setState((s) => ({
        ...s,
        phase: "complete",
        importedCount: valid,
        skippedCount: invalid,
        errorCount: invalid,
      }))
      toast.success("Import complete", {
        description: `${valid} imported, ${invalid} skipped.`,
      })
    }, 800)
  }, [state.validations])

  const handleDownloadErrors = useCallback(() => {
    const errorsOnly = state.validations.filter((v) => v.errors.length > 0 || v.warnings.length > 0)
    const csv = generateErrorReportCSV(errorsOnly)
    downloadBlob(csv, `import_errors_${Date.now()}.csv`, "text/csv")
  }, [state.validations])

  const handleReset = useCallback(() => {
    setState({
      phase: "idle",
      fileName: "",
      fileType: "",
      headers: [],
      rows: [],
      validations: [],
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
    })
  }, [])

  const stats = useMemo(() => {
    const valid = state.validations.filter((v) => v.outcome === "valid").length
    const warnings = state.validations.filter((v) => v.outcome === "warning").length
    const errors = state.validations.filter((v) => v.outcome === "error").length
    return { valid, warnings, errors, total: state.rows.length }
  }, [state.validations, state.rows])

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#e5e7eb] pb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ ...mono, color: "#6b7280" }}>
            Module: Data Import
          </p>
          <h1 className="tracking-tight" style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937" }}>
            Import Fixtures
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
            Upload CSV or XLSX files with fixture data. All rows are validated before import.
          </p>
        </div>
        {state.phase !== "idle" && (
          <button
            className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border transition-colors hover:opacity-90"
            style={{ ...mono, borderColor: "#e5e7eb", color: "#6b7280" }}
            onClick={handleReset}
          >
            <X size={12} /> Reset
          </button>
        )}
      </div>

      {/* ── Phase: Idle — Upload zone ────────────────────────────────────────── */}
      {state.phase === "idle" && (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${dragOver ? "border-[#991b1b] bg-[rgba(127,29,29,0.04)]" : "border-[#d1d5db] hover:border-[#991b1b]"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} style={{ color: dragOver ? "#991b1b" : "#9ca3af", margin: "0 auto 12px" }} />
            <p className="text-[13px] mb-1" style={{ fontWeight: 500, color: "#4b5563" }}>
              Drop your file here or click to browse
            </p>
            <p className="text-[11px]" style={{ color: "#9ca3af" }}>
              Supports CSV and XLSX — max 5 MB, 10,000 rows
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
                e.target.value = ""
              }}
            />
          </div>

          {/* Required columns reference */}
          <div className="border border-[#e5e7eb] p-4" style={{ background: "#f9fafb" }}>
            <div className="flex items-center gap-2 mb-2">
              <Info size={12} style={{ color: "#6b7280" }} />
              <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
                Required Columns
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {REQUIRED_COLUMNS.map((col) => (
                <span
                  key={col}
                  className="px-2 py-0.5 text-[10px] border"
                  style={{ ...mono, color: "#991b1b", borderColor: "#fca5a5", background: "#fef2f2" }}
                >
                  {col}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 mb-2">
              <Info size={12} style={{ color: "#6b7280" }} />
              <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
                Optional Columns
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {ALL_KNOWN_COLUMNS.filter((c) => !REQUIRED_COLUMNS.includes(c)).map((col) => (
                <span
                  key={col}
                  className="px-2 py-0.5 text-[10px] border"
                  style={{ ...mono, color: "#6b7280", borderColor: "#e5e7eb", background: "#fff" }}
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Phase: Preview — Validation results ──────────────────────────────── */}
      {(state.phase === "preview" || state.phase === "importing" || state.phase === "complete") && (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-3 px-4 py-3 border border-[#e5e7eb]" style={{ background: "#f9fafb" }}>
            <FileSpreadsheet size={16} style={{ color: "#7f1d1d" }} />
            <div>
              <span className="text-[12px]" style={{ fontWeight: 500, color: "#1f2937" }}>
                {state.fileName}
              </span>
              <span className="text-[10px] ml-2" style={{ ...mono, color: "#9ca3af" }}>
                {state.fileType.toUpperCase()} &middot; {state.rows.length} rows &middot; {state.headers.length} columns
              </span>
            </div>
          </div>

          {/* Validation stats */}
          <div className="grid grid-cols-4 border border-[#e5e7eb]" style={{ background: "#f9fafb" }}>
            {[
              { label: "TOTAL ROWS", value: stats.total, color: "#6b7280" },
              { label: "VALID", value: state.phase === "complete" ? state.importedCount : stats.valid, color: "#16a34a" },
              { label: "WARNINGS", value: stats.warnings, color: "#d97706" },
              { label: "ERRORS", value: state.phase === "complete" ? state.errorCount : stats.errors, color: "#dc2626" },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3 border-r border-[#e5e7eb] last:border-r-0">
                <div className="text-[9px] tracking-widest uppercase mb-1" style={{ ...mono, color: "#9ca3af" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: s.color, ...mono }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3">
            {state.phase === "preview" && (
              <>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 text-[11px] tracking-widest uppercase border transition-colors hover:opacity-90"
                  style={{
                    ...mono,
                    background: stats.valid === 0 ? "#f5f0f0" : "#7f1d1d",
                    borderColor: stats.valid === 0 ? "#e0d0d0" : "#991b1b",
                    color: stats.valid === 0 ? "#b09090" : "#ffffff",
                    cursor: stats.valid === 0 ? "not-allowed" : "pointer",
                  }}
                  disabled={stats.valid === 0}
                  onClick={handleImport}
                >
                  <Upload size={12} />
                  Import {stats.valid + stats.warnings} Valid Rows
                </button>
                {stats.errors > 0 && (
                  <button
                    className="flex items-center gap-2 px-4 py-2.5 text-[11px] tracking-widest uppercase border transition-colors hover:opacity-90"
                    style={{ ...mono, borderColor: "#e5e7eb", color: "#6b7280" }}
                    onClick={handleDownloadErrors}
                  >
                    <Download size={12} />
                    Download Error Report
                  </button>
                )}
              </>
            )}
            {state.phase === "importing" && (
              <div className="flex items-center gap-2 px-4 py-2.5">
                <div className="w-4 h-4 border-2 border-[#991b1b] border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
                  Processing...
                </span>
              </div>
            )}
            {state.phase === "complete" && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2.5 border border-[#86efac]" style={{ background: "#f0fdf4" }}>
                  <CheckCircle2 size={14} style={{ color: "#16a34a" }} />
                  <span className="text-[11px]" style={{ ...mono, color: "#166534" }}>
                    Import Complete — {state.importedCount} imported, {state.skippedCount} skipped
                  </span>
                </div>
                {state.errorCount > 0 && (
                  <button
                    className="flex items-center gap-2 px-4 py-2.5 text-[11px] tracking-widest uppercase border transition-colors hover:opacity-90"
                    style={{ ...mono, borderColor: "#e5e7eb", color: "#6b7280" }}
                    onClick={handleDownloadErrors}
                  >
                    <Download size={12} />
                    Error Report (CSV)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Row-by-row results table */}
          <div>
            <div
              className="flex items-center justify-between px-4 py-2 border border-b-0 border-[#e5e7eb]"
              style={{ background: "#f9fafb" }}
            >
              <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
                Row Validation Details
              </span>
              <span className="text-[10px]" style={{ ...mono, color: "#9ca3af" }}>
                Showing first {Math.min(state.rows.length, 200)} rows
              </span>
            </div>

            <div className="border border-[#e5e7eb] overflow-auto" style={{ background: "#ffffff", maxHeight: "500px" }}>
              {/* Header */}
              <div
                className="grid border-b border-[#e5e7eb] sticky top-0 z-10"
                style={{
                  gridTemplateColumns: "60px 80px 120px 1fr 100px",
                  background: "#f9fafb",
                }}
              >
                {["ROW", "OUTCOME", "ASSET TAG", "ERRORS / WARNINGS", "FIELDS"].map((h) => (
                  <div
                    key={h}
                    className="px-3 py-2 text-[9px] tracking-widest uppercase"
                    style={{ ...mono, color: "#6b7280", borderRight: "1px solid #f0f0f2" }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {state.validations.slice(0, 200).map((v, idx) => {
                const row = state.rows[idx]
                const outcomeConfig: Record<string, { color: string; bg: string; border: string; label: string; Icon: typeof CheckCircle2 }> = {
                  valid:   { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", label: "VALID",   Icon: CheckCircle2 },
                  warning: { color: "#d97706", bg: "#fffbeb", border: "#fcd34d", label: "WARN",    Icon: AlertTriangle },
                  error:   { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", label: "ERROR",   Icon: XCircle },
                }
                const oc = outcomeConfig[v.outcome]
                const allIssues = [
                  ...v.errors.map((e) => ({ ...e, severity: "error" as const })),
                  ...v.warnings.map((w) => ({ ...w, severity: "warning" as const })),
                ]
                const errorFields = new Set(v.errors.map((e) => e.field))

                return (
                  <div
                    key={v.rowNumber}
                    className="grid border-b border-[#f0f0f2]"
                    style={{
                      gridTemplateColumns: "60px 80px 120px 1fr 100px",
                      background: v.outcome === "error" ? "#fef2f2" : idx % 2 === 0 ? "#ffffff" : "#fafafa",
                    }}
                  >
                    <div className="px-3 py-2 flex items-start" style={{ borderRight: "1px solid #f0f0f2" }}>
                      <span className="text-[10px]" style={{ ...mono, color: "#6b7280" }}>
                        {v.rowNumber}
                      </span>
                    </div>
                    <div className="px-3 py-2 flex items-start" style={{ borderRight: "1px solid #f0f0f2" }}>
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] tracking-widest uppercase border"
                        style={{ ...mono, color: oc.color, background: oc.bg, borderColor: oc.border }}
                      >
                        <oc.Icon size={8} /> {oc.label}
                      </span>
                    </div>
                    <div className="px-3 py-2 flex items-start" style={{ borderRight: "1px solid #f0f0f2" }}>
                      <span className="text-[10px] truncate" style={{ ...mono, color: errorFields.has("asset_tag") ? "#dc2626" : "#4b5563" }}>
                        {row?.data["asset_tag"] || "—"}
                      </span>
                    </div>
                    <div className="px-3 py-2" style={{ borderRight: "1px solid #f0f0f2" }}>
                      {allIssues.length === 0 ? (
                        <span className="text-[10px]" style={{ color: "#9ca3af" }}>—</span>
                      ) : (
                        <div className="space-y-0.5">
                          {allIssues.map((issue, j) => (
                            <div key={j} className="text-[10px] flex items-start gap-1">
                              {issue.severity === "error" ? (
                                <XCircle size={10} className="flex-shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
                              ) : (
                                <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" style={{ color: "#d97706" }} />
                              )}
                              <span style={{ color: issue.severity === "error" ? "#dc2626" : "#92400e" }}>
                                {issue.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2">
                      <span className="text-[10px]" style={{ ...mono, color: "#9ca3af" }}>
                        {Object.keys(row?.data || {}).filter((k) => (row?.data[k] || "").trim()).length} / {state.headers.length}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2 border border-[#e5dfd0]"
        style={{ background: "#fdfcf8" }}
      >
        <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: "#92800a" }}>
          Import pipeline — schema validation, duplicate detection, per-row audit
        </span>
        <span className="text-[9px]" style={{ ...mono, color: "#a0903a" }}>
          CSV &middot; XLSX &middot; Max 10K rows &middot; 5 MB limit
        </span>
      </div>
    </div>
  )
}
