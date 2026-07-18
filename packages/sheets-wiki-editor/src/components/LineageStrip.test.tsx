import { describe, it, expect, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/preact"
import { LineageStrip } from "./LineageStrip"

describe("LineageStrip", () => {
  afterEach(() => cleanup())

  it("renders the file name", () => {
    render(<LineageStrip filename="SUMIF.md" modified={false} />)
    expect(screen.getByText("SUMIF.md")).toBeInTheDocument()
  })

  it("does NOT render '(modified)' when modified is false", () => {
    render(<LineageStrip filename="SUMIF.md" modified={false} />)
    expect(screen.queryByText(/modified/i)).toBeNull()
  })

  it("renders '(modified)' when modified is true", () => {
    render(<LineageStrip filename="SUMIF.md" modified={true} />)
    expect(screen.getByText(/modified/i)).toBeInTheDocument()
  })
})
