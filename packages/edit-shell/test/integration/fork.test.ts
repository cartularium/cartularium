import { describe, expect, it } from "vitest"
import { githubHandlers } from "../fixtures/github-handlers"
import { findOrCreateFork } from "../../src/github/fork"

describe("findOrCreateFork", () => {
  it("returns existing fork without creating", async () => {
    githubHandlers.getRepoForkExists("alice")
    const result = await findOrCreateFork({
      token: "ghu_x",
      forkOwner: "alice",
      canonical: { owner: "cartularium", repo: "cartularium" },
    })
    expect(result).toEqual({ full_name: "alice/cartularium", existed: true })
  })

  it("creates fork when not present", async () => {
    githubHandlers.getRepoNotFound("alice")
    githubHandlers.createFork("alice")
    const result = await findOrCreateFork({
      token: "ghu_x",
      forkOwner: "alice",
      canonical: { owner: "cartularium", repo: "cartularium" },
    })
    expect(result).toEqual({ full_name: "alice/cartularium", existed: false })
  })
})
