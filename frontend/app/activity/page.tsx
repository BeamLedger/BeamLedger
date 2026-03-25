"use client"

import { useMemo, useState } from "react"
import {
  Activity, Upload, CheckCircle2, XCircle, AlertCircle, FileText,
  MessageSquare, Clock, Download, Filter, Settings, Edit3,
} from "lucide-react"

const mono = { fontFamily: "'Ubin Sans', monospace" } as const

// ── Types ───────────────────────────────────────────────────────────────────

interface ActivityEntry {
  id: number
  timestamp: string
  user: string
  action: string
  entityType: string
  entityId: string
  summary: string
  details?: string
}

interface FixtureComment {
  id: number
  fixtureId: string
  fixtureName: string
  user: string
  content: string
  timestamp: string
}

interface FieldChange {
  id: number
  fixtureId: string
  fixtureName: string
  user: string
  timestamp: string
  field: string
  oldValue: string
  newValue: string
}

// ── Mock Data (client-side demo — replaced by API in production) ────────────

const DEMO_ACTIVITIES: ActivityEntry[] = [
  { id: 1, timestamp: "2026-03-24T14:30:00Z", user: "admin@beamledger.com", action: "compliance_evaluated", entityType: "fixture", entityId: "FX-001", summary: "Compliance evaluation completed for FX-001 (Horizon LED Troffer) — PASS" },
  { id: 2, timestamp: "2026-03-24T14:25:00Z", user: "admin@beamledger.com", action: "import_completed", entityType: "import", entityId: "audit-1", summary: "CSV import completed: 12 fixtures imported, 0 skipped, 0 errors" },
  { id: 3, timestamp: "2026-03-24T13:45:00Z", user: "auditor@beamledger.com", action: "report_generated", entityType: "report", entityId: "rpt-1", summary: "Compliance report generated for Site A — 12 fixtures, 67% compliant" },
  { id: 4, timestamp: "2026-03-24T12:00:00Z", user: "admin@beamledger.com", action: "fixture_added", entityType: "fixture", entityId: "FX-012", summary: "New fixture added: ClearPath Exit Sign (LED Exit Sign, 5W)" },
  { id: 5, timestamp: "2026-03-24T11:30:00Z", user: "admin@beamledger.com", action: "fixture_updated", entityType: "fixture", entityId: "FX-003", summary: "Fixture FX-003 (IndustraBright HB-400) updated: wattage changed 450W → 400W" },
  { id: 6, timestamp: "2026-03-24T10:15:00Z", user: "auditor@beamledger.com", action: "comment_added", entityType: "fixture", entityId: "FX-005", summary: "Comment added on FX-005: 'Waiting on manufacturer spec sheet for TM-21 data'" },
  { id: 7, timestamp: "2026-03-23T16:00:00Z", user: "admin@beamledger.com", action: "compliance_evaluated", entityType: "fixture", entityId: "FX-005", summary: "Compliance evaluation for FX-005 (ParkVault LED-40P) — DATA ERROR: missing space_area" },
  { id: 8, timestamp: "2026-03-23T15:00:00Z", user: "viewer@beamledger.com", action: "report_generated", entityType: "report", entityId: "rpt-2", summary: "ROI analysis report exported for Site A" },
  { id: 9, timestamp: "2026-03-23T14:00:00Z", user: "admin@beamledger.com", action: "fixture_added", entityType: "fixture", entityId: "FX-011", summary: "New fixture added: SkyVault Canopy CL-100 (LED Canopy, 100W)" },
  { id: 10, timestamp: "2026-03-23T11:00:00Z", user: "admin@beamledger.com", action: "import_completed", entityType: "import", entityId: "audit-2", summary: "XLSX import completed: 8 fixtures imported, 2 skipped (missing asset_tag)" },
  { id: 11, timestamp: "2026-03-22T09:00:00Z", user: "admin@beamledger.com", action: "fixture_updated", entityType: "fixture", entityId: "FX-007", summary: "Fixture FX-007 updated: space_type changed 'Storage' → 'Warehouse - Medium/Bulky'" },
  { id: 12, timestamp: "2026-03-22T08:30:00Z", user: "auditor@beamledger.com", action: "comment_added", entityType: "fixture", entityId: "FX-003", summary: "Comment added on FX-003: 'Approved for replacement Q3 — budget confirmed'" },
]

const DEMO_COMMENTS: FixtureComment[] = [
  { id: 1, fixtureId: "FX-005", fixtureName: "ParkVault LED-40P", user: "auditor@beamledger.com", content: "Waiting on manufacturer spec sheet for TM-21 data", timestamp: "2026-03-24T10:15:00Z" },
  { id: 2, fixtureId: "FX-003", fixtureName: "IndustraBright HB-400", user: "auditor@beamledger.com", content: "Approved for replacement Q3 — budget confirmed", timestamp: "2026-03-22T08:30:00Z" },
  { id: 3, fixtureId: "FX-001", fixtureName: "Horizon LED Troffer", user: "admin@beamledger.com", content: "Verified on-site — installation matches spec", timestamp: "2026-03-21T14:00:00Z" },
]

