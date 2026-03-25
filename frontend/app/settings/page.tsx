"use client"

import { useState } from "react"
import {
  Settings, Building2, Users, Globe, Key, Webhook, Shield,
  Plus, Trash2, Copy, Eye, EyeOff, ChevronRight, Check, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { mono, colors } from "../../lib/designTokens"
import PageHeader from "../../components/PageHeader"
import SectionHeader from "../../components/SectionHeader"
import FooterBar from "../../components/FooterBar"

// ── Types ───────────────────────────────────────────────────────────────────

interface TeamMember {
  email: string
  role: "owner" | "admin" | "auditor" | "viewer"
  joinedAt: string
  lastActive: string
}

interface SiteConfig {
  id: number
  name: string
  address: string
  totalArea: number
  buildingType: string
  floors: number
}

interface ApiKeyEntry {
  id: number
  prefix: string
  name: string
  createdAt: string
  lastUsed: string | null
  active: boolean
}

interface WebhookEntry {
  id: number
  url: string
  events: string[]
  active: boolean
  createdAt: string
}

// ── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_TEAM: TeamMember[] = [
  { email: "admin@beamledger.com", role: "owner", joinedAt: "2025-11-01", lastActive: "2026-03-25" },
  { email: "auditor@beamledger.com", role: "auditor", joinedAt: "2026-01-15", lastActive: "2026-03-24" },
  { email: "viewer@beamledger.com", role: "viewer", joinedAt: "2026-02-20", lastActive: "2026-03-20" },
]

const DEMO_SITES: SiteConfig[] = [
  { id: 1, name: "Corporate HQ", address: "100 Main St, Austin, TX", totalArea: 45000, buildingType: "Commercial Office", floors: 3 },
  { id: 2, name: "Warehouse District", address: "2500 Industrial Blvd, Austin, TX", totalArea: 120000, buildingType: "Industrial", floors: 1 },
  { id: 3, name: "Retail Center", address: "800 Commerce Dr, Austin, TX", totalArea: 28000, buildingType: "Retail", floors: 2 },
]

const DEMO_API_KEYS: ApiKeyEntry[] = [
  { id: 1, prefix: "bl_k_a8f2x3...", name: "ERP Integration", createdAt: "2026-02-01", lastUsed: "2026-03-24", active: true },
  { id: 2, prefix: "bl_k_9c7mq1...", name: "CI/CD Pipeline", createdAt: "2026-03-10", lastUsed: null, active: true },
]

const DEMO_WEBHOOKS: WebhookEntry[] = [
  { id: 1, url: "https://hooks.example.com/beamledger", events: ["import_complete", "compliance_evaluated"], active: true, createdAt: "2026-02-15" },
]

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full control — manage billing, team, and all settings",
  admin: "Manage settings, team members, and integrations",
  auditor: "Evaluate compliance, add comments, generate reports",
  viewer: "Read-only access to all data and reports",
}

const BUILDING_TYPES = ["Commercial Office", "Industrial", "Retail", "Education", "Healthcare", "Municipal", "Hospitality", "Residential", "Mixed-Use", "Other"]
const INDUSTRY_VERTICALS = ["Commercial Real Estate", "Education", "Healthcare", "Retail", "Industrial", "Municipal", "Hospitality", "Other"]
const STANDARDS_LIST = [
  { id: "ASHRAE_90_1_2022", name: "ASHRAE 90.1-2022" },
  { id: "TITLE_24_2022", name: "CA Title 24-2022" },
  { id: "IES_ILLUMINANCE", name: "IES Illuminance" },
  { id: "DLC_QPL_5_1", name: "DLC QPL v5.1" },
  { id: "IECC_2021", name: "IECC 2021" },
]

type Tab = "org" | "team" | "sites" | "integrations" | "compliance"

