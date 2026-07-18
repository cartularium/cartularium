import { env, SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import { createSession } from "../../src/auth/session"

describe("rate limit", () => {
  it("returns 429 after 60 mutations within a minute", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    // Pre-seed the rate-limit counter to its limit so the next mutation trips.
    const minuteKey = `rl:${id}:${Math.floor(Date.now() / 60000)}`
    await env.RATE_LIMIT.put(minuteKey, "60", { expirationTtl: 120 })

    // Hit a mutating endpoint that requires session — assets is convenient.
    const fd = new FormData()
    fd.append("file", new File([new Uint8Array([1])], "x.png", { type: "image/png" }))
    const res = await SELF.fetch("https://sheets.wiki/api/edit/assets", {
      method: "POST",
      headers: { Cookie: `__cart_sess=${id}`, Origin: "https://sheets.wiki" },
      body: fd,
    })
    expect(res.status).toBe(429)
  })

  it("includes the previous minute bucket via sliding-window weighting", async () => {
    // Two-bucket weighting means the previous minute's count contributes,
    // weighted by the fraction of that minute that still falls inside the
    // trailing 60-second window. We can't control the worker's clock from
    // here (vi.setSystemTime doesn't reach miniflare), so seed both buckets
    // such that the weighted sum exceeds the limit no matter when in the
    // current minute the request lands.
    //
    // Seed currentMinute = LIMIT (60) and previousMinute = a large value.
    // weighted = 60 + previous*weight ≥ 60 → always trips. This proves the
    // implementation actually *reads* both buckets (the previous fixed-window
    // implementation would only see currentMinute).
    //
    // To distinguish from a pure current-bucket trip, also seed currentMinute
    // to LIMIT-1 (59). With the old fixed-window code, current=59 < LIMIT so
    // the request would pass. With sliding-window, current=59 + previous*weight
    // ≥ 60 whenever previous*weight ≥ 1 — i.e. previous ≥ 60 robustly trips
    // unless we're in the absolute last second of the minute. To eliminate the
    // last-second flake, seed previous=600: 59 + 600*weight ≥ 60 requires
    // weight ≥ 1/600 ≈ 0.00167, i.e. secondsIntoMinute ≤ 59.9 — flake window
    // is now 0.1s out of 60s.
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const currentMinute = Math.floor(Date.now() / 60000)
    await env.RATE_LIMIT.put(`rl:${id}:${currentMinute}`, "59", { expirationTtl: 120 })
    await env.RATE_LIMIT.put(`rl:${id}:${currentMinute - 1}`, "600", {
      expirationTtl: 120,
    })

    const fd = new FormData()
    fd.append("file", new File([new Uint8Array([1])], "x.png", { type: "image/png" }))
    const res = await SELF.fetch("https://sheets.wiki/api/edit/assets", {
      method: "POST",
      headers: { Cookie: `__cart_sess=${id}`, Origin: "https://sheets.wiki" },
      body: fd,
    })
    expect(res.status).toBe(429)
  })
})
