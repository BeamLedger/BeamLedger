"use client"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { STATUS_CONFIG, STATUS_CONFIG_LONG, mono } from "../lib/designTokens"
import type { StatusKey } from "../lib/designTokens"

const ICONS: Record<StatusKey, typeof CheckCircle2> = {
  pass: CheckCircle2,
  fail: XCircle,
  exempt: AlertCircle,
  data_error: AlertCircle,
}

interface Props {
  status: StatusKey
  long?: boolean
  size?: "sm" | "md"
}

export default function StatusBadge({ status, long = false, size = "sm" }: Props) {
  const cfg = long ? STATUS_CONFIG_LONG[status] : STATUS_CONFIG[status]
  const Icon = ICONS[status]
  const textSize = size === "sm" ? "text-[8px] tracking-wider" : "text-[9px] tracking-widest"
  const iconSize = size === "sm" ? 8 : 9
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 ${textSize} uppercase border whitespace-nowrap`}
      style={{ ...mono, color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <Icon size={iconSize} /> {cfg.label}
    </span>
  )
}
