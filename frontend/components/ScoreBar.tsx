"use client"
import { mono, scoreColor } from "../lib/designTokens"

interface Props {
  score: number
  showLabel?: boolean
}

export default function ScoreBar({ score, showLabel = true }: Props) {
  const color = scoreColor(score)
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="flex-1 h-1.5 overflow-hidden" style={{ minWidth: 0, maxWidth: "48px", background: "#e5e7eb" }}>
        <div className="h-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      {showLabel && (
        <span className="text-[10px] flex-shrink-0" style={{ ...mono, color }}>{score}%</span>
      )}
    </div>
  )
}
