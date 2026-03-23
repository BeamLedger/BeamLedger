"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { productTypes, standardsDatabase } from "../../lib/mockData"
import { Shield, Radio, Zap, Leaf, FileText, ChevronRight, AlertCircle } from "lucide-react"
import { toast } from "sonner"

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const

const CATEGORY_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Safety:        { color: "#60a5fa", bg: "#03060f", border: "#1e3a5f", label: "SAFETY" },
  EMC:           { color: "#c084fc", bg: "#0a0312", border: "#3b1a5f", label: "EMC" },
  Energy:        { color: "#4ade80", bg: "#020f06", border: "#134a26", label: "ENERGY" },
  Environmental: { color: "#34d399", bg: "#020f08", border: "#0f3a20", label: "ENVIRONMENTAL" },
  Connectivity:  { color: "#818cf8", bg: "#03040f", border: "#1e2060", label: "CONNECTIVITY" },
}

function getCatMeta(cat: string) {
  return CATEGORY_META[cat] ?? { color: "#9ca3af", bg: "#0a0a0d", border: "#2a2a35", label: cat.toUpperCase() }
}

function getCatIcon(cat: string) {
  switch (cat) {
    case "Safety": return <Shield size={11} />
    case "EMC": return <Radio size={11} />
    case "Energy": return <Zap size={11} />
    case "Environmental": return <Leaf size={11} />
    case "Connectivity": return <Radio size={11} />
    default: return <FileText size={11} />
  }
}

