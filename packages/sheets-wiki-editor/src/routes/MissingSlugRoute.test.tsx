import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/preact"
import { ToastsProvider } from "../components/Toast"
import { MissingSlugRoute } from "./MissingSlugRoute"

const assignSpy = vi.fn()
Object.defineProperty(window, "location", {
  value: { assign: assignSpy, pathname: "/edit/Lookup" },
  writable: true,
})

describe("MissingSlugRoute", () => {
  afterEach(() => cleanup())

  it("shows the typed slug and a kind picker", () => {
    render(
      <ToastsProvider>
        <MissingSlugRoute slug="Lookup" userLogin="x" />
      </ToastsProvider>,
    )
    expect(screen.getByText(/Lookup/)).toBeTruthy()
    expect(screen.getByText("concept")).toBeTruthy()
  })

  it("shows closed-kind escape when the slug looks function-shaped", () => {
    render(
      <ToastsProvider>
        <MissingSlugRoute slug="MAGICSUM" userLogin="x" />
      </ToastsProvider>,
    )
    expect(screen.getByText(/looks like a function name/i)).toBeTruthy()
  })

  it("does not show closed-kind escape for normal slugs", () => {
    render(
      <ToastsProvider>
        <MissingSlugRoute slug="Implicit-Volatility" userLogin="x" />
      </ToastsProvider>,
    )
    expect(screen.queryByText(/looks like a function name/i)).toBeNull()
  })

  it("navigates to /edit/<kind>/<slug> on create click", () => {
    assignSpy.mockClear()
    render(
      <ToastsProvider>
        <MissingSlugRoute slug="My-Page" userLogin="x" />
      </ToastsProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: /create/i }))
    expect(assignSpy).toHaveBeenCalledWith("/edit/concept/My-Page")
  })
})
