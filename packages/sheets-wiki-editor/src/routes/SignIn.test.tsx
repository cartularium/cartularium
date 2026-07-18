import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/preact"
import { SignIn } from "./SignIn"

describe("SignIn", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the prompt copy and a sign-in button", () => {
    render(<SignIn returnPath="/edit/SUMIF" />)
    expect(screen.getByText(/sign in with github/i)).toBeInTheDocument()
    expect(screen.getByText(/attribute/i)).toBeInTheDocument()
  })

  it("on button click, navigates to /api/edit/auth/login with returnPath", () => {
    const assignSpy = vi.fn()
    Object.defineProperty(window, "location", {
      value: { ...window.location, assign: assignSpy },
      writable: true,
    })

    render(<SignIn returnPath="/edit/SUMIF" />)
    fireEvent.click(screen.getByRole("button", { name: /sign in with github/i }))
    expect(assignSpy).toHaveBeenCalledWith(
      "/api/edit/auth/login?redirect=%2Fedit%2FSUMIF",
    )
  })
})
