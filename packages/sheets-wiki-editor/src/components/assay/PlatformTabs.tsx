import type {
  AssayPreviewPlatformInspection,
  AssayPreviewPlatformVerdict,
} from "@cartularium/contracts"

interface Props {
  platforms: AssayPreviewPlatformInspection[]
  active: string
  onChange: (platform: string) => void
}

const VERDICT_GLYPH: Record<AssayPreviewPlatformVerdict, string> = {
  passed: "✓",
  failed: "✗",
  errored: "!",
  skipped: "—",
  missing: "?",
  observed: "◷",
}

export function PlatformTabs({ platforms, active, onChange }: Props) {
  return (
    <div class="platform-tabs" role="group" aria-label="platform">
      {platforms.map((p) => {
        const disabled = p.verdict === "missing"
        const classes = [
          "platform-tab",
          `platform-tab-${p.verdict}`,
          p.platform === active ? "active" : "",
        ]
          .filter(Boolean)
          .join(" ")
        return (
          <button
            key={p.platform}
            type="button"
            class={classes}
            aria-pressed={p.platform === active}
            disabled={disabled}
            onClick={() => {
              if (!disabled) onChange(p.platform)
            }}
          >
            <span class={`eng-mini eng-${p.platform}`}>{p.platform}</span>
            <span class={`platform-glyph verdict-glyph-${p.verdict}`}>
              {VERDICT_GLYPH[p.verdict]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
