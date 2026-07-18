// Workerd-side setup. Runs inside the workerd isolate per test file.
//
// `fetchMock` from `cloudflare:test` is undici's MockAgent under the hood —
// it intercepts global `fetch` calls made inside the Worker (the only way
// to mock outbound HTTP at this layer; msw/node can't reach into workerd).
import { fetchMock } from "cloudflare:test"
import { afterEach, beforeAll } from "vitest"

beforeAll(() => {
  fetchMock.activate()
  fetchMock.disableNetConnect()
})

afterEach(() => {
  // Every test must consume every interceptor it registered.
  fetchMock.assertNoPendingInterceptors()
})
