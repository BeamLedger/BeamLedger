"use client"
import { mono, colors } from "../lib/designTokens"
import type { ReactNode } from "react"

interface Props {
  module: string
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function PageHeader({ module, title, subtitle, actions }: Props) {
  return (
    <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: colors.border.default }}>
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ ...mono, color: colors.text.tertiary }}>
          Module: {module}
        </p>
        <h1 className="tracking-tight" style={{ fontSize: "20px", fontWeight: 600, color: colors.text.primary }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] mt-0.5" style={{ color: colors.text.tertiary }}>{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
