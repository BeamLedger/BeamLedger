"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { productTypes, standardsDatabase } from "../../lib/mockData"
import { Shield, Radio, Zap, Leaf, FileText, ChevronRight, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { mono } from "../../lib/designTokens"

const CATEGORY_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  Safety:        { color: "#2563eb", bg: "#eff6ff", border: "#93c5fd", label: "SAFETY" },
  EMC:           { color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", label: "EMC" },
  Energy:        { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", label: "ENERGY" },
  Environmental: { color: "#059669", bg: "#ecfdf5", border: "#6ee7b7", label: "ENVIRONMENTAL" },
  Connectivity:  { color: "#4f46e5", bg: "#eef2ff", border: "#a5b4fc", label: "CONNECTIVITY" },
}

function getCatMeta(cat: string) {
  return CATEGORY_META[cat] ?? { color: "#6b7280", bg: "#f9fafb", border: "#d1d5db", label: cat.toUpperCase() }
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
    "w-full px-3 py-2 text-[12px] border outline-none transition-colors"
  const inputStyle = {
    background: "#ffffff",
    borderColor: "#e5e7eb",
    color: "#1f2937",
  }

  const isFormValid = formData.productName && selectedProductType && selectedStandards.length > 0

  return (
    <div className="p-6">
      {/* Page title */}
      <div className="border-b border-[#e5e7eb] pb-4 mb-6">
        <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ ...mono, color: "#6b7280" }}>
          Module: Compliance Verification
        </p>
        <h1 className="tracking-tight" style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937" }}>
          New Verification Request
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: "#6b7280" }}>
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
                className="flex items-center gap-3 px-4 py-2.5 border border-b-0 border-[#e5e7eb]"
                style={{ background: "#f9fafb" }}
              >
                <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
                  Section 1 — Product Information
                </span>
                <ChevronRight size={10} color="#9ca3af" />
                <span className="text-[10px]" style={{ ...mono, color: "#9ca3af" }}>
                  Required
                </span>
              </div>

              <div className="border border-[#e5e7eb] p-5 space-y-4" style={{ background: "#ffffff" }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-[10px] tracking-widest uppercase mb-1.5"
                      style={{ ...mono, color: "#6b7280" }}
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
                      style={{ ...mono, color: "#6b7280" }}
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
                        <option key={t} value={t} style={{ background: "#ffffff" }}>
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
                      style={{ ...mono, color: "#6b7280" }}
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
                      style={{ ...mono, color: "#6b7280" }}
                    >
                      Model / Part Number
                    </label>
                    <input
                      className={inputClass}
                      style={{ ...inputStyle, fontFamily: "'Ubin Sans', monospace" }}
                      placeholder="e.g., SG-LED-2000-X"
                      value={formData.modelNumber}
                      onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-[10px] tracking-widest uppercase mb-1.5"
                    style={{ ...mono, color: "#6b7280" }}
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
                className="flex items-center gap-3 px-4 py-2.5 border border-b-0 border-[#e5e7eb]"
                style={{ background: "#f9fafb" }}
              >
                <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
                  Section 2 — Applicable Standards
                </span>
                {selectedProductType && (
                  <>
                    <ChevronRight size={10} color="#9ca3af" />
                    <span className="text-[10px]" style={{ ...mono, color: "#9ca3af" }}>
                      {applicableStandards.length} available for {selectedProductType}
                    </span>
                  </>
                )}
              </div>

              <div className="border border-[#e5e7eb]" style={{ background: "#ffffff" }}>
                {!selectedProductType ? (
                  <div className="flex items-center gap-2 px-5 py-8" style={{ color: "#9ca3af" }}>
                    <AlertCircle size={14} />
                    <span className="text-[11px]" style={mono}>
                      Select a product type in Section 1 to load applicable standards.
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Table header */}
                    <div
                      className="grid border-b border-[#e5e7eb]"
                      style={{ gridTemplateColumns: "36px 130px 1fr 160px", background: "#f9fafb" }}
                    >
                      {["", "STANDARD", "DESCRIPTION", "CATEGORY"].map((h) => (
                        <div
                          key={h || 'check'}
                          className="px-4 py-2 text-[9px] tracking-widest uppercase"
                          style={{ ...mono, color: "#6b7280", borderRight: "1px solid #f0f0f2" }}
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
                          className="grid border-b border-[#f0f0f2] cursor-pointer transition-colors"
                          style={{
                            gridTemplateColumns: "36px 130px 1fr 160px",
                            background: checked ? "rgba(127,29,29,0.06)" : idx % 2 === 0 ? "#ffffff" : "#fafafa",
                            borderLeft: checked ? "2px solid #991b1b" : "2px solid transparent",
                          }}
                          onClick={() => toggleStandard(std.id)}
                        >
                          <div
                            className="flex items-center justify-center"
                            style={{ borderRight: "1px solid #f0f0f2" }}
                          >
                            <div
                              className="w-3 h-3 border flex items-center justify-center"
                              style={{ borderColor: checked ? "#991b1b" : "#d1d5db", background: checked ? "#991b1b" : "transparent" }}
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
                            style={{ borderRight: "1px solid #f0f0f2" }}
                          >
                            <span className="text-[11px]" style={{ ...mono, fontWeight: 500, color: "#1f2937" }}>
                              {std.name}
                            </span>
                          </div>
                          <div
                            className="px-4 py-2.5 flex items-center"
                            style={{ borderRight: "1px solid #f0f0f2" }}
                          >
                            <span className="text-[11px]" style={{ color: "#6b7280" }}>
                              {std.description}
                            </span>
                          </div>
                          <div className="px-3 py-2.5 flex items-center overflow-hidden">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] tracking-wider uppercase border whitespace-nowrap max-w-full overflow-hidden text-ellipsis"
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
                className="px-4 py-2.5 border border-b-0 border-[#e5e7eb]"
                style={{ background: "#f9fafb" }}
              >
                <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: "#6b7280" }}>
                  Submission Summary
                </span>
              </div>
              <div className="border border-[#e5e7eb] p-4 space-y-3" style={{ background: "#ffffff" }}>
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
                    <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: "#9ca3af", flexShrink: 0 }}>
                      {item.label}
                    </span>
                    <span className="text-[11px] text-right" style={{ color: "#4b5563" }}>
                      {item.value}
                    </span>
                  </div>
                ))}

                <div className="border-t border-[#e5e7eb] pt-3">
                  {selectedStandards.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {selectedStandards.map((id) => {
                        const std = standardsDatabase.find((s) => s.id === id)
                        const meta = getCatMeta(std?.category ?? "")
                        return std ? (
                          <div key={id} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full" style={{ background: meta.color }}></div>
                            <span className="text-[10px]" style={{ ...mono, color: "#6b7280" }}>
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
            <div className="border border-[#bbf7d0] p-3" style={{ background: "#f0fdf4" }}>
              <p className="text-[10px] leading-relaxed" style={{ color: "#166534" }}>
                Submission will initiate an automated compliance analysis. Results will be available immediately upon processing.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full px-4 py-3 text-[11px] tracking-widest uppercase border transition-colors"
              style={{
                ...mono,
                background: !isFormValid ? "#f5f0f0" : "#7f1d1d",
                borderColor: !isFormValid ? "#e0d0d0" : "#991b1b",
                color: !isFormValid ? "#b09090" : "#ffffff",
                cursor: !isFormValid ? "not-allowed" : "pointer",
              }}
              disabled={!isFormValid}
            >
              Submit for Verification
            </button>

            <div className="text-center">
              <span className="text-[9px]" style={{ ...mono, color: "#9ca3af" }}>
                CVRS-FORM-NV &middot; Rev. 4 &middot; Mar 2026
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
