import { describe, it, expect } from "vitest"
import { changedLineSet } from "./diffGutter"

describe("changedLineSet", () => {
  it("returns empty set when current matches base exactly", () => {
    const base = "line 1\nline 2\nline 3\n"
    const cur = "line 1\nline 2\nline 3\n"
    expect(Array.from(changedLineSet(base, cur))).toEqual([])
  })

  it("flags a single-line edit (1-indexed line number)", () => {
    const base = "line 1\nline 2\nline 3\n"
    const cur = "line 1\nLINE 2!\nline 3\n"
    expect(Array.from(changedLineSet(base, cur)).sort()).toEqual([2])
  })

  it("flags multiple changed lines", () => {
    const base = "a\nb\nc\nd\n"
    const cur = "a\nB!\nc!\nd\n"
    expect(Array.from(changedLineSet(base, cur)).sort()).toEqual([2, 3])
  })

  it("flags appended lines beyond base length", () => {
    const base = "a\nb\n"
    const cur = "a\nb\nc\nd\n"
    expect(Array.from(changedLineSet(base, cur)).sort()).toEqual([3, 4])
  })

  it("doesn't flag any line when current is shorter than base (deletions)", () => {
    const base = "a\nb\nc\nd\n"
    const cur = "a\nb\n"
    expect(Array.from(changedLineSet(base, cur)).sort()).toEqual([])
  })

  it("treats trailing newline differences as no change in the line content", () => {
    const base = "a\nb"
    const cur = "a\nb\n"
    expect(Array.from(changedLineSet(base, cur)).sort()).toEqual([])
  })

  it("uses 1-indexed line numbers (matching CodeMirror's line API)", () => {
    const base = "x\ny\n"
    const cur = "X\ny\n"
    expect(Array.from(changedLineSet(base, cur))).toEqual([1])
  })

  it("doesn't flag lines AFTER a mid-document deletion as modified", () => {
    const base = "a\nb\nc\nd\ne\n"
    const cur = "a\nc\nd\ne\n"
    expect(Array.from(changedLineSet(base, cur)).sort()).toEqual([])
  })

  it("flags only the inserted line for a mid-document insertion", () => {
    const base = "a\nb\nc\n"
    const cur = "a\nX\nb\nc\n"
    expect(Array.from(changedLineSet(base, cur)).sort()).toEqual([2])
  })

  it("doesn't flag lines after a delete-then-edit pattern as cascading modifies", () => {
    const base = "alpha\nbeta\ngamma\ndelta\n"
    const cur = "alpha\ngamma\ndelta-EDIT\n"
    expect(Array.from(changedLineSet(base, cur)).sort()).toEqual([3])
  })

  it("flags only the replaced line when a single line is swapped (delete-then-add)", () => {
    const base = "a\nb\nc\n"
    const cur = "a\nX\nc\n"
    expect(Array.from(changedLineSet(base, cur)).sort()).toEqual([2])
  })

  it("handles empty base + non-empty current (everything is added)", () => {
    const base = ""
    const cur = "a\nb\n"
    expect(Array.from(changedLineSet(base, cur)).sort()).toEqual([1, 2])
  })

  it("handles empty base + empty current", () => {
    expect(Array.from(changedLineSet("", "")).sort()).toEqual([])
  })
})
