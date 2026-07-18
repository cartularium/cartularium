import { describe, it, expect, vi, afterEach } from "vitest"
import { render, cleanup, act } from "@testing-library/preact"
import { Editor, type InnerEditorHandle } from "./Editor"

describe("Editor", () => {
  afterEach(() => cleanup())

  it("renders the initial content", () => {
    const { container } = render(
      <Editor
        initialContent="# Hello\n\nWorld"
        baseContent="# Hello\n\nWorld"
        wikilinkEntries={[]}
        imageUploader={async () => ({ url: "x" })}
        onImageError={() => {}}
        onChange={() => {}}
        onReady={() => {}}
      />,
    )
    expect(container.textContent).toContain("Hello")
    expect(container.textContent).toContain("World")
  })

  it("calls onReady once with a handle exposing setVimMode + focus", () => {
    let handle: InnerEditorHandle | null = null
    render(
      <Editor
        initialContent="initial"
        baseContent="initial"
        wikilinkEntries={[]}
        imageUploader={async () => ({ url: "x" })}
        onImageError={() => {}}
        onChange={() => {}}
        onReady={(h) => {
          handle = h
        }}
      />,
    )
    expect(handle).not.toBeNull()
    expect(typeof handle!.setVimMode).toBe("function")
    expect(typeof handle!.focus).toBe("function")
  })

  it("calls onChange when content is dispatched programmatically via the handle", async () => {
    const onChange = vi.fn()
    let handle: InnerEditorHandle | null = null
    render(
      <Editor
        initialContent="initial"
        baseContent="initial"
        wikilinkEntries={[]}
        imageUploader={async () => ({ url: "x" })}
        onImageError={() => {}}
        onChange={onChange}
        onReady={(h) => {
          handle = h
        }}
      />,
    )
    expect(handle).not.toBeNull()
    await act(async () => {
      handle!.dispatch({
        changes: { from: 0, to: handle!.docLength, insert: "different content" },
      })
    })
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls[onChange.mock.calls.length - 1]![0]).toBe(
      "different content",
    )
  })
})