const DEMO_CHANGES: FieldChange[] = [
  { id: 1, fixtureId: "FX-003", fixtureName: "IndustraBright HB-400", user: "admin@beamledger.com", timestamp: "2026-03-24T11:30:00Z", field: "wattage", oldValue: "450", newValue: "400" },
  { id: 2, fixtureId: "FX-007", fixtureName: "BeamSafe Wall Pack", user: "admin@beamledger.com", timestamp: "2026-03-22T09:00:00Z", field: "space_type", oldValue: "Storage", newValue: "Warehouse - Medium/Bulky" },
  { id: 3, fixtureId: "FX-005", fixtureName: "ParkVault LED-40P", user: "admin@beamledger.com", timestamp: "2026-03-20T16:00:00Z", field: "space_area", oldValue: "", newValue: "2800" },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function getActionIcon(action: string) {
  switch (action) {
    case "fixture_added": return <CheckCircle2 size={12} color="#16a34a" />
    case "fixture_updated": return <Edit3 size={12} color="#2563eb" />
    case "fixture_deleted": return <XCircle size={12} color="#dc2626" />
    case "compliance_evaluated": return <AlertCircle size={12} color="#d97706" />
    case "report_generated": return <FileText size={12} color="#7c3aed" />
    case "import_completed": return <Upload size={12} color="#059669" />
    case "comment_added": return <MessageSquare size={12} color="#6366f1" />
    default: return <Activity size={12} color="#6b7280" />
  }
}

function getActionColor(action: string): string {
  switch (action) {
    case "fixture_added": return "#16a34a"
    case "fixture_updated": return "#2563eb"
    case "compliance_evaluated": return "#d97706"
    case "report_generated": return "#7c3aed"
    case "import_completed": return "#059669"
    case "comment_added": return "#6366f1"
    default: return "#6b7280"
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [tab, setTab] = useState<"feed" | "comments" | "changes">("feed")
  const [actionFilter, setActionFilter] = useState<string>("")

  const filteredActivities = useMemo(() => {
    if (!actionFilter) return DEMO_ACTIVITIES
    return DEMO_ACTIVITIES.filter((a) => a.action === actionFilter)
  }, [actionFilter])

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#e5e7eb] pb-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ ...mono, color: "#6b7280" }}>
            Module: Audit &amp; Collaboration
          </p>
          <h1 className="tracking-tight" style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937" }}>
            Activity &amp; Audit Trail
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
            Every action logged — fixtures, evaluations, imports, comments, and field changes
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border transition-colors hover:opacity-90"
          style={{ ...mono, background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }}
          onClick={() => {
            // Generate CSV export
            const rows = DEMO_ACTIVITIES.map((a) => [a.timestamp, a.user, a.action, a.entityType, a.entityId, a.summary].join(","))
            const csv = ["Timestamp,User,Action,Entity Type,Entity ID,Summary", ...rows].join("\n")
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url; a.download = "audit_trail.csv"; a.click()
            URL.revokeObjectURL(url)
          }}
        >
          <Download size={12} /> Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e7eb]">
        {[
          { key: "feed" as const, label: "Activity Feed", icon: <Activity size={11} /> },
          { key: "comments" as const, label: "Comments", icon: <MessageSquare size={11} /> },
          { key: "changes" as const, label: "Change History", icon: <Edit3 size={11} /> },
        ].map((t) => (
          <button
            key={t.key}
            className="flex items-center gap-2 px-5 py-2.5 text-[10px] tracking-widest uppercase border-b-2 transition-colors"
            style={{
              ...mono,
              borderBottomColor: tab === t.key ? "#991b1b" : "transparent",
              color: tab === t.key ? "#7f1d1d" : "#6b7280",
              fontWeight: tab === t.key ? 600 : 400,
            }}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      {tab === "feed" && (
        <div>
          {/* Filter */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: "#9ca3af" }}>FILTER:</span>
            {["", "fixture_added", "fixture_updated", "compliance_evaluated", "import_completed", "report_generated", "comment_added"].map((f) => (
              <button
                key={f}
                className="px-2 py-1 text-[9px] tracking-wider uppercase border"
                style={{
                  ...mono,
                  background: actionFilter === f ? "rgba(127,29,29,0.08)" : "#f9fafb",
                  borderColor: actionFilter === f ? "#991b1b" : "#e5e7eb",
                  color: actionFilter === f ? "#7f1d1d" : "#6b7280",
                }}
                onClick={() => setActionFilter(f)}
              >
                {f ? f.replace(/_/g, " ") : "ALL"}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="border border-[#e5e7eb]" style={{ background: "#ffffff" }}>
            {filteredActivities.map((entry, idx) => (
              <div
                key={entry.id}
                className="flex gap-4 px-5 py-4 border-b border-[#f0f0f2] last:border-b-0"
                style={{ background: idx % 2 === 0 ? "#ffffff" : "#fafafa" }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-7 h-7 flex items-center justify-center border" style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
                    {getActionIcon(entry.action)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 border"
                      style={{ ...mono, color: getActionColor(entry.action), borderColor: `${getActionColor(entry.action)}40`, background: `${getActionColor(entry.action)}08` }}>
                      {entry.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px]" style={{ color: "#9ca3af" }}>&middot;</span>
                    <span className="text-[10px]" style={{ ...mono, color: "#9ca3af" }}>{timeAgo(entry.timestamp)}</span>
                  </div>
                  <p className="text-[12px]" style={{ color: "#1f2937" }}>{entry.summary}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px]" style={{ color: "#9ca3af" }}>{entry.user}</span>
                    <span className="text-[10px]" style={{ ...mono, color: "#d1d5db" }}>
                      {new Date(entry.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      {tab === "comments" && (
        <div className="border border-[#e5e7eb]" style={{ background: "#ffffff" }}>
          {DEMO_COMMENTS.map((c, idx) => (
            <div
              key={c.id}
              className="flex gap-4 px-5 py-4 border-b border-[#f0f0f2] last:border-b-0"
              style={{ background: idx % 2 === 0 ? "#ffffff" : "#fafafa" }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-7 h-7 flex items-center justify-center border" style={{ borderColor: "#c4b5fd", background: "#f5f3ff" }}>
                  <MessageSquare size={12} color="#6366f1" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px]" style={{ fontWeight: 500, color: "#1f2937" }}>{c.fixtureName}</span>
                  <span className="text-[9px]" style={{ ...mono, color: "#9ca3af" }}>{c.fixtureId}</span>
                </div>
                <p className="text-[12px] mb-1" style={{ color: "#4b5563" }}>"{c.content}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px]" style={{ color: "#9ca3af" }}>{c.user}</span>
                  <span className="text-[10px]" style={{ ...mono, color: "#d1d5db" }}>{timeAgo(c.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Change History */}
      {tab === "changes" && (
        <div className="border border-[#e5e7eb]" style={{ background: "#ffffff" }}>
          <div className="grid border-b border-[#e5e7eb]"
            style={{ gridTemplateColumns: "1fr 120px 120px 120px 100px", background: "#f9fafb" }}>
            {["FIXTURE", "FIELD", "OLD VALUE", "NEW VALUE", "WHEN"].map((h) => (
              <div key={h} className="px-3 py-2 text-[9px] tracking-[0.15em] uppercase overflow-hidden"
                style={{ ...mono, color: "#6b7280", borderRight: "1px solid #f0f0f2" }}>{h}</div>
            ))}
          </div>
          {DEMO_CHANGES.map((ch, idx) => (
            <div key={ch.id} className="grid border-b border-[#f0f0f2]"
              style={{ gridTemplateColumns: "1fr 120px 120px 120px 100px", background: idx % 2 === 0 ? "#ffffff" : "#fafafa" }}>
              <div className="px-3 py-2.5 overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                <div className="text-[11px] truncate" style={{ fontWeight: 500, color: "#1f2937" }}>{ch.fixtureName}</div>
                <div className="text-[9px]" style={{ color: "#9ca3af" }}>{ch.fixtureId} &middot; {ch.user}</div>
              </div>
              <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                <span className="text-[10px]" style={{ ...mono, color: "#6b7280" }}>{ch.field}</span>
              </div>
              <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                <span className="text-[10px] line-through" style={{ ...mono, color: "#dc2626" }}>{ch.oldValue || "(empty)"}</span>
              </div>
              <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: "1px solid #f0f0f2" }}>
                <span className="text-[10px]" style={{ ...mono, color: "#16a34a" }}>{ch.newValue}</span>
              </div>
              <div className="px-3 py-2.5 flex items-center overflow-hidden">
                <span className="text-[10px]" style={{ ...mono, color: "#9ca3af" }}>{timeAgo(ch.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border border-[#e5dfd0]" style={{ background: "#fdfcf8" }}>
        <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: "#92800a" }}>
          One platform from audit to submission — every action traceable
        </span>
        <span className="text-[9px]" style={{ ...mono, color: "#a0903a" }}>
          Export full audit trail for compliance documentation
        </span>
      </div>
    </div>
  )
}
