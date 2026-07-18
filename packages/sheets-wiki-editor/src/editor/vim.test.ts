import { describe, it, expect, beforeEach } from "vitest"
import { readVimPreference, writeVimPreference, VIM_STORAGE_KEY } from "./vim"

describe("vim preference storage", () => {
  beforeEach(() => {
    localStorage.removeItem(VIM_STORAGE_KEY)
  })

  it("returns false when no preference is stored", () => {
    expect(readVimPreference()).toBe(false)
  })

  it("returns true after writeVimPreference(true)", () => {
    writeVimPreference(true)
    expect(readVimPreference()).toBe(true)
    expect(localStorage.getItem(VIM_STORAGE_KEY)).toBe("on")
  })

  it("returns false after writeVimPreference(false), and clears the stored key", () => {
    writeVimPreference(true)
    writeVimPreference(false)
    expect(readVimPreference()).toBe(false)
    expect(localStorage.getItem(VIM_STORAGE_KEY)).toBeNull()
  })

  it("treats unrecognized stored values as false (defensive)", () => {
    localStorage.setItem(VIM_STORAGE_KEY, "garbage")
    expect(readVimPreference()).toBe(false)
  })

  it("uses the namespaced storage key 'cartularium:editor:vim'", () => {
    expect(VIM_STORAGE_KEY).toBe("cartularium:editor:vim")
  })
})