export default function NewCheckPage() {
  const router = useRouter()
  const [selectedProductType, setSelectedProductType] = useState("")
  const [selectedStandards, setSelectedStandards] = useState<string[]>([])
  const [formData, setFormData] = useState({
    productName: "",
    manufacturer: "",
    modelNumber: "",
    description: "",
  })

  const applicableStandards = selectedProductType
    ? standardsDatabase.filter((std) => std.applicableTo.includes(selectedProductType))
    : []

  const toggleStandard = (id: string) => {
    setSelectedStandards((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.productName || !selectedProductType) {
      toast.error("Required fields missing", { description: "Product name and type are required." })
      return
    }
    if (selectedStandards.length === 0) {
      toast.error("No standards selected", { description: "Select at least one applicable standard." })
      return
    }
    toast.success("Verification request submitted", {
      description: `Processing against ${selectedStandards.length} standard(s)...`,
    })
    setTimeout(() => router.push("/results/1"), 1500)
  }

  const inputClass =
    "w-full px-3 py-2 text-[12px] border outline-none transition-colors text-white"
  const inputStyle = {
    background: "#07070a",
    borderColor: "#1e1e2a",
    color: "#e5e5f0",
  }

  const isFormValid = formData.productName && selectedProductType && selectedStandards.length > 0

  return (
    <div className="p-6">
      {/* Page title */}
      <div className="border-b border-[#1e1e26] pb-4 mb-6">
        <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ ...mono, color: "#5a5a70" }}>
          Module: Compliance Verification
        </p>
        <h1 className="text-white tracking-tight" style={{ fontSize: "20px", fontWeight: 600 }}>
          New Verification Request
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: "#5a5a70" }}>
          Complete all required fields and select applicable standards before submission.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="col-span-2 space-y-6">
            {/* Section: Product Information */}
            <div>
              <div
                className="flex items-center gap-3 px-4 py-2.5 border border-b-0 border-[#1e1e26]"
                style={{ background: "#0a0a0d" }}
              >
                <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#5a5a70" }}>
                  Section 1 — Product Information
                </span>
                <ChevronRight size={10} color="#3a3a50" />
                <span className="text-[10px]" style={{ ...mono, color: "#3a3a50" }}>
                  Required
                </span>
              </div>

              <div className="border border-[#1e1e26] p-5 space-y-4" style={{ background: "#09090c" }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-[10px] tracking-widest uppercase mb-1.5"
                      style={{ ...mono, color: "#5a5a70" }}
                    >
                      Product Name <span style={{ color: "#991b1b" }}>*</span>
                    </label>
                    <input
                      className={inputClass}
                      style={inputStyle}
                      placeholder="e.g., SmartGlow LED Street Light"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-[10px] tracking-widest uppercase mb-1.5"
                      style={{ ...mono, color: "#5a5a70" }}
                    >
                      Product Type <span style={{ color: "#991b1b" }}>*</span>
                    </label>
                    <select
                      className={inputClass}
                      style={{ ...inputStyle, appearance: "none" }}
                      value={selectedProductType}
                      onChange={(e) => {
                        setSelectedProductType(e.target.value)
                        setSelectedStandards([])
                      }}
                      required
                    >
                      <option value="">— Select type —</option>
                      {productTypes.map((t) => (
                        <option key={t} value={t} style={{ background: "#0a0a0d" }}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-[10px] tracking-widest uppercase mb-1.5"
                      style={{ ...mono, color: "#5a5a70" }}
                    >
                      Manufacturer
                    </label>
                    <input
                      className={inputClass}
                      style={inputStyle}
                      placeholder="Company / legal entity name"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-[10px] tracking-widest uppercase mb-1.5"
                      style={{ ...mono, color: "#5a5a70" }}
                    >
                      Model / Part Number
                    </label>
                    <input
                      className={inputClass}
                      style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace" }}
                      placeholder="e.g., SG-LED-2000-X"
                      value={formData.modelNumber}
                      onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-[10px] tracking-widest uppercase mb-1.5"
                    style={{ ...mono, color: "#5a5a70" }}
                  >
                    Technical Description
                  </label>
                  <textarea
                    className={inputClass}
                    style={{ ...inputStyle, resize: "vertical" }}
                    rows={4}
                    placeholder="Provide a brief technical description of the product, key features, operating parameters..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section: Standards Selection */}
            <div>
              <div
                className="flex items-center gap-3 px-4 py-2.5 border border-b-0 border-[#1e1e26]"
                style={{ background: "#0a0a0d" }}
              >
                <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#5a5a70" }}>
                  Section 2 — Applicable Standards
                </span>
                {selectedProductType && (
                  <>
                    <ChevronRight size={10} color="#3a3a50" />
                    <span className="text-[10px]" style={{ ...mono, color: "#3a3a50" }}>
                      {applicableStandards.length} available for {selectedProductType}
                    </span>
                  </>
                )}
              </div>

              <div className="border border-[#1e1e26]" style={{ background: "#09090c" }}>
                {!selectedProductType ? (
                  <div className="flex items-center gap-2 px-5 py-8" style={{ color: "#3a3a50" }}>
                    <AlertCircle size={14} />
                    <span className="text-[11px]" style={mono}>
                      Select a product type in Section 1 to load applicable standards.
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Table header */}
                    <div
                      className="grid border-b border-[#1e1e26]"
                      style={{ gridTemplateColumns: "36px 130px 1fr 120px", background: "#0a0a0d" }}
                    >
                      {["", "STANDARD", "DESCRIPTION", "CATEGORY"].map((h) => (
                        <div
                          key={h || 'check'}
                          className="px-4 py-2 text-[9px] tracking-widest uppercase"
                          style={{ ...mono, color: "#3a3a50", borderRight: "1px solid #141419" }}
                        >
                          {h}
                        </div>
                      ))}
                    </div>

                    {applicableStandards.map((std, idx) => {
                      const checked = selectedStandards.includes(std.id)
                      const meta = getCatMeta(std.category)
                      return (
                        <div
                          key={std.id}
                          className="grid border-b border-[#131318] cursor-pointer transition-colors"
                          style={{
                            gridTemplateColumns: "36px 130px 1fr 120px",
                            background: checked ? "rgba(127,29,29,0.12)" : idx % 2 === 0 ? "#09090c" : "#0b0b0f",
                            borderLeft: checked ? "2px solid #991b1b" : "2px solid transparent",
                          }}
                          onClick={() => toggleStandard(std.id)}
                        >
                          <div
                            className="flex items-center justify-center"
                            style={{ borderRight: "1px solid #141419" }}
                          >
                            <div
                              className="w-3 h-3 border flex items-center justify-center"
                              style={{ borderColor: checked ? "#991b1b" : "#2a2a35", background: checked ? "#991b1b" : "transparent" }}
                            >
                              {checked && (
                                <svg viewBox="0 0 10 10" className="w-2 h-2" fill="none">
                                  <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div
                            className="px-4 py-2.5 flex items-center"
                            style={{ borderRight: "1px solid #141419" }}
                          >
                            <span className="text-[11px] text-white" style={{ ...mono, fontWeight: 500 }}>
                              {std.name}
                            </span>
                          </div>
                          <div
                            className="px-4 py-2.5 flex items-center"
                            style={{ borderRight: "1px solid #141419" }}
                          >
                            <span className="text-[11px]" style={{ color: "#6b6b80" }}>
                              {std.description}
                            </span>
                          </div>
                          <div className="px-4 py-2.5 flex items-center">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] tracking-widest uppercase border"
                              style={{ ...mono, color: meta.color, background: meta.bg, borderColor: meta.border }}
                            >
                              {getCatIcon(std.category)} {meta.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Summary panel + submit */}
          <div className="space-y-4">
            <div>
              <div
                className="px-4 py-2.5 border border-b-0 border-[#1e1e26]"
                style={{ background: "#0a0a0d" }}
              >
                <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#5a5a70" }}>
                  Submission Summary
                </span>
              </div>
              <div className="border border-[#1e1e26] p-4 space-y-3" style={{ background: "#09090c" }}>
                {[
                  { label: "PRODUCT", value: formData.productName || "—" },
                  { label: "TYPE", value: selectedProductType || "—" },
                  { label: "MANUFACTURER", value: formData.manufacturer || "—" },
                  { label: "MODEL", value: formData.modelNumber || "—" },
                  {
                    label: "STANDARDS SELECTED",
                    value: selectedStandards.length ? `${selectedStandards.length} standard(s)` : "None",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-2">
                    <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: "#4a4a5e", flexShrink: 0 }}>
                      {item.label}
                    </span>
                    <span className="text-[11px] text-right" style={{ color: "#9ca3af" }}>
                      {item.value}
                    </span>
                  </div>
                ))}

                <div className="border-t border-[#1e1e26] pt-3">
                  {selectedStandards.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {selectedStandards.map((id) => {
                        const std = standardsDatabase.find((s) => s.id === id)
                        const meta = getCatMeta(std?.category ?? "")
                        return std ? (
                          <div key={id} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full" style={{ background: meta.color }}></div>
                            <span className="text-[10px]" style={{ ...mono, color: "#6b6b80" }}>
                              {std.name}
                            </span>
                          </div>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="border border-[#1e2a1e] p-3" style={{ background: "#05120a" }}>
              <p className="text-[10px] leading-relaxed" style={{ color: "#4a7a5a" }}>
                Submission will initiate an automated compliance analysis. Results will be available immediately upon processing.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full px-4 py-3 text-[11px] tracking-widest uppercase border transition-colors"
              style={{
                ...mono,
                background: !isFormValid ? "#1a0a0a" : "#7f1d1d",
                borderColor: !isFormValid ? "#2a1010" : "#991b1b",
                color: !isFormValid ? "#4a2020" : "#fecaca",
                cursor: !isFormValid ? "not-allowed" : "pointer",
              }}
              disabled={!isFormValid}
            >
              Submit for Verification
            </button>

            <div className="text-center">
              <span className="text-[9px]" style={{ ...mono, color: "#3a3a50" }}>
                CVRS-FORM-NV &middot; Rev. 4 &middot; Mar 2026
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
