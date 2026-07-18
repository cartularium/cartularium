import type { AssayPreviewOverall } from "@cartularium/contracts"

interface Props {
  verdict: AssayPreviewOverall
  passed: number
  total: number
}

const VERDICT_WORD: Record<AssayPreviewOverall, string> = {
  pass: "PASS",
  fail: "FAIL",
  error: "ERROR",
  incomplete: "INCOMPLETE",
  observed: "OBSERVED",
}

export function VerdictBadge({ verdict, passed, total }: Props) {
  return (
    <div class={`verdict-badge verdict-${verdict}`}>
      <strong class="verdict-word">{VERDICT_WORD[verdict]}</strong>
      <span class="verdict-counts">{passed}/{total} plat</span>
    </div>
  )
}
