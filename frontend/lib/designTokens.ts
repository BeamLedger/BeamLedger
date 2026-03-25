/**
 * Design System Tokens — single source of truth for all colors, spacing, and styles.
 * Import from here instead of using inline hex values.
 */

// ── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Brand / Accent
  maroon: {
    900: "#4a0404",
    800: "#7f1d1d",
    700: "#991b1b",
    600: "#b91c1c",
    100: "rgba(127,29,29,0.08)",
    50: "rgba(127,29,29,0.04)",
  },

  // Semantic
  pass:      { fg: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
  fail:      { fg: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
  exempt:    { fg: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
  dataError: { fg: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
  info:      { fg: "#4f46e5", bg: "#eef2ff", border: "#a5b4fc" },

  // Neutral
  text: {
    primary:   "#1f2937",
    secondary: "#4b5563",
    tertiary:  "#6b7280",
    muted:     "#9ca3af",
    faint:     "#d1d5db",
  },
  bg: {
    page:    "#ffffff",
    panel:   "#f9fafb",
    sidebar: "#faf8f8",
    hover:   "#f5f5fa",
    alt:     "#fafafa",
  },
  border: {
    default: "#e5e7eb",
    light:   "#f0f0f2",
    sidebar: "#e0d0d0",
  },

  // Category (for standards)
  safety:        { fg: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
  emc:           { fg: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
  energy:        { fg: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
  environmental: { fg: "#059669", bg: "#ecfdf5", border: "#6ee7b7" },
  connectivity:  { fg: "#4f46e5", bg: "#eef2ff", border: "#a5b4fc" },

  // Charts
  chart: {
    green:  "#16a34a",
    lime:   "#65a30d",
    amber:  "#d97706",
    orange: "#ea580c",
    red:    "#dc2626",
    purple: "#7c3aed",
    blue:   "#2563eb",
  },

  // Notice bar
  notice: {
    fg:     "#92800a",
    bg:     "#fdfcf8",
    border: "#e5dfd0",
    accent: "#a0903a",
  },
} as const

// ── Typography ──────────────────────────────────────────────────────────────

export const font = {
  sans: "'Ubin Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'Ubin Sans', 'Courier New', monospace",
} as const

export const mono = { fontFamily: font.mono } as const

// ── Reusable style objects ──────────────────────────────────────────────────

export const inputBaseClass =
  "w-full px-3 py-2 text-[12px] border outline-none transition-colors"

export const inputBaseStyle = {
  background: colors.bg.page,
  borderColor: colors.border.default,
  color: colors.text.primary,
} as const

// ── Status config map ───────────────────────────────────────────────────────

export type StatusKey = "pass" | "fail" | "exempt" | "data_error"

export const STATUS_CONFIG: Record<StatusKey, { color: string; bg: string; border: string; label: string }> = {
  pass:       { color: colors.pass.fg,      bg: colors.pass.bg,      border: colors.pass.border,      label: "PASS" },
  fail:       { color: colors.fail.fg,      bg: colors.fail.bg,      border: colors.fail.border,      label: "FAIL" },
  exempt:     { color: colors.exempt.fg,    bg: colors.exempt.bg,    border: colors.exempt.border,    label: "EXEMPT" },
  data_error: { color: colors.dataError.fg, bg: colors.dataError.bg, border: colors.dataError.border, label: "DATA ERROR" },
} as const

export const STATUS_CONFIG_LONG: Record<StatusKey, { color: string; bg: string; border: string; label: string }> = {
  pass:       { ...STATUS_CONFIG.pass,       label: "COMPLIANT" },
  fail:       { ...STATUS_CONFIG.fail,       label: "NON-COMPLIANT" },
  exempt:     { ...STATUS_CONFIG.exempt,     label: "EXEMPT" },
  data_error: { ...STATUS_CONFIG.data_error, label: "DATA ERROR" },
} as const

// ── Score color helper ──────────────────────────────────────────────────────

export function scoreColor(score: number): string {
  if (score >= 80) return colors.chart.green
  if (score >= 60) return colors.chart.lime
  if (score >= 40) return colors.chart.amber
  if (score >= 20) return colors.chart.orange
  return colors.chart.red
}
