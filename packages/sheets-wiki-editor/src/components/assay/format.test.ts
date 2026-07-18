import { describe, it, expect } from "vitest"
import { formatCell } from "./format"

describe("formatCell", () => {
  it("renders null as em dash", () => {
    expect(formatCell(null)).toEqual({ display: "—", kind: "null" })
  })

  it("renders numbers without quotes", () => {
    expect(formatCell(42)).toEqual({ display: "42", kind: "number" })
    expect(formatCell(3.14)).toEqual({ display: "3.14", kind: "number" })
  })

  it("renders strings with surrounding quotes", () => {
    expect(formatCell("hello")).toEqual({ display: '"hello"', kind: "string" })
  })

  it("renders booleans uppercase", () => {
    expect(formatCell(true)).toEqual({ display: "TRUE", kind: "boolean" })
    expect(formatCell(false)).toEqual({ display: "FALSE", kind: "boolean" })
  })

  it("renders cell errors as their error code unquoted", () => {
    expect(formatCell({ error: "#NAME?" })).toEqual({ display: "#NAME?", kind: "error" })
  })
})
