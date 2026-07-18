import { useCallback, useEffect, useRef, useState } from "preact/hooks"
import { editShell, AuthRequiredError, EditShellError } from "../lib/edit-shell"
import { useToasts } from "./useToasts"

const DEBOUNCE_MS = 500

export type AutosaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "save-failed"
  | "auth-required"

export interface UseAutosaveOptions {
  path: string
  content: string
  branch: string
}

export interface UseAutosaveResult {
  status: AutosaveStatus
  retry: () => void
  // cancel pending debounce, save now, resolve when settled.
  flush: () => Promise<void>
}

export function useAutosave(opts: UseAutosaveOptions): UseAutosaveResult {
  const [status, setStatus] = useState<AutosaveStatus>("idle")
  const lastSavedContent = useRef<string>(opts.content)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inflightVersion = useRef<number>(0)
  const inflightPromise = useRef<Promise<void> | null>(null)
  // latest opts for flush() called outside the effect closure.
  const optsRef = useRef(opts)
  optsRef.current = opts
  const { pushToast } = useToasts()

  const runSave = (content: string): Promise<void> => {
    const myVersion = ++inflightVersion.current
    setStatus("saving")
    const p = editShell
      .saveDraft(optsRef.current.path, content, { branch: optsRef.current.branch })
      .then(() => {
        if (myVersion !== inflightVersion.current) return
        lastSavedContent.current = content
        setStatus("saved")
      })
      .catch((err: unknown) => {
        if (myVersion !== inflightVersion.current) return
        if (err instanceof AuthRequiredError) {
          setStatus("auth-required")
          return
        }
        const requestId = err instanceof EditShellError ? err.requestId : undefined
        const detail =
          err instanceof Error ? err.message : "couldn't save draft."
        pushToast({
          kind: "error",
          message: "couldn't save draft. retry.",
          detail: requestId ? `ref: ${requestId}` : detail,
          persistent: true,
        })
        setStatus("save-failed")
      })
    inflightPromise.current = p
    return p
  }

  useEffect(() => {
    if (opts.content === lastSavedContent.current) return

    if (timerRef.current) clearTimeout(timerRef.current)
    // status flips to "saving" only on actual in-flight, not on each keystroke.
    timerRef.current = setTimeout(() => {
      runSave(opts.content)
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.content, opts.path, opts.branch])

  const retry = () => {
    if (status !== "save-failed") return
    runSave(optsRef.current.content)
  }

  // stable identity so callers can put flush in dep arrays.
  const flush = useCallback(async (): Promise<void> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      if (optsRef.current.content !== lastSavedContent.current) {
        await runSave(optsRef.current.content)
        return
      }
    }
    if (inflightPromise.current) {
      await inflightPromise.current
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { status, retry, flush }
}
