import type { ComponentChildren } from "preact"
import { useEffect, useMemo, useRef, useState } from "preact/hooks"
import { ToastsContext, useToasts, type Toast } from "../hooks/useToasts"

let toastIdCounter = 0

interface ProviderProps {
  children: ComponentChildren
}

export function ToastsProvider({ children }: ProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t))
      timers.current.clear()
    }
  }, [])

  const api = useMemo(
    () => ({
      toasts,
      pushToast(t: Omit<Toast, "id">): string {
        const id = `t${++toastIdCounter}`
        const next: Toast = { id, ...t }
        setToasts((cur) => [...cur, next])
        if (!next.persistent && next.autoDismissMs && next.autoDismissMs > 0) {
          const timer = setTimeout(() => {
            setToasts((cur) => cur.filter((x) => x.id !== id))
            timers.current.delete(id)
          }, next.autoDismissMs)
          timers.current.set(id, timer)
        }
        return id
      },
      dismissToast(id: string): void {
        const t = timers.current.get(id)
        if (t) {
          clearTimeout(t)
          timers.current.delete(id)
        }
        setToasts((cur) => cur.filter((x) => x.id !== id))
      },
    }),
    [toasts],
  )

  return <ToastsContext.Provider value={api}>{children}</ToastsContext.Provider>
}

export function ToastContainer() {
  const { toasts, dismissToast } = useToasts()
  return (
    <div class="toast-container" role="region" aria-label="notifications">
      {toasts.map((t) => (
        <div key={t.id} class={`toast toast-${t.kind}`}>
          <div class="toast-message">{t.message}</div>
          {t.detail && <div class="toast-detail">{t.detail}</div>}
          <button
            type="button"
            class="toast-dismiss"
            aria-label="dismiss"
            onClick={() => dismissToast(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
