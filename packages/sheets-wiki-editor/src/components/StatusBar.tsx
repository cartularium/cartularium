export type StatusState = "idle" | "saving" | "saved" | "save-failed"

interface StatusBarProps {
  state: StatusState
  onRetry?: () => void
}

export function StatusBar({ state, onRetry }: StatusBarProps) {
  return (
    <div class={`status-bar status-${state}`} aria-live="polite">
      {state === "saving" && <span class="status-msg">saving…</span>}
      {state === "saved" && <span class="status-msg">saved ✓</span>}
      {state === "save-failed" && (
        <>
          <span class="status-msg">save failed</span>
          <button type="button" class="status-action" onClick={onRetry}>
            retry
          </button>
        </>
      )}
    </div>
  )
}
