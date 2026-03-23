"use client"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const

export default function ProductDetailsPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="p-6">
      <div className="border-b border-[#1e1e26] pb-4 mb-6">
        <Link href="/">
          <button
            className="inline-flex items-center gap-2 text-[11px] tracking-wider uppercase mb-4 transition-colors text-[#5a5a70] hover:text-[#9ca3af]"
            style={mono}
          >
            <ArrowLeft size={11} /> Back to Dashboard
          </button>
        </Link>
        <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ ...mono, color: "#5a5a70" }}>
          Module: Product Registry
        </p>
        <h1 className="text-white tracking-tight" style={{ fontSize: "20px", fontWeight: 600 }}>
          Product Details — {id}
        </h1>
      </div>

      <div className="border border-[#1e1e26] p-8 text-center" style={{ background: "#09090c" }}>
        <p className="text-[12px]" style={{ color: "#5a5a70" }}>
          Product detail view — to be implemented.
        </p>
      </div>
    </div>
  )
}
