import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/preact"
import { useAuthState } from "./useAuthState"
import { editShell, AuthRequiredError } from "../lib/edit-shell"

function Probe() {
  const auth = useAuthState()
  return (
    <div>
      <div data-testid="status">{auth.status}</div>
      {auth.status === "authed" && (
        <div data-testid="login">{auth.user.login}</div>
      )}
      {auth.status === "error" && (
        <div data-testid="err">{auth.error.message}</div>
      )}
    </div>
  )
}

describe("useAuthState", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it("starts in 'loading' and transitions to 'authed' on success", async () => {
    vi.spyOn(editShell, "getMe").mockResolvedValueOnce({
      login: "alice",
      id: 7,
      fork_repo: "alice/cartularium",
    })

    render(<Probe />)
    expect(screen.getByTestId("status").textContent).toBe("loading")
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("authed")
    })
    expect(screen.getByTestId("login").textContent).toBe("alice")
  })

  it("transitions to 'unauth' on AuthRequiredError", async () => {
    vi.spyOn(editShell, "getMe").mockRejectedValueOnce(new AuthRequiredError())
    render(<Probe />)
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("unauth")
    })
  })

  it("transitions to 'error' on unexpected failure", async () => {
    vi.spyOn(editShell, "getMe").mockRejectedValueOnce(new Error("network down"))
    render(<Probe />)
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("error")
    })
    expect(screen.getByTestId("err").textContent).toMatch(/network down/)
  })
})
