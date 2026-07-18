import type { EditIndexKind } from "@cartularium/contracts"

// Source of truth for open-kind UI metadata. Typed as a Record over
// Exclude<EditIndexKind, "function"> so adding a new EditIndexKind to the
// contract forces a corresponding entry here (TS exhaustiveness check).
// OPEN_KINDS is derived from the keys, so the picker can never silently
// drop a kind the way it did when this list was hand-maintained.
const KIND_META: Record<Exclude<EditIndexKind, "function">, { label: string; why: string }> = {
  concept: { label: "concept", why: "a spreadsheet idea, jargon, or pattern" },
  guide: { label: "guide", why: "a walkthrough or how-to" },
  blog: { label: "blog", why: "an editorial post or position piece" },
  people: { label: "people", why: "a contributor bio" },
  about: { label: "about", why: "a cartularium-wide page" },
  project: { label: "project", why: "a cartularium-tracked project or initiative" },
  other: { label: "other", why: "if no kind quite fits" },
}

const OPEN_KINDS: { kind: Exclude<EditIndexKind, "function">; label: string; why: string }[] =
  (Object.keys(KIND_META) as Exclude<EditIndexKind, "function">[]).map((kind) => ({
    kind,
    label: KIND_META[kind].label,
    why: KIND_META[kind].why,
  }))

export function looksFunctionShaped(s: string): boolean {
  if (!s) return false
  if (s.length < 2) return false
  if (/\s/.test(s)) return false
  return s === s.toUpperCase() && /[A-Z]/.test(s)
}

interface Props {
  selected: EditIndexKind
  onSelect: (kind: EditIndexKind) => void
  closedKindEscape?: boolean
}

export function KindPicker({ selected, onSelect, closedKindEscape }: Props) {
  return (
    <div class="kind-picker">
      {closedKindEscape && (
        <div class="kind-picker-escape">
          <div class="eye">looks like a function name</div>
          <div class="text">
            Function pages aren't created from the editor — they derive from native engine primitives.
            If this is a real function in an engine cartularium covers,{" "}
            <a href="mailto:maintainers@sheets.wiki?subject=Request%20function%20page">
              request a function page →
            </a>
            {" "}or{" "}
            <a href="https://github.com/cartularium/cartularium/issues/new" target="_blank" rel="noreferrer">
              file an issue ↗
            </a>.
          </div>
        </div>
      )}
      <div class="kind-picker-eye">
        {closedKindEscape ? "or create a new non-function page" : "create as"}
      </div>
      <div class="kind-picker-grid">
        {OPEN_KINDS.map((opt) => (
          <button
            key={opt.kind}
            type="button"
            class={`kind-opt kind-opt-${opt.kind}${selected === opt.kind ? " kind-opt-selected" : ""}`}
            onClick={() => onSelect(opt.kind)}
          >
            <span class="kind-opt-marker">{opt.kind.slice(0, 2)}</span>
            <span class="kind-opt-label">
              <span class="kind-opt-name">{opt.label}</span>
              <span class="kind-opt-why">{opt.why}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
