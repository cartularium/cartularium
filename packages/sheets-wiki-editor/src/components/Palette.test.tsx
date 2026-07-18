import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/preact"
import { Palette, type PaletteCommand } from "./Palette"

const mkCommands = (): PaletteCommand[] => [
  { id: "vim-on", label: "vim mode: on", run: vi.fn() },
  { id: "sign-out", label: "sign out", run: vi.fn() },
  { id: "go-drafts", label: "go to drafts", run: vi.fn() },
]

describe("Palette", () => {
  afterEach(() => cleanup())

  it("is closed initially (no input visible)", () => {
    render(<Palette commands={mkCommands()} />)
    expect(screen.queryByPlaceholderText(/command/i)).toBeNull()
  })

  it("opens on Cmd+Shift+P", () => {
    render(<Palette commands={mkCommands()} />)
    fireEvent.keyDown(document, { key: "P", metaKey: true, shiftKey: true })
    expect(screen.getByPlaceholderText(/command/i)).toBeInTheDocument()
  })

  it("opens on Ctrl+Shift+P (non-mac)", () => {
    render(<Palette commands={mkCommands()} />)
    fireEvent.keyDown(document, { key: "P", ctrlKey: true, shiftKey: true })
    expect(screen.getByPlaceholderText(/command/i)).toBeInTheDocument()
  })

  it("filters commands by label substring", () => {
    render(<Palette commands={mkCommands()} />)
    fireEvent.keyDown(document, { key: "P", metaKey: true, shiftKey: true })
    const input = screen.getByPlaceholderText(/command/i)
    fireEvent.input(input, { target: { value: "vim" } })
    expect(screen.getByText("vim mode: on")).toBeInTheDocument()
    expect(screen.queryByText("sign out")).toBeNull()
  })

  it("runs a command on click and closes", () => {
    const cmds = mkCommands()
    render(<Palette commands={cmds} />)
    fireEvent.keyDown(document, { key: "P", metaKey: true, shiftKey: true })
    fireEvent.click(screen.getByText("sign out"))
    expect(cmds[1]!.run).toHaveBeenCalled()
    expect(screen.queryByPlaceholderText(/command/i)).toBeNull()
  })

  it("closes on Escape", () => {
    render(<Palette commands={mkCommands()} />)
    fireEvent.keyDown(document, { key: "P", metaKey: true, shiftKey: true })
    expect(screen.getByPlaceholderText(/command/i)).toBeInTheDocument()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByPlaceholderText(/command/i)).toBeNull()
  })

  it("Enter runs the first matching command", () => {
    const cmds = mkCommands()
    render(<Palette commands={cmds} />)
    fireEvent.keyDown(document, { key: "P", metaKey: true, shiftKey: true })
    const input = screen.getByPlaceholderText(/command/i)
    fireEvent.input(input, { target: { value: "go" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(cmds[2]!.run).toHaveBeenCalled()
  })
})
