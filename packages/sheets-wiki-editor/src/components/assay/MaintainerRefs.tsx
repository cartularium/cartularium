import type { AssayPreviewResult, AssayReviewReferences } from "../../lib/edit-shell"

interface Props {
  references: AssayReviewReferences
  latestResult: AssayPreviewResult | null
}

interface Row {
  label: string
  value: string
}

export function MaintainerRefs({ references, latestResult }: Props) {
  const rows: Row[] = []
  rows.push({ label: "submitted D1", value: references.submittedCase.d1Id })
  rows.push({ label: "submitted R2", value: references.submittedCase.r2Key })
  if (references.previewJob) {
    rows.push({ label: "preview-job D1", value: references.previewJob.d1Id })
    rows.push({ label: "preview-job R2", value: references.previewJob.inputR2Key })
  }
  if (references.acceptedResult) {
    rows.push({ label: "accepted D1", value: references.acceptedResult.d1Id })
    rows.push({ label: "accepted R2", value: references.acceptedResult.r2Key })
  }
  rows.push({ label: "candidate hash", value: references.caseHash })
  if (latestResult?.resultR2Key) {
    rows.push({ label: "result R2", value: latestResult.resultR2Key })
  }

  return (
    <details class="maintainer-refs">
      <summary>maintainer references</summary>
      <dl>
        {rows.map((row, i) => (
          <div key={i} class="maintainer-ref-row">
            <dt>{row.label}</dt>
            <dd>
              <code>{row.value}</code>
              <button
                type="button"
                class="maintainer-ref-copy"
                onClick={() => void navigator.clipboard.writeText(row.value)}
              >
                copy
              </button>
            </dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
