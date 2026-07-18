import { describe, it, expect } from "vitest"
import { accountFromLogin } from "./account"

describe("accountFromLogin", () => {
  it("uses the first character of each segment for initials (max 2)", () => {
    expect(accountFromLogin("dorothea.tilney")).toEqual({
      handle: "dorothea.tilney",
      initials: "DT",
    })
  })

  it("splits on hyphens, dots, and underscores", () => {
    expect(accountFromLogin("a-b").initials).toBe("AB")
    expect(accountFromLogin("a_b").initials).toBe("AB")
    expect(accountFromLogin("a.b").initials).toBe("AB")
  })

  it("uppercases the initials", () => {
    expect(accountFromLogin("alice").initials).toBe("A")
  })

  it("caps initials at two characters", () => {
    expect(accountFromLogin("a.b.c.d").initials).toBe("AB")
  })

  it("falls back to '?' when login yields no segments", () => {
    expect(accountFromLogin("").initials).toBe("?")
    expect(accountFromLogin("...").initials).toBe("?")
  })

  it("preserves the raw login as handle", () => {
    expect(accountFromLogin("octocat").handle).toBe("octocat")
  })
})
