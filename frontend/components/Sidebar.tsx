"use client"
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusSquare, FileText, Search, Upload, DollarSign, Map, Activity, Settings } from 'lucide-react'

function LightBulb() {
  const [on, setOn] = useState(true)

  return (
    <div
      className="w-6 h-6 flex-shrink-0 cursor-pointer select-none"
      onClick={() => setOn(!on)}
      title={on ? "Click to turn off" : "Click to turn on"}
    >
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
        {on && (
          <>
            <circle cx="32" cy="26" r="22" fill="#fbbf24" opacity="0.15">
              <animate attributeName="r" values="20;24;20" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.12;0.2;0.12" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="32" cy="26" r="16" fill="#fbbf24" opacity="0.10">
              <animate attributeName="r" values="14;17;14" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.08;0.15;0.08" dur="1.8s" repeatCount="indefinite" />
            </circle>
          </>
        )}
        <path
          d="M32 6C22.06 6 14 14.06 14 24c0 6.5 3.4 12.2 8.5 15.4C24.2 40.6 25 42.8 25 45v1h14v-1c0-2.2.8-4.4 2.5-5.6C46.6 36.2 50 30.5 50 24c0-9.94-8.06-18-18-18z"
          fill={on ? "#fbbf24" : "#d1d5db"}
          stroke={on ? "#f59e0b" : "#9ca3af"}
          strokeWidth="2"
        >
          {on && (
            <animate attributeName="fill" values="#fbbf24;#fcd34d;#fbbf24" dur="2s" repeatCount="indefinite" />
          )}
        </path>
        <path
          d="M28 28c0-3 2-6 4-6s4 3 4 6"
          stroke={on ? "#b45309" : "#9ca3af"}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        >
          {on && (
            <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
          )}
        </path>
        <rect x="24" y="46" width="16" height="3" rx="0" fill={on ? "#991b1b" : "#6b7280"} />
        <rect x="25" y="49" width="14" height="2.5" rx="0" fill={on ? "#7f1d1d" : "#4b5563"} />
        <rect x="26" y="51.5" width="12" height="2.5" rx="0" fill={on ? "#991b1b" : "#6b7280"} />
        <rect x="28" y="54" width="8" height="2" rx="0" fill={on ? "#7f1d1d" : "#4b5563"} />
        {on && (
          <g stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round">
            <line x1="32" y1="1" x2="32" y2="4">
              <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
            </line>
            <line x1="52" y1="10" x2="50" y2="12">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
            </line>
            <line x1="12" y1="10" x2="14" y2="12">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite" />
            </line>
            <line x1="56" y1="24" x2="53" y2="24">
              <animate attributeName="opacity" values="1;0.5;1" dur="1.4s" repeatCount="indefinite" />
            </line>
            <line x1="8" y1="24" x2="11" y2="24">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="1.4s" repeatCount="indefinite" />
            </line>
          </g>
        )}
      </svg>
    </div>
  )
}

const NAV_ITEMS = [
  {
    section: "OPERATIONS",
    links: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/search", label: "Search Fixtures", icon: Search, exact: false },
      { to: "/import", label: "Import Data", icon: Upload, exact: false },
      { to: "/new-check", label: "New Verification", icon: PlusSquare, exact: false },
    ],
  },
  {
    section: "ANALYSIS",
    links: [
      { to: "/roi", label: "ROI Analysis", icon: DollarSign, exact: false },
      { to: "/compliance-map", label: "Compliance Map", icon: Map, exact: false },
    ],
  },
  {
    section: "RECORDS",
    links: [
      { to: "/results/1", label: "Recent Reports", icon: FileText, exact: false },
      { to: "/activity", label: "Activity Trail", icon: Activity, exact: false },
    ],
  },
  {
    section: "SYSTEM",
    links: [
      { to: "/settings", label: "Settings", icon: Settings, exact: false },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (to: string, exact: boolean) => {
    if (exact) return pathname === to
    return pathname.startsWith(to)
  }

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-[#e0d0d0]" style={{ background: "#faf8f8" }}>
      {/* Wordmark */}
      <div className="px-5 pt-5 pb-4 border-b border-[#e0d0d0]">
        <div
          className="text-[9px] tracking-[0.2em] uppercase mb-2"
          style={{ fontFamily: "'Ubin Sans', monospace", color: "#991b1b" }}
        >
          CVRS &middot; v2.4.1
        </div>
        <div className="flex items-center gap-2 mb-1">
          <LightBulb />
          <span className="tracking-[0.12em] uppercase" style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", color: "#1f2937" }}>
            BeamLedger
          </span>
        </div>
        <div className="text-[9px] tracking-widest uppercase" style={{ color: "#991b1b", fontFamily: "'Ubin Sans', monospace" }}>
          Compliance Verification
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map((section) => (
          <div key={section.section} className="mb-5">
            <div
              className="px-5 mb-1 text-[9px] tracking-[0.18em] uppercase"
              style={{ fontFamily: "'Ubin Sans', monospace", color: "#7f1d1d" }}
            >
              {section.section}
            </div>
            {section.links.map((link) => {
              const active = isActive(link.to, link.exact)
              const Icon = link.icon
              return (
                <Link
                  key={link.to}
                  href={link.to}
                  className="flex items-center gap-2.5 px-5 py-2 transition-colors relative"
                  style={{
                    background: active ? "rgba(127,29,29,0.08)" : "transparent",
                    color: active ? "#7f1d1d" : "#6b7280",
                    fontSize: "12px",
                    fontWeight: active ? 600 : 400,
                    borderLeft: active ? "2px solid #991b1b" : "2px solid transparent",
                  }}
                >
                  <Icon size={13} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* System status */}
      <div className="px-5 py-4 border-t border-[#e0d0d0]">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span className="text-[10px]" style={{ fontFamily: "'Ubin Sans', monospace", color: "#16a34a" }}>
            SYSTEM ONLINE
          </span>
        </div>
        <div
          className="text-[9px] leading-relaxed"
          style={{ fontFamily: "'Ubin Sans', monospace", color: "#9b7070" }}
        >
          SESSION ACTIVE<br />
          AUTH: LEVEL-2
        </div>
      </div>
    </aside>
  )
}
