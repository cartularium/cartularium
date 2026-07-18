import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/preact"
import { SubmitModal } from "./SubmitModal"

vi.mock("../lib/edit-shell", () => ({
  editShell: { submitDraft: vi.fn() },
}))

const draft = {
  branch: "draft/x/SUMIF",
  slug: "SUMIF",
  commit_sha: "abc",
  updated_at: "2026-05-03T00:00:00Z",
  files: [
    { path: "packages/sheets-wiki/content/function/SUMIF.md", added: 15, removed: 4 },
  ],
  added: 15,
  removed: 4,
}

describe("SubmitModal", () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it("renders draft files, default title, and a submit button", () => {
    render(<SubmitModal draft={draft} onClose={() => {}} onSuccess={() => {}} pushToast={() => {}} lockedFieldChanges={[]} />)
    expect(screen.getByText("SUMIF.md")).toBeTruthy()
    expect(screen.getByRole("button", { name: /submit 1 file/i })).toBeTruthy()
  })

  it("calls editShell.submitDraft on submit click", async () => {
    const { editShell } = await import("../lib/edit-shell")
    ;(editShell.submitDraft as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, number: 7, url: "https://github.com/x/y/pull/7", mergeable: true,
    })
    const onSuccess = vi.fn()
    render(<SubmitModal draft={draft} onClose={() => {}} onSuccess={onSuccess} pushToast={() => {}} lockedFieldChanges={[]} />)
    const titleInput = screen.getByLabelText(/title/i)
    fireEvent.input(titleInput, { target: { value: "fix typo" } })
    fireEvent.click(screen.getByRole("button", { name: /submit/i }))
    await waitFor(() => {
      expect(editShell.submitDraft).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ number: 7 }))
    })
  })

  it("shows conflict UI with GitHub PR link on 409", async () => {
    const { editShell } = await import("../lib/edit-shell")
    ;(editShell.submitDraft as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false, kind: "conflict", prUrl: "https://github.com/x/y/pull/8", prNumber: 8, message: "...",
    })
    render(<SubmitModal draft={draft} onClose={() => {}} onSuccess={() => {}} pushToast={() => {}} lockedFieldChanges={[]} />)
    fireEvent.input(screen.getByLabelText(/title/i), { target: { value: "fix" } })
    fireEvent.click(screen.getByRole("button", { name: /submit/i }))
    await waitFor(() => {
      expect(screen.getByText(/conflicts with main/i)).toBeTruthy()
      const link = screen.getByRole("link", { name: /github web ui/i }) as HTMLAnchorElement
      expect(link.href).toBe("https://github.com/x/y/pull/8")
    })
  })

  it("warns when locked fields have changed", () => {
    render(<SubmitModal draft={draft} onClose={() => {}} onSuccess={() => {}} pushToast={() => {}} lockedFieldChanges={["category"]} />)
    expect(screen.getByText(/you changed/i)).toBeTruthy()
    expect(screen.getByText("category")).toBeTruthy()
  })

  it("exposes dialog role with labelled heading", () => {
    render(<SubmitModal draft={draft} onClose={() => {}} onSuccess={() => {}} pushToast={() => {}} lockedFieldChanges={[]} />)
    const dialog = screen.getByRole("dialog")
    expect(dialog.getAttribute("aria-modal")).toBe("true")
    const labelledBy = dialog.getAttribute("aria-labelledby")
    expect(labelledBy).toBeTruthy()
    const heading = document.getElementById(labelledBy!)
    expect(heading?.textContent).toMatch(/submit your changes/i)
  })

  it("closes on Escape", () => {
    const onClose = vi.fn()
    render(<SubmitModal draft={draft} onClose={onClose} onSuccess={() => {}} pushToast={() => {}} lockedFieldChanges={[]} />)
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })

  it("traps Tab within the modal (shift+tab from first wraps to last)", () => {
    render(<SubmitModal draft={draft} onClose={() => {}} onSuccess={() => {}} pushToast={() => {}} lockedFieldChanges={[]} />)
    const dialog = screen.getByRole("dialog")
    const focusables = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    )
    const first = focusables[0]!
    const last = focusables[focusables.length - 1]!
    first.focus()
    expect(document.activeElement).toBe(first)
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true })
    expect(document.activeElement).toBe(last)
    fireEvent.keyDown(document, { key: "Tab" })
    expect(document.activeElement).toBe(first)
  })

  it("restores focus to previously focused element on unmount", () => {
    const trigger = document.createElement("button")
    trigger.textContent = "open"
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)
    const { unmount } = render(<SubmitModal draft={draft} onClose={() => {}} onSuccess={() => {}} pushToast={() => {}} lockedFieldChanges={[]} />)
    unmount()
    expect(document.activeElement).toBe(trigger)
    document.body.removeChild(trigger)
  })
})
