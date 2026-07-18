import type {
  AssayPreviewDiagnostic,
  AssayPreviewPlatformInspection,
} from "@cartularium/contracts"
import { DiagnosticsList } from "./DiagnosticsList"
import { DiffSummary } from "./DiffSummary"
import { RawPayload } from "./RawPayload"
import { ResultGrid } from "./ResultGrid"

interface Props {
  platform: AssayPreviewPlatformInspection
  diagnostics: AssayPreviewDiagnostic[]
  fallbackFormula?: string
}

export function PerPlatformBody({ platform, diagnostics, fallbackFormula }: Props) {
  const formula = platform.formulaAsEvaluated ?? fallbackFormula

  return (
    <div class="per-platform-body">
      {formula && (
        <p class="formula-line">
          <span class="formula-line-label">
            formula{platform.formulaAsEvaluated ? " (as evaluated)" : ""}:
          </span>
          <code>{formula}</code>
        </p>
      )}

      {(platform.expected || platform.result) && (
        <div class="grid-pair">
          {platform.expected && (
            <div class="grid-pair-cell">
              <span class="grid-label">expected</span>
              <div class="result-grid-wrap">
                <ResultGrid grid={platform.expected} />
              </div>
            </div>
          )}
          {platform.result && (
            <div class="grid-pair-cell">
              <span class="grid-label">actual</span>
              <div class="result-grid-wrap">
                <ResultGrid grid={platform.result} compareWith={platform.expected} />
              </div>
            </div>
          )}
        </div>
      )}

      <DiffSummary diff={platform.diff} />

      {platform.error && (
        <p class="platform-error">
          <span class="platform-error-glyph">!</span>
          <code>{platform.error}</code>
        </p>
      )}

      <DiagnosticsList diagnostics={diagnostics} filterPlatform={platform.platform} />

      <RawPayload payload={platform} label={`raw payload (${platform.platform})`} />
    </div>
  )
}
