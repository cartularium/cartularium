import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act, render, screen, cleanup } from "@testing-library/preact"
import { useAutosave } from "./useAutosave"
import { editShell, AuthRequiredError } from "../lib/edit-shell"
import { ToastsProvider } from "../components/Toast"

interface ProbeProps {
  path: string
  content: string
  branch: string
}

function Probe({ path, content, branch }: ProbeProps) {
  const { status } = useAutosave({ path, content, branch })
  return <div data-testid="status">{status}</div>
}

describe("useAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it("starts in 'idle' and stays idle when content is unchanged from initial", async () => {
    vi.spyOn(editShell, "saveDraft").mockResolvedValue({
      branch: "draft/u/p",
      commit_sha: "x",
      content_sha: "y",
    } as any)
    render(
      <ToastsProvider>
        <Probe path="content/p.md" content="initial" branch="draft/u/p" />
      </ToastsProvider>,
    )
    expect(screen.getByTestId("status").textContent).toBe("idle")
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(editShell.saveDraft).not.toHaveBeenCalled()
  })

  it("debounces and saves after 500ms when content changes", async () => {
    vi.spyOn(editShell, "saveDraft").mockResolvedValue({
      branch: "draft/u/p",
      commit_sha: "y",
      content_sha: "z",
    } as any)
    const { rerender } = render(
      <ToastsProvider>
        <Probe path="content/p.md" content="v1" branch="draft/u/p" />
      </ToastsProvider>,
    )
    rerender(
      <ToastsProvider>
        <Probe path="content/p.md" content="v2" branch="draft/u/p" />
      </ToastsProvider>,
    )
    expect(screen.getByTestId("status").textContent).toBe("idle")

    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(editShell.saveDraft).toHaveBeenCalledWith(
      "content/p.md",
      "v2",
      { branch: "draft/u/p" },
    )
    expect(screen.getByTestId("status").textContent).toBe("saved")
  })

  it("transitions to 'save-failed' on EditShellError (non-auth)", async () => {
    vi.spyOn(editShell, "saveDraft").mockRejectedValue(new Error("network down"))
    const { rerender } = render(
      <ToastsProvider>
        <Probe path="content/p.md" content="v1" branch="draft/u/p" />
      </ToastsProvider>,
    )
    rerender(
      <ToastsProvider>
        <Probe path="content/p.md" content="v2" branch="draft/u/p" />
      </ToastsProvider>,
    )

    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.getByTestId("status").textContent).toBe("save-failed")
  })

  it("transitions to 'auth-required' on AuthRequiredError (caller handles re-auth)", async () => {
    vi.spyOn(editShell, "saveDraft").mockRejectedValue(new AuthRequiredError())
    const { rerender } = render(
      <ToastsProvider>
        <Probe path="content/p.md" content="v1" branch="draft/u/p" />
      </ToastsProvider>,
    )
    rerender(
      <ToastsProvider>
        <Probe path="content/p.md" content="v2" branch="draft/u/p" />
      </ToastsProvider>,
    )

    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.getByTestId("status").textContent).toBe("auth-required")
  })
})
