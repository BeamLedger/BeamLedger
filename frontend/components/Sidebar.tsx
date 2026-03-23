"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusSquare, FileText, Activity, ChevronRight } from 'lucide-react'

const NAV_ITEMS = [
  {
    section: "OPERATIONS",
    links: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/new-check", label: "New Verification", icon: PlusSquare, exact: false },
    ],
  },
  {
    section: "RECORDS",
    links: [
      { to: "/results/1", label: "Recent Reports", icon: FileText, exact: false },
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
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-[#2a1515]" style={{ background: "#1a0505" }}>
      {/* Wordmark */}
      <div className="px-5 pt-5 pb-4 border-b border-[#2a1515]">
        <div
          className="text-[9px] tracking-[0.2em] uppercase mb-2"
          style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#7f3333" }}
        >
          CVRS &middot; v2.4.1
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 flex-shrink-0" style={{ background: "#7f1d1d" }}>
            <svg viewBox="0 0 20 20" fill="none" className="w-full h-full p-0.5">
              <circle cx="10" cy="8" r="4" stroke="#fca5a5" strokeWidth="1.5" />
              <path d="M10 12v6" stroke="#fca5a5" strokeWidth="1.5" />
              <path d="M6 18h8" stroke="#fca5a5" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="text-white tracking-[0.12em] uppercase" style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em" }}>
            BeamLedger
          </span>
        </div>
        <div className="text-[9px] tracking-widest uppercase" style={{ color: "#7f3333", fontFamily: "'IBM Plex Mono', monospace" }}>
          Compliance Verification
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map((section) => (
          <div key={section.section} className="mb-5">
            <div
              className="px-5 mb-1 text-[9px] tracking-[0.18em] uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#5a2020" }}
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
                    background: active ? "rgba(127,29,29,0.25)" : "transparent",
                    color: active ? "#fca5a5" : "#9b6b6b",
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
      <div className="px-5 py-4 border-t border-[#2a1515]">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span className="text-[10px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#5a7a5a" }}>
            SYSTEM ONLINE
          </span>
        </div>
        <div
          className="text-[9px] leading-relaxed"
          style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#4a2a2a" }}
        >
          SESSION ACTIVE<br />
          AUTH: LEVEL-2
        </div>
      </div>
    </aside>
  )
}
