"use client"

import { useMemo, useState } from "react"
import {
  Activity, Upload, CheckCircle2, XCircle, FileText,
  MessageSquare, Download, Edit3, Radio,
} from "lucide-react"
import { colors, mono } from "../../lib/designTokens"
import PageHeader from "../../components/PageHeader"
import SectionHeader from "../../components/SectionHeader"
import FooterBar from "../../components/FooterBar"

// ── Types ───────────────────────────────────────────────────────────────────

interface ActivityEntry {
  id: number
  timestamp: string
  user: string
  action: string
  entityType: string
  entityId: string
  summary: string
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

// ── Mock Data ──────────────────────────────────────────────────────────────

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
    case "fixture_added": return <CheckCircle2 size={12} color={colors.pass.fg} />
    case "fixture_updated": return <Edit3 size={12} color={colors.exempt.fg} />
    case "fixture_deleted": return <XCircle size={12} color={colors.fail.fg} />
    case "compliance_evaluated": return <Activity size={12} color={colors.dataError.fg} />
    case "report_generated": return <FileText size={12} color={colors.chart.purple} />
    case "import_completed": return <Upload size={12} color="#059669" />
    case "comment_added": return <MessageSquare size={12} color={colors.info.fg} />
    default: return <Activity size={12} color={colors.text.tertiary} />
  }
}

