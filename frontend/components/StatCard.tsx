"use client"
import { mono, colors } from "../lib/designTokens"
import type { ReactNode } from "react"

interface Props {
  label: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  color?: string
}

export default function StatCard({ label, value, subtitle, icon, color = colors.text.tertiary }: Props) {
  return (
    <div className="px-4 py-4 border-r border-[#e5e7eb] last:border-r-0">
      <div
        className="text-[9px] tracking-[0.18em] uppercase mb-2 flex items-center gap-1"
        style={{ ...mono, color: colors.text.muted }}
      >
        {icon && <span style={{ color }}>{icon}</span>}
        {label}
      </div>
      <div className="mb-1" style={{ fontSize: "22px", fontWeight: 700, color, ...mono }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[10px]" style={{ color: colors.text.muted }}>{subtitle}</div>
      )}
    </div>
  )
}