// ── Page ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("org")

  // Org settings
  const [orgName, setOrgName] = useState("BeamLedger Demo Org")
  const [orgDesc, setOrgDesc] = useState("Lighting compliance management for commercial facilities")
  const [industry, setIndustry] = useState("Commercial Real Estate")
  const [utilityRate, setUtilityRate] = useState(0.12)
  const [annualHours, setAnnualHours] = useState(4380)

  // Team
  const [team] = useState(DEMO_TEAM)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("viewer")

  // Sites
  const [sites] = useState(DEMO_SITES)
  const [selectedSite, setSelectedSite] = useState<number | null>(null)

  // API Keys
  const [apiKeys] = useState(DEMO_API_KEYS)
  const [newKeyName, setNewKeyName] = useState("")
  const [showNewKey, setShowNewKey] = useState<string | null>(null)

  // Webhooks
  const [webhooks] = useState(DEMO_WEBHOOKS)
  const [newWebhookUrl, setNewWebhookUrl] = useState("")
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([])

  // Compliance
  const [activeStandards, setActiveStandards] = useState(STANDARDS_LIST.map((s) => s.id))
  const [maxCct, setMaxCct] = useState("")
  const [minCri, setMinCri] = useState("")

  const inputClass = "w-full px-3 py-2 text-[12px] border outline-none transition-colors"
  const inputStyle = { background: colors.bg.page, borderColor: colors.border.default, color: colors.text.primary }

  const tabs: { key: Tab; label: string; icon: typeof Settings }[] = [
    { key: "org", label: "Organization", icon: Building2 },
    { key: "team", label: "Team", icon: Users },
    { key: "sites", label: "Sites", icon: Globe },
    { key: "integrations", label: "API & Integrations", icon: Key },
    { key: "compliance", label: "Compliance Rules", icon: Shield },
  ]

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <PageHeader
        module="Configuration"
        title="Settings"
        subtitle="Organization profile, team management, integrations, and compliance configuration"
      />

      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: colors.border.default }}>
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              className="flex items-center gap-2 px-5 py-2.5 text-[10px] tracking-widest uppercase border-b-2 transition-colors"
              style={{
                ...mono,
                borderBottomColor: tab === t.key ? colors.maroon[700] : "transparent",
                color: tab === t.key ? colors.maroon[800] : colors.text.tertiary,
                fontWeight: tab === t.key ? 600 : 400,
              }}
              onClick={() => setTab(t.key)}
            >
              <Icon size={11} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Organization Tab ──────────────────────────────────────────── */}
      {tab === "org" && (
        <div className="space-y-6">
          <div className="border p-5 space-y-4" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ ...mono, color: colors.text.tertiary }}>
                  Organization Name
                </label>
                <input className={inputClass} style={inputStyle} value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ ...mono, color: colors.text.tertiary }}>
                  Industry Vertical
                </label>
                <select className={inputClass} style={{ ...inputStyle, appearance: "none" }} value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  {INDUSTRY_VERTICALS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ ...mono, color: colors.text.tertiary }}>
                Description
              </label>
              <textarea className={inputClass} style={{ ...inputStyle, resize: "vertical" }} rows={2} value={orgDesc} onChange={(e) => setOrgDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ ...mono, color: colors.text.tertiary }}>
                  Default Utility Rate ($/kWh)
                </label>
                <input type="number" step="0.01" min="0.01" className={inputClass} style={inputStyle} value={utilityRate} onChange={(e) => setUtilityRate(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ ...mono, color: colors.text.tertiary }}>
                  Default Annual Operating Hours
                </label>
                <input type="number" step="100" min="100" className={inputClass} style={inputStyle} value={annualHours} onChange={(e) => setAnnualHours(Number(e.target.value))} />
              </div>
            </div>
            <div className="pt-2">
              <button
                className="px-5 py-2.5 text-[11px] tracking-widest uppercase border transition-colors"
                style={{ ...mono, background: colors.maroon[800], borderColor: colors.maroon[700], color: "#ffffff" }}
                onClick={() => toast.success("Organization settings saved")}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Team Tab ──────────────────────────────────────────────────── */}
      {tab === "team" && (
        <div className="space-y-4">
          {/* Invite form */}
          <div className="border p-4" style={{ borderColor: colors.border.default, background: colors.bg.panel }}>
            <div className="text-[10px] tracking-widest uppercase mb-3" style={{ ...mono, color: colors.text.tertiary }}>
              Invite Team Member
            </div>
            <div className="flex gap-3">
              <input
                className={`flex-1 ${inputClass}`}
                style={inputStyle}
                placeholder="email@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <select
                className="px-3 py-2 text-[12px] border outline-none"
                style={{ ...inputStyle, appearance: "none", width: "140px" }}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="auditor">Auditor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border"
                style={{ ...mono, background: colors.maroon[800], borderColor: colors.maroon[700], color: "#fff" }}
                onClick={() => {
                  if (inviteEmail) { toast.success(`Invite sent to ${inviteEmail}`); setInviteEmail("") }
                }}
              >
                <Plus size={11} /> Invite
              </button>
            </div>
          </div>

          {/* Member list */}
          <div className="border" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
            <div className="grid border-b" style={{ gridTemplateColumns: "1fr 120px 120px 120px 60px", background: colors.bg.panel, borderColor: colors.border.default }}>
              {["MEMBER", "ROLE", "JOINED", "LAST ACTIVE", ""].map((h) => (
                <div key={h || "act"} className="px-4 py-2 text-[9px] tracking-[0.15em] uppercase" style={{ ...mono, color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>
                  {h}
                </div>
              ))}
            </div>
            {team.map((m, idx) => (
              <div key={m.email} className="grid border-b" style={{ gridTemplateColumns: "1fr 120px 120px 120px 60px", background: idx % 2 === 0 ? colors.bg.page : colors.bg.alt, borderColor: colors.border.light }}>
                <div className="px-4 py-3" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <div className="text-[12px]" style={{ fontWeight: 500, color: colors.text.primary }}>{m.email}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: colors.text.muted }}>{ROLE_DESCRIPTIONS[m.role]}</div>
                </div>
                <div className="px-4 py-3 flex items-center" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 border"
                    style={{ ...mono, color: m.role === "owner" ? colors.maroon[700] : colors.text.tertiary, borderColor: m.role === "owner" ? colors.maroon[700] : colors.border.default, background: m.role === "owner" ? colors.maroon[100] : colors.bg.panel }}>
                    {m.role}
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <span className="text-[10px]" style={{ ...mono, color: colors.text.muted }}>{m.joinedAt}</span>
                </div>
                <div className="px-4 py-3 flex items-center" style={{ borderRight: `1px solid ${colors.border.light}` }}>
                  <span className="text-[10px]" style={{ ...mono, color: colors.text.muted }}>{m.lastActive}</span>
                </div>
                <div className="px-4 py-3 flex items-center justify-center">
                  {m.role !== "owner" && (
                    <button className="p-1 text-[#9ca3af] hover:text-[#dc2626] transition-colors" title="Remove member">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sites Tab ─────────────────────────────────────────────────── */}
      {tab === "sites" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {sites.map((s) => (
              <div
                key={s.id}
                className="border cursor-pointer transition-all"
                style={{
                  borderColor: selectedSite === s.id ? colors.maroon[700] : colors.border.default,
                  borderWidth: selectedSite === s.id ? "2px" : "1px",
                  background: selectedSite === s.id ? colors.maroon[50] : colors.bg.page,
                }}
                onClick={() => setSelectedSite(selectedSite === s.id ? null : s.id)}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: colors.border.light, background: colors.bg.panel }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ fontWeight: 600, color: colors.text.primary }}>{s.name}</span>
                    <Building2 size={12} color={colors.text.muted} />
                  </div>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="text-[10px]" style={{ color: colors.text.tertiary }}>{s.address}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[8px] tracking-widest uppercase" style={{ ...mono, color: colors.text.muted }}>AREA</div>
                      <div className="text-[12px]" style={{ ...mono, color: colors.text.primary }}>{s.totalArea.toLocaleString()} ft²</div>
                    </div>
                    <div>
                      <div className="text-[8px] tracking-widest uppercase" style={{ ...mono, color: colors.text.muted }}>FLOORS</div>
                      <div className="text-[12px]" style={{ ...mono, color: colors.text.primary }}>{s.floors}</div>
                    </div>
                  </div>
                  <div className="text-[9px]" style={{ color: colors.text.muted }}>{s.buildingType}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border"
            style={{ ...mono, background: colors.bg.panel, borderColor: colors.border.default, color: colors.text.tertiary }}
            onClick={() => toast.info("Add site form would open")}
          >
            <Plus size={11} /> Add Site
          </button>
        </div>
      )}

      {/* ── Integrations Tab ──────────────────────────────────────────── */}
      {tab === "integrations" && (
        <div className="space-y-6">
          {/* API Keys */}
          <div>
            <SectionHeader title="API Keys" right={`${apiKeys.length} active`} />
            <div className="border" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
              {apiKeys.map((k, idx) => (
                <div key={k.id} className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border.light, background: idx % 2 === 0 ? colors.bg.page : colors.bg.alt }}>
                  <div>
                    <div className="text-[12px]" style={{ fontWeight: 500, color: colors.text.primary }}>{k.name}</div>
                    <div className="text-[10px] mt-0.5 flex items-center gap-3" style={{ ...mono, color: colors.text.muted }}>
                      <span>{k.prefix}</span>
                      <span>Created {k.createdAt}</span>
                      {k.lastUsed && <span>Last used {k.lastUsed}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2" style={{ background: k.active ? colors.pass.fg : colors.fail.fg }} />
                    <button className="p-1 text-[#9ca3af] hover:text-[#dc2626]" title="Revoke">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-3">
              <input className={`flex-1 ${inputClass}`} style={inputStyle} placeholder="Key name (e.g., ERP Integration)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
              <button
                className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border"
                style={{ ...mono, background: colors.maroon[800], borderColor: colors.maroon[700], color: "#fff" }}
                onClick={() => {
                  if (newKeyName) {
                    const fakeKey = `bl_k_${Math.random().toString(36).slice(2, 12)}`
                    setShowNewKey(fakeKey)
                    toast.success("API key created — copy it now, it won't be shown again")
                    setNewKeyName("")
                  }
                }}
              >
                <Key size={11} /> Generate Key
              </button>
            </div>
            {showNewKey && (
              <div className="mt-2 border p-3 flex items-center justify-between" style={{ borderColor: colors.pass.border, background: colors.pass.bg }}>
                <span className="text-[11px]" style={{ ...mono, color: colors.text.primary }}>{showNewKey}</span>
                <button
                  className="flex items-center gap-1 text-[10px]"
                  style={{ color: colors.pass.fg }}
                  onClick={() => { navigator.clipboard.writeText(showNewKey); toast.success("Copied to clipboard") }}
                >
                  <Copy size={11} /> Copy
                </button>
              </div>
            )}
          </div>

          {/* Webhooks */}
          <div>
            <SectionHeader title="Webhooks" right={`${webhooks.length} registered`} />
            <div className="border" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
              {webhooks.map((w, idx) => (
                <div key={w.id} className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border.light }}>
                  <div>
                    <div className="text-[11px]" style={{ ...mono, color: colors.text.primary }}>{w.url}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {w.events.map((ev) => (
                        <span key={ev} className="text-[8px] tracking-wider uppercase px-1.5 py-0.5 border"
                          style={{ ...mono, color: colors.info.fg, background: colors.info.bg, borderColor: colors.info.border }}>
                          {ev.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2" style={{ background: w.active ? colors.pass.fg : colors.fail.fg }} />
                    <button className="p-1 text-[#9ca3af] hover:text-[#dc2626]" title="Delete"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-3">
              <input className={`flex-1 ${inputClass}`} style={inputStyle} placeholder="https://hooks.example.com/endpoint" value={newWebhookUrl} onChange={(e) => setNewWebhookUrl(e.target.value)} />
              <button
                className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border"
                style={{ ...mono, background: colors.maroon[800], borderColor: colors.maroon[700], color: "#fff" }}
                onClick={() => { if (newWebhookUrl) { toast.success("Webhook registered"); setNewWebhookUrl("") } }}
              >
                <Webhook size={11} /> Add Webhook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Compliance Tab ────────────────────────────────────────────── */}
      {tab === "compliance" && (
        <div className="space-y-6">
          {/* Active standards */}
          <div>
            <SectionHeader title="Active Standards" right={`${activeStandards.length} of ${STANDARDS_LIST.length} enabled`} />
            <div className="border p-4 space-y-2" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
              {STANDARDS_LIST.map((std) => {
                const active = activeStandards.includes(std.id)
                return (
                  <label key={std.id} className="flex items-center gap-3 py-1.5 cursor-pointer">
                    <div
                      className="w-3.5 h-3.5 border flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: active ? colors.maroon[700] : colors.border.default, background: active ? colors.maroon[700] : "transparent" }}
                    >
                      {active && <Check size={10} color="#fff" />}
                    </div>
                    <div>
                      <span className="text-[12px]" style={{ fontWeight: 500, color: colors.text.primary }}>{std.name}</span>
                      <span className="text-[10px] ml-2" style={{ ...mono, color: colors.text.muted }}>{std.id}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Custom rules */}
          <div>
            <SectionHeader title="Custom Organization Rules" />
            <div className="border p-5 space-y-4" style={{ borderColor: colors.border.default, background: colors.bg.page }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ ...mono, color: colors.text.tertiary }}>
                    Maximum CCT (K)
                  </label>
                  <input className={inputClass} style={inputStyle} type="number" placeholder="e.g., 4000" value={maxCct} onChange={(e) => setMaxCct(e.target.value)} />
                  <p className="text-[9px] mt-1" style={{ color: colors.text.muted }}>Fixtures exceeding this CCT will be flagged</p>
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-1.5" style={{ ...mono, color: colors.text.tertiary }}>
                    Minimum CRI
                  </label>
                  <input className={inputClass} style={inputStyle} type="number" placeholder="e.g., 80" value={minCri} onChange={(e) => setMinCri(e.target.value)} />
                  <p className="text-[9px] mt-1" style={{ color: colors.text.muted }}>Fixtures below this CRI will be flagged</p>
                </div>
              </div>
              <button
                className="px-5 py-2.5 text-[11px] tracking-widest uppercase border"
                style={{ ...mono, background: colors.maroon[800], borderColor: colors.maroon[700], color: "#ffffff" }}
                onClick={() => toast.success("Custom rules saved")}
              >
                Save Rules
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterBar
        left="Configuration changes apply to all team members"
        right="BEAMLEDGER SETTINGS v2.4.1"
      />
    </div>
  )
}
