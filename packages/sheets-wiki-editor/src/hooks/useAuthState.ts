import { useEffect, useState } from "preact/hooks"
import { editShell, AuthRequiredError, type MeResponse } from "../lib/edit-shell"

export type AuthState =
  | { status: "loading" }
  | { status: "unauth" }
  | { status: "authed"; user: MeResponse }
  | { status: "error"; error: Error }

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    editShell
      .getMe()
      .then((user) => {
        if (!cancelled) setState({ status: "authed", user })
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof AuthRequiredError) {
          setState({ status: "unauth" })
        } else {
          setState({
            status: "error",
            error: err instanceof Error ? err : new Error(String(err)),
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
