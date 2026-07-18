import { createContext } from "preact"
import { useContext } from "preact/hooks"

export type ToastKind = "info" | "success" | "error"

export interface Toast {
  id: string
  kind: ToastKind
  message: string
  persistent?: boolean
  // optional extra context (e.g., request id) shown subordinate to message
  detail?: string
  // ms; ignored if persistent
  autoDismissMs?: number
}

export interface ToastsApi {
  toasts: readonly Toast[]
  pushToast(toast: Omit<Toast, "id">): string
  dismissToast(id: string): void
}

export const ToastsContext = createContext<ToastsApi | undefined>(undefined)

export function useToasts(): ToastsApi {
  const ctx = useContext(ToastsContext)
  if (!ctx) {
    throw new Error("useToasts must be used inside <ToastsProvider>")
  }
  return ctx
}
