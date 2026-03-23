"use client"
import { usePathname } from 'next/navigation'
import { Activity, ChevronRight } from 'lucide-react'

export default function UtilityBar() {
  const pathname = usePathname()

  const breadcrumb = pathname === "/"
    ? "DASHBOARD"
    : pathname.startsWith("/new-check")
    ? "NEW VERIFICATION"
    : pathname.startsWith("/results")
    ? "VERIFICATION REPORT"
    : pathname.startsWith("/products")
    ? "PRODUCT DETAILS"
    : "PORTAL"

  return (
    <>
      {/* Utility bar */}
      <div
        className="flex-shrink-0 h-8 flex items-center justify-between px-6 border-b border-[#1a1a1f]"
        style={{ background: "#080809" }}
      >
        <div
          className="text-[10px] tracking-widest"
          style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#333340" }}
        >
          BEAMLEDGER CVRS &middot; AUTHORIZED USE ONLY
        </div>
        <div className="flex items-center gap-4">
          <div
            className="text-[10px] tracking-wider"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#333340" }}
          >
            <Activity size={9} className="inline mr-1" />
            {new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div
        className="flex-shrink-0 h-9 flex items-center px-6 border-b border-[#1a1a1f] gap-1"
        style={{ background: "#0d0d10" }}
      >
        <span className="text-[10px] tracking-wider" style={{ color: "#5a5a70", fontFamily: "'IBM Plex Mono', monospace" }}>
          BEAMLEDGER
        </span>
        <ChevronRight size={10} color="#3a3a50" />
        <span className="text-[10px] tracking-wider" style={{ color: "#7a7a90", fontFamily: "'IBM Plex Mono', monospace" }}>
          {breadcrumb}
        </span>
      </div>
    </>
  )
}