function getActionColor(action: string): string {
  switch (action) {
    case "fixture_added": return colors.pass.fg
    case "fixture_updated": return colors.exempt.fg
    case "compliance_evaluated": return colors.dataError.fg
    case "report_generated": return colors.chart.purple
    case "import_completed": return "#059669"
    case "comment_added": return colors.info.fg
    default: return colors.text.tertiary
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

function exportCSV() {
  const rows = DEMO_ACTIVITIES.map((a) => [a.timestamp, a.user, a.action, a.entityType, a.entityId, `"${a.summary}"`].join(","))
  const csv = ["Timestamp,User,Action,Entity Type,Entity ID,Summary", ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "audit_trail.csv"; a.click()
  URL.revokeObjectURL(url)
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [tab, setTab] = useState<"feed" | "comments" | "changes">("feed")
  const [actionFilter, setActionFilter] = useState<string>("")
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 8

  const filteredActivities = useMemo(() => {
    if (!actionFilter) return DEMO_ACTIVITIES
    return DEMO_ACTIVITIES.filter((a) => a.action === actionFilter)
  }, [actionFilter])

  const pagedActivities = filteredActivities.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filteredActivities.length / PAGE_SIZE)

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      <PageHeader
        module="Audit & Collaboration"
        title="Activity & Audit Trail"
        subtitle="Every action logged — fixtures, evaluations, imports, comments, and field changes"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 border" style={{ borderColor: colors.pass.border, background: colors.pass.bg }}>
              <Radio size={10} style={{ color: colors.pass.fg }} />
              <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: colors.pass.fg }}>Live</span>
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border transition-colors hover:opacity-90"
              style={{ ...mono, background: colors.bg.panel, borderColor: colors.border.default, color: colors.text.tertiary }}
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: colors.border.default }}>
        {[
          { key: "feed" as const, label: "Activity Feed", icon: <Activity size={11} />, count: DEMO_ACTIVITIES.length },
          { key: "comments" as const, label: "Comments", icon: <MessageSquare size={11} />, count: DEMO_COMMENTS.length },
          { key: "changes" as const, label: "Change History", icon: <Edit3 size={11} />, count: DEMO_CHANGES.length },
        ].map((t) => (
          <button
            key={t.key}
            className="flex items-center gap-2 px-5 py-2.5 text-[10px] tracking-widest uppercase border-b-2 transition-colors"
            style={{
              ...mono,
              borderBottomColor: tab === t.key ? colors.maroon[700] : "transparent",
              color: tab === t.key ? colors.maroon[800] : colors.text.tertiary,
              fontWeight: tab === t.key ? 600 : 400,
            }}
            onClick={() => { setTab(t.key); setPage(0) }}
          >
            {t.icon} {t.label}
            <span className="text-[8px] px-1 py-0.5 border" style={{ borderColor: colors.border.default, color: colors.text.muted }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      {tab === "feed" && (
        <div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: colors.text.muted }}>FILTER:</span>
            {["", "fixture_added", "fixture_updated", "compliance_evaluated", "import_completed", "report_generated", "comment_added"].map((f) => (
              <button
                key={f}
                className="px-2 py-1 text-[9px] tracking-wider uppercase border"
                style={{
                  ...mono,
                  background: actionFilter === f ? colors.maroon[100] : colors.bg.panel,
                  borderColor: actionFilter === f ? colors.maroon[700] : colors.border.default,
                  color: actionFilter === f ? colors.maroon[800] : colors.text.tertiary,
                }}
                onClick={() => { setActionFilter(f); setPage(0) }}
              >
                {f ? f.replace(/_/g, " ") : "ALL"}
              </button>
            ))}
          </div>

          <div className="border" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
            {pagedActivities.map((entry, idx) => (
              <div
                key={entry.id}
                className="flex gap-4 px-5 py-4 border-b last:border-b-0"
                style={{ background: idx % 2 === 0 ? colors.bg.page : colors.bg.alt, borderColor: colors.border.light }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-7 h-7 flex items-center justify-center border" style={{ borderColor: colors.border.default, background: colors.bg.panel }}>
                    {getActionIcon(entry.action)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] tracking-wider uppercase px-1.5 py-0.5 border"
                      style={{ ...mono, color: getActionColor(entry.action), borderColor: `${getActionColor(entry.action)}40`, background: `${getActionColor(entry.action)}08` }}>
                      {entry.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px]" style={{ color: colors.text.muted }}>&middot;</span>
                    <span className="text-[10px]" style={{ ...mono, color: colors.text.muted }}>{timeAgo(entry.timestamp)}</span>
                  </div>
                  <p className="text-[12px]" style={{ color: colors.text.primary }}>{entry.summary}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px]" style={{ color: colors.text.muted }}>{entry.user}</span>
                    <span className="text-[10px]" style={{ ...mono, color: colors.text.faint }}>
                      {new Date(entry.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px]" style={{ ...mono, color: colors.text.muted }}>
                Page {page + 1} of {totalPages} &middot; {filteredActivities.length} entries
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-[10px] tracking-widest uppercase border"
                  style={{ ...mono, borderColor: colors.border.default, color: page === 0 ? colors.text.faint : colors.text.tertiary, cursor: page === 0 ? "not-allowed" : "pointer" }}
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Prev
                </button>
                <button
                  className="px-3 py-1 text-[10px] tracking-widest uppercase border"
                  style={{ ...mono, borderColor: colors.border.default, color: page >= totalPages - 1 ? colors.text.faint : colors.text.tertiary, cursor: page >= totalPages - 1 ? "not-allowed" : "pointer" }}
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      {tab === "comments" && (
        <div className="border" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
          {DEMO_COMMENTS.map((c, idx) => (
            <div
              key={c.id}
              className="flex gap-4 px-5 py-4 border-b last:border-b-0"
              style={{ background: idx % 2 === 0 ? colors.bg.page : colors.bg.alt, borderColor: colors.border.light }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-7 h-7 flex items-center justify-center border" style={{ borderColor: "#c4b5fd", background: "#f5f3ff" }}>
                  <MessageSquare size={12} color={colors.info.fg} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px]" style={{ fontWeight: 500, color: colors.text.primary }}>{c.fixtureName}</span>
                  <span className="text-[9px]" style={{ ...mono, color: colors.text.muted }}>{c.fixtureId}</span>
                </div>
                <p className="text-[12px] mb-1" style={{ color: colors.text.secondary }}>"{c.content}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px]" style={{ color: colors.text.muted }}>{c.user}</span>
                  <span className="text-[10px]" style={{ ...mono, color: colors.text.faint }}>{timeAgo(c.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Change History */}
      {tab === "changes" && (
        <div>
          <SectionHeader title="Field Changes" right={`${DEMO_CHANGES.length} changes`} />
          <div className="border border-t-0" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
            <div className="grid border-b" style={{ gridTemplateColumns: "1fr 120px 120px 120px 100px", background: colors.bg.panel, borderColor: colors.border.default }}>
              {["FIXTURE", "FIELD", "OLD VALUE", "NEW VALUE", "WHEN"].map((h) => (
                <div key={h} className="px-3 py-2 text-[9px] tracking-[0.15em] uppercase overflow-hidden" style={{ ...mono, color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>{h}</div>
              ))}
            </div>
            {DEMO_CHANGES.map((ch, idx) => (
              <div key={ch.id} className="grid border-b"
                style={{ gridTemplateColumns: "1fr 120px 120px 120px 100px", background: idx % 2 === 0 ? colors.bg.page : colors.bg.alt, borderColor: colors.border.light }}>
                <div className="px-3 py-2.5 overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <div className="text-[11px] truncate" style={{ fontWeight: 500, color: colors.text.primary }}>{ch.fixtureName}</div>
                  <div className="text-[9px]" style={{ color: colors.text.muted }}>{ch.fixtureId} &middot; {ch.user}</div>
                </div>
                <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <span className="text-[10px]" style={{ ...mono, color: colors.text.tertiary }}>{ch.field}</span>
                </div>
                <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <span className="text-[10px] line-through" style={{ ...mono, color: colors.fail.fg }}>{ch.oldValue || "(empty)"}</span>
                </div>
                <div className="px-3 py-2.5 flex items-center overflow-hidden" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <span className="text-[10px]" style={{ ...mono, color: colors.pass.fg }}>{ch.newValue}</span>
                </div>
                <div className="px-3 py-2.5 flex items-center overflow-hidden">
                  <span className="text-[10px]" style={{ ...mono, color: colors.text.muted }}>{timeAgo(ch.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <FooterBar
        left="One platform from audit to submission — every action traceable"
        right="Export full audit trail for compliance documentation"
      />
    </div>
  )
}
