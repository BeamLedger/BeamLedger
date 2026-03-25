"use client"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { mono } from "../../../lib/designTokens"

export default function ProductDetailsPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="p-6">
      <div className="border-b border-[#e5e7eb] pb-4 mb-6">
        <Link href="/">
          <button
            className="inline-flex items-center gap-2 text-[11px] tracking-wider uppercase mb-4 transition-colors text-[#6b7280] hover:text-[#1f2937]"
            style={mono}
          >
            <ArrowLeft size={11} /> Back to Dashboard
          </button>
        </Link>
        <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ ...mono, color: "#6b7280" }}>
          Module: Product Registry
        </p>
        <h1 className="tracking-tight" style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937" }}>
          Product Details — {id}
        </h1>
      </div>

      <div className="border border-[#e5e7eb] p-8 text-center" style={{ background: "#ffffff" }}>
        <p className="text-[12px]" style={{ color: "#6b7280" }}>
          Product detail view — to be implemented.
        </p>
      </div>
    </div>
  )
}
