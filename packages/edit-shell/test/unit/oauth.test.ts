import { describe, expect, it } from "vitest"
import { githubHandlers } from "../fixtures/github-handlers"
import { exchangeCodeForUserToken, fetchAuthenticatedUser } from "../../src/auth/oauth"

describe("oauth", () => {
  it("exchanges code → user token", async () => {
    githubHandlers.exchangeCodeOk()
    const result = await exchangeCodeForUserToken({
      clientId: "Iv1.test",
      clientSecret: "secret",
      code: "any-code",
    })
    expect(result).toEqual({
      access_token: "ghu_test_user_token",
      expires_in: 28800,
      refresh_token: "ghr_test_refresh",
    })
  })

  it("throws on bad_verification_code", async () => {
    githubHandlers.exchangeCodeBadCode()
    await expect(
      exchangeCodeForUserToken({
        clientId: "Iv1.test",
        clientSecret: "secret",
        code: "bad",
      }),
    ).rejects.toThrow(/bad_verification_code/)
  })

  it("fetches authenticated user", async () => {
    githubHandlers.getAuthenticatedUser("alice", 1)
    const u = await fetchAuthenticatedUser("ghu_x")
    expect(u).toEqual({ login: "alice", id: 1 })
  })
})
