import { describe, it, expect, afterEach, vi } from "vitest"
import { render, screen, cleanup } from "@testing-library/preact"
import { Chrome } from "./Chrome"

afterEach(cleanup)

describe("Chrome", () => {
  it("renders chrome topbar with editor data (account + submit slots present)", () => {
    render(
      <Chrome account={{ handle: "test.user", initials: "TU" }} hasChanges={false}>
        <p>body</p>
      </Chrome>,
    )
    expect(document.querySelector("[data-account-chip]")).not.toBeNull()
    expect(document.querySelector("[data-editor-submit]")).not.toBeNull()
    expect(screen.getByText("body")).toBeInTheDocument()
  })

  it("renders submit button as disabled when hasChanges is false", () => {
    render(
      <Chrome account={{ handle: "test.user", initials: "TU" }} hasChanges={false}>
        <p>body</p>
      </Chrome>,
    )
    const submit = document.querySelector("[data-editor-submit]") as HTMLButtonElement | null
    expect(submit).not.toBeNull()
    expect(submit?.hasAttribute("disabled")).toBe(true)
  })

  it("renders submit button as enabled when hasChanges is true", () => {
    render(
      <Chrome account={{ handle: "test.user", initials: "TU" }} hasChanges={true}>
        <p>body</p>
      </Chrome>,
    )
    const submit = document.querySelector("[data-editor-submit]") as HTMLButtonElement | null
    expect(submit).not.toBeNull()
    expect(submit?.hasAttribute("disabled")).toBe(false)
  })

  it("invokes onSubmitClick when [data-editor-submit] is clicked (and enabled)", () => {
    const onSubmitClick = vi.fn()
    render(
      <Chrome
        account={{ handle: "test.user", initials: "TU" }}
        hasChanges={true}
        onSubmitClick={onSubmitClick}
      >
        <p>body</p>
      </Chrome>,
    )
    const submit = document.querySelector("[data-editor-submit]") as HTMLButtonElement
    submit.click()
    expect(onSubmitClick).toHaveBeenCalledTimes(1)
  })

  it("does NOT invoke onSubmitClick when the submit button is disabled", () => {
    const onSubmitClick = vi.fn()
    render(
      <Chrome
        account={{ handle: "test.user", initials: "TU" }}
        hasChanges={false}
        onSubmitClick={onSubmitClick}
      >
        <p>body</p>
      </Chrome>,
    )
    const submit = document.querySelector("[data-editor-submit]") as HTMLButtonElement
    submit.click()
    expect(onSubmitClick).not.toHaveBeenCalled()
  })
})
