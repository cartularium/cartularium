import { describe, it, expect, afterEach } from "vitest"
import { cleanup, render, screen } from "@testing-library/preact"
import { VerdictBadge } from "./VerdictBadge"

afterEach(cleanup)

describe("VerdictBadge", () => {
  it("renders uppercase verdict word", () => {
    render(<VerdictBadge verdict="pass" passed={2} total={2} />)
    expect(screen.getByText("PASS")).toBeTruthy()
  })

  it("shows passed-over-total counts", () => {
    render(<VerdictBadge verdict="fail" passed={1} total={3} />)
    expect(screen.getByText("1/3 plat")).toBeTruthy()
  })

  it("applies verdict-specific class", () => {
    const { container } = render(<VerdictBadge verdict="error" passed={0} total={2} />)
    expect(container.querySelector(".verdict-badge.verdict-error")).toBeTruthy()
  })
})
