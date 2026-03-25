"use client"
import { mono, colors } from "../lib/designTokens"
import type { ReactNode } from "react"

interface Props {
  title: string
  right?: ReactNode
}

export default function SectionHeader({ title, right }: Props) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 border border-b-0"
      style={{ background: colors.bg.panel, borderColor: colors.border.default }}
    >
      <span className="text-[10px] tracking-widest uppercase" style={{ ...mono, color: colors.text.tertiary }}>
        {title}
      </span>
      {right && (
        <span className="text-[10px]" style={{ ...mono, color: colors.text.muted }}>
          {right}
        </span>
      )}
    </div>
  )
}
