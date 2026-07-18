import { describe, expect, it } from "vitest"
import { contentAddressedName } from "../../src/util/asset-name"

describe("contentAddressedName", () => {
  it("emits sha256 prefix + sanitized original name", async () => {
    const buf = new TextEncoder().encode("hello").buffer as ArrayBuffer
    const name = await contentAddressedName("My Photo!.PNG", buf)
    expect(name).toMatch(/^[a-f0-9]{12}\/my-photo-\.png$/)
  })

  it("strips path components", async () => {
    const buf = new TextEncoder().encode("x").buffer as ArrayBuffer
    const name = await contentAddressedName("../etc/passwd", buf)
    expect(name).not.toContain("..")
    expect(name).not.toContain("/etc")
  })
})
