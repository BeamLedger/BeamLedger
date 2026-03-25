"use client"
import { mono, colors } from "../lib/designTokens"

interface Props {
  left: string
  right?: string
}

export default function FooterBar({ left, right }: Props) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2 border"
      style={{ background: colors.notice.bg, borderColor: colors.notice.border }}
    >
      <span className="text-[9px] tracking-widest uppercase" style={{ ...mono, color: colors.notice.fg }}>
        {left}
      </span>
      {right && (
        <span className="text-[9px]" style={{ ...mono, color: colors.notice.accent }}>
          {right}
        </span>
      )}
    </div>
  )
}
