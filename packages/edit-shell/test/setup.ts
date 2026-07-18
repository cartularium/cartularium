// Global setup for vitest (Node-side, runs in the test runner process).
//
// Why this lives in `globalSetup` and not `setupFiles`:
//   `setupFiles` execute inside the workerd isolate where each test runs.
//   `msw/node` depends on Node's `http`/`https` internals (e.g. `_http_common`'s
//   `HTTPParser`), which workerd's nodejs_compat does not expose. Importing
//   `msw/node` from a setup file therefore crashes with:
//     SyntaxError: The requested module '_http_common' does not provide
//                  an export named 'HTTPParser'
//   So we run the msw lifecycle on the Node side instead, where `msw/node`
//   is happy.
//
// Caveat for future tasks:
//   msw/node intercepts Node's `http`/`https`/global `fetch`. It cannot
//   intercept fetches issued from inside the Worker — those go out via
//   workerd's runtime, not Node. If a test needs to mock a fetch the Worker
//   makes (e.g. to GitHub), use `fetchMock` from `cloudflare:test` instead.
//   Tests that drive Node-side code can still register handlers on `server`
//   below.
import { setupServer } from "msw/node"

const server = setupServer()

export async function setup() {
  // We can't use `onUnhandledRequest: "error"` here because miniflare and
  // vitest-pool-workers issue loopback HTTP requests (workerd <-> Node IPC,
  // module fetcher, etc.) that pass through Node's http stack and would be
  // intercepted by msw. A custom callback lets the harness's localhost
  // traffic bypass while still erroring on unmocked external requests.
  server.listen({
    onUnhandledRequest(request, print) {
      const url = new URL(request.url)
      const host = url.hostname
      const isLoopback =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "[::1]" ||
        host === "::1"
      if (isLoopback) return
      print.error()
    },
  })
}

export async function teardown() {
  server.close()
}

export { server }
