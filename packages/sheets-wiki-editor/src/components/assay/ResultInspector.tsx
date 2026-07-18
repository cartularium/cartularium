import { useEffect, useMemo, useState } from "preact/hooks"
import type {
  AssayPreviewDiagnostic,
  AssayPreviewInspection,
  AssayPreviewResultPayload,
} from "@cartularium/contracts"
import { ComparisonBody } from "./ComparisonBody"
import { PerPlatformBody } from "./PerPlatformBody"
import { PlatformTabs } from "./PlatformTabs"
import { RawPayload } from "./RawPayload"
import { VerdictBadge } from "./VerdictBadge"

interface Props {
  inspection: AssayPreviewInspection
  rawPayload: AssayPreviewResultPayload
  rawDiagnostics: AssayPreviewDiagnostic[]
  fallbackFormula?: string
}

type View = "per-platform" | "comparison"

export function ResultInspector(props: Props) {
  if (!props.inspection.contractSupported) {
    return (
      <section class="result-inspector result-inspector-unsupported">
        <div class="verdict-strip verdict-error">
          <VerdictBadge verdict="error" passed={0} total={0} />
          <p class="verdict-strip-meta">
            contract v{props.inspection.contractVersion} unsupported by this UI
          </p>
        </div>
        <RawPayload payload={props.rawPayload} defaultOpen />
      </section>
    )
  }
  return <ResultInspectorSupported {...props} />
}

type SupportedProps = Omit<Props, "rawPayload">

function ResultInspectorSupported({
  inspection,
  rawDiagnostics,
  fallbackFormula,
}: SupportedProps) {
  const platformsWithData = inspection.platforms.filter((p) => p.result || p.expected)
  const initialPlatform =
    platformsWithData[0]?.platform ?? inspection.platforms[0]?.platform ?? null
  const [activePlatform, setActivePlatform] = useState<string | null>(initialPlatform)
  const [view, setView] = useState<View>("per-platform")

  useEffect(() => {
    if (!inspection.platforms.some((p) => p.platform === activePlatform)) {
      setActivePlatform(initialPlatform)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspection.jobId])

  const canCompare = platformsWithData.length >= 2
  const active = useMemo(
    () =>
      inspection.platforms.find((p) => p.platform === activePlatform) ??
      inspection.platforms[0],
    [inspection.platforms, activePlatform],
  )

  return (
    <section class="result-inspector">
      <div class={`verdict-strip verdict-${inspection.overall}`}>
        <VerdictBadge
          verdict={inspection.overall}
          passed={inspection.totals.passed}
          total={inspection.totals.platforms}
        />
        <div class="verdict-strip-meta">
          <span>runner {inspection.runnerId}</span>
          <span>candidate {inspection.candidateHash.slice(0, 8)}…</span>
        </div>
        <span class="verdict-strip-totals">
          {inspection.totals.platforms} platforms · {inspection.totals.passed} passed
          {inspection.totals.failed > 0 ? ` · ${inspection.totals.failed} failed` : ""}
          {inspection.totals.errored > 0 ? ` · ${inspection.totals.errored} errored` : ""}
          {inspection.totals.skipped > 0 ? ` · ${inspection.totals.skipped} skipped` : ""}
        </span>
      </div>

      <div class="inspector-toolbar">
        <div class="inspector-view-toggle" role="group" aria-label="inspector view">
          <button
            type="button"
            aria-pressed={view === "per-platform"}
            class={view === "per-platform" ? "active" : ""}
            onClick={() => setView("per-platform")}
          >
            per-platform
          </button>
          <button
            type="button"
            aria-pressed={view === "comparison"}
            class={view === "comparison" ? "active" : ""}
            disabled={!canCompare}
            onClick={() => canCompare && setView("comparison")}
          >
            comparison
          </button>
        </div>
      </div>

      {view === "per-platform" && active && (
        <>
          <PlatformTabs
            platforms={inspection.platforms}
            active={active.platform}
            onChange={setActivePlatform}
          />
          <PerPlatformBody
            platform={active}
            diagnostics={rawDiagnostics}
            fallbackFormula={fallbackFormula}
          />
        </>
      )}

      {view === "comparison" && <ComparisonBody platforms={inspection.platforms} />}
    </section>
  )
}
