import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act, cleanup, render, screen, fireEvent } from "@testing-library/preact"
import { ToastsProvider, ToastContainer } from "./Toast"
import { useToasts } from "../hooks/useToasts"

function Pusher() {
  const { pushToast } = useToasts()
  return (
    <button
      type="button"
      onClick={() =>
        pushToast({ kind: "info", message: "hello", autoDismissMs: 5000 })
      }
    >
      push
    </button>
  )
}

function PusherPersistent() {
  const { pushToast } = useToasts()
  return (
    <button
      type="button"
      onClick={() =>
        pushToast({ kind: "error", message: "stuck", persistent: true })
      }
    >
      stick
    </button>
  )
}

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it("renders pushed toasts and auto-dismisses after timeout", async () => {
    render(
      <ToastsProvider>
        <Pusher />
        <ToastContainer />
      </ToastsProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: "push" }))
    expect(screen.getByText("hello")).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(5500)
    })
    expect(screen.queryByText("hello")).toBeNull()
  })

  it("persistent toasts do not auto-dismiss", async () => {
    render(
      <ToastsProvider>
        <PusherPersistent />
        <ToastContainer />
      </ToastsProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: "stick" }))
    expect(screen.getByText("stuck")).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByText("stuck")).toBeInTheDocument()
  })

  it("dismiss button removes a toast immediately", () => {
    render(
      <ToastsProvider>
        <PusherPersistent />
        <ToastContainer />
      </ToastsProvider>,
    )
    fireEvent.click(screen.getByRole("button", { name: "stick" }))
    expect(screen.getByText("stuck")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }))
    expect(screen.queryByText("stuck")).toBeNull()
  })
})
