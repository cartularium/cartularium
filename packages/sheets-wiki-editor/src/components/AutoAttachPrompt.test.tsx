import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/preact"
import {
  AutoAttachPrompt,
  AUTO_ATTACH_KEY_PREFIX,
  AUTO_ATTACH_NEW_DRAFT,
  readAutoAttachDecision,
} from "./AutoAttachPrompt"

const draft = {
  branch: "draft/x/round-fix",
  slug: "round-fix",
  commit_sha: "abc",
  updated_at: "2026-05-03T00:00:00Z",
  files: [],
  added: 0,
  removed: 0,
}

describe("AutoAttachPrompt", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  it("calls onAdd with the draft branch when 'add' clicked", () => {
    const onAdd = vi.fn()
    const onStartNew = vi.fn()
    render(<AutoAttachPrompt slug="SUMIF" mostRecent={draft} onAdd={onAdd} onStartNew={onStartNew} />)
    fireEvent.click(screen.getByRole("button", { name: /add to draft/i }))
    expect(onAdd).toHaveBeenCalledWith(draft.branch)
    expect(localStorage.getItem(`${AUTO_ATTACH_KEY_PREFIX}SUMIF`)).toBe(draft.branch)
  })

  it("calls onStartNew when 'start new' clicked", () => {
    const onAdd = vi.fn()
    const onStartNew = vi.fn()
    render(<AutoAttachPrompt slug="SUMIF" mostRecent={draft} onAdd={onAdd} onStartNew={onStartNew} />)
    fireEvent.click(screen.getByRole("button", { name: /start new draft/i }))
    expect(onStartNew).toHaveBeenCalled()
    expect(localStorage.getItem(`${AUTO_ATTACH_KEY_PREFIX}SUMIF`)).toBe(AUTO_ATTACH_NEW_DRAFT)
  })
})

describe("readAutoAttachDecision", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  it("returns { kind: 'none' } when no key is set", () => {
    expect(readAutoAttachDecision("SUMIF")).toEqual({ kind: "none" })
  })

  it("returns { kind: 'branch', branch } after handleAdd persists the branch", () => {
    const onAdd = vi.fn()
    const onStartNew = vi.fn()
    render(<AutoAttachPrompt slug="SUMIF" mostRecent={draft} onAdd={onAdd} onStartNew={onStartNew} />)
    fireEvent.click(screen.getByRole("button", { name: /add to draft/i }))
    expect(readAutoAttachDecision("SUMIF")).toEqual({ kind: "branch", branch: draft.branch })
  })

  it("returns { kind: 'new' } after handleNew persists the sentinel", () => {
    const onAdd = vi.fn()
    const onStartNew = vi.fn()
    render(<AutoAttachPrompt slug="SUMIF" mostRecent={draft} onAdd={onAdd} onStartNew={onStartNew} />)
    fireEvent.click(screen.getByRole("button", { name: /start new draft/i }))
    expect(readAutoAttachDecision("SUMIF")).toEqual({ kind: "new" })
  })
})
