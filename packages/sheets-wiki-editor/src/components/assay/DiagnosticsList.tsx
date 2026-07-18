import type { AssayPreviewDiagnostic } from "@cartularium/contracts"

interface Props {
  diagnostics: AssayPreviewDiagnostic[]
  // when provided, filters to diagnostics whose field path mentions this
  // platform plus any field-less diagnostics.
  filterPlatform?: string
  maxVisible?: number
}

const SEVERITY_ORDER: Record<AssayPreviewDiagnostic["severity"], number> = {
  error: 0,
  warning: 1,
  info: 2,
}

const SEVERITY_GLYPH: Record<AssayPreviewDiagnostic["severity"], string> = {
  error: "!",
  warning: "△",
  info: "·",
}

export function DiagnosticsList({ diagnostics, filterPlatform, maxVisible = 20 }: Props) {
  const filtered = filterPlatform
    ? diagnostics.filter(
        (d) => !d.field || d.field.includes(`platforms.${filterPlatform}`),
      )
    : diagnostics

  if (filtered.length === 0) return null

  const ordered = [...filtered].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  )
  const counts = filtered.reduce(
    (acc, d) => {
      acc[d.severity]++
      return acc
    },
    { error: 0, warning: 0, info: 0 },
  )

  const summaryParts = [
    counts.error > 0
      ? `${counts.error} ${counts.error === 1 ? "error" : "errors"}`
      : null,
    counts.warning > 0
      ? `${counts.warning} ${counts.warning === 1 ? "warning" : "warnings"}`
      : null,
    counts.info > 0 ? `${counts.info} info` : null,
  ]
    .filter(Boolean)
    .join(", ")

  const visible = ordered.slice(0, maxVisible)
  const overflow = ordered.length - visible.length

  return (
    <details class="diagnostics-list" open={counts.error > 0}>
      <summary>diagnostics ({summaryParts})</summary>
      <ul>
        {visible.map((d, i) => (
          <li key={i} class={`diagnostic-row diagnostic-row-${d.severity}`}>
            <span class="diagnostic-glyph">{SEVERITY_GLYPH[d.severity]}</span>
            <span class="diagnostic-sev">{d.severity}</span>
            {d.field && <span class="diagnostic-field">{d.field}</span>}
            <span class="diagnostic-message">{d.message}</span>
          </li>
        ))}
        {overflow > 0 && <li class="diagnostic-overflow">+{overflow} more</li>}
      </ul>
    </details>
  )
}
