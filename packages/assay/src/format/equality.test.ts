import { describe, it, expect } from "vitest";
import type { PrimitiveValue, RichCellValue, RichGridValue } from "./values.js";
import { gridsEqual } from "./match.js";
import {
  canonicalizeCell,
  canonicalEquals,
  richCellsEqual,
  richGridsEqual,
} from "./equality.js";

// Minimal rich cell — equality reads only `.primitive`, the engine stub is inert.
const cell = (primitive: PrimitiveValue): RichCellValue => ({
  primitive,
  engine: { platform: "gsheets", wire_kind: "blank" },
});

describe("canonicalizeCell — circulating identity", () => {
  it("a grid hole (no cell) canonicalizes to blank (untouched)", () => {
    expect(canonicalizeCell(null)).toEqual({ c: "blank" });
  });
  it("classic + extended errors unify by sentinel", () => {
    expect(canonicalizeCell(cell({ kind: "error", sentinel: "#N/A" }))).toEqual({
      c: "error",
      v: "#N/A",
    });
    expect(canonicalizeCell(cell({ kind: "extended-error", sentinel: "#SPILL!" }))).toEqual({
      c: "error",
      v: "#SPILL!",
    });
  });
  it("opaque canonicalizes to its type_tag only (content dropped — no-data)", () => {
    expect(
      canonicalizeCell(cell({ kind: "opaque", type_tag: "sparkline", content: "abc" })),
    ).toEqual({ c: "opaque", v: "sparkline" });
  });
});

describe("canonicalEquals — the B1 distinctions the scalar path collapses", () => {
  it("blank ≠ null (the ratified D8.β divergence; both project to scalar null)", () => {
    expect(richCellsEqual(cell({ kind: "blank" }), cell({ kind: "null" }))).toBe(false);
    expect(richCellsEqual(cell({ kind: "blank" }), cell({ kind: "blank" }))).toBe(true);
    expect(richCellsEqual(cell({ kind: "null" }), cell({ kind: "null" }))).toBe(true);
  });
  it("a grid hole equals a blank cell but NOT a null cell", () => {
    expect(richCellsEqual(null, cell({ kind: "blank" }))).toBe(true);
    expect(richCellsEqual(null, cell({ kind: "null" }))).toBe(false);
  });
  it("type/coercion is circulating: number 1 ≠ string \"1\" ≠ boolean true", () => {
    expect(richCellsEqual(cell({ kind: "number", value: 1 }), cell({ kind: "string", value: "1" }))).toBe(false);
    expect(richCellsEqual(cell({ kind: "boolean", value: true }), cell({ kind: "number", value: 1 }))).toBe(false);
  });
  it("numbers compare within relative tolerance", () => {
    expect(richCellsEqual(cell({ kind: "number", value: 1 }), cell({ kind: "number", value: 1 + 1e-12 }))).toBe(true);
    expect(richCellsEqual(cell({ kind: "number", value: 1 }), cell({ kind: "number", value: 2 }))).toBe(false);
  });
  it("NaN equals NaN (same class)", () => {
    expect(richCellsEqual(cell({ kind: "number", value: NaN }), cell({ kind: "number", value: NaN }))).toBe(true);
  });
  it("errors compare by sentinel; error ≠ value", () => {
    expect(richCellsEqual(cell({ kind: "error", sentinel: "#N/A" }), cell({ kind: "error", sentinel: "#N/A" }))).toBe(true);
    expect(richCellsEqual(cell({ kind: "error", sentinel: "#N/A" }), cell({ kind: "error", sentinel: "#REF!" }))).toBe(false);
    expect(richCellsEqual(cell({ kind: "error", sentinel: "#N/A" }), cell({ kind: "string", value: "#N/A" }))).toBe(false);
  });
  it("opaque compares by type_tag — different-data sparklines compare EQUAL (no-data)", () => {
    expect(
      richCellsEqual(
        cell({ kind: "opaque", type_tag: "sparkline", content: "data-A" }),
        cell({ kind: "opaque", type_tag: "sparkline", content: "data-B" }),
      ),
    ).toBe(true);
    expect(
      richCellsEqual(
        cell({ kind: "opaque", type_tag: "sparkline" }),
        cell({ kind: "opaque", type_tag: "image" }),
      ),
    ).toBe(false);
  });
  it("rich-text compares by collapsed string", () => {
    expect(richCellsEqual(cell({ kind: "rich-text", collapsed: "hi" }), cell({ kind: "rich-text", collapsed: "hi" }))).toBe(true);
    expect(richCellsEqual(cell({ kind: "rich-text", collapsed: "hi" }), cell({ kind: "rich-text", collapsed: "bye" }))).toBe(false);
  });
  it("respects an explicit tolerance argument", () => {
    expect(canonicalEquals({ c: "number", v: 100 }, { c: "number", v: 101 }, 0.05)).toBe(true);
    expect(canonicalEquals({ c: "number", v: 100 }, { c: "number", v: 110 }, 0.05)).toBe(false);
  });
});

describe("richGridsEqual + gridsEqual wiring", () => {
  const blankGrid: RichGridValue = [[cell({ kind: "blank" })]];
  const nullGrid: RichGridValue = [[cell({ kind: "null" })]];

  it("shape mismatch is unequal", () => {
    expect(richGridsEqual([[cell({ kind: "number", value: 1 })]], [[]])).toBe(false);
  });
  it("a blank-vs-null cell makes grids unequal", () => {
    expect(richGridsEqual(blankGrid, nullGrid)).toBe(false);
  });
  it("gridsEqual routes two rich grids through the rich path (blank ≠ null)", () => {
    // The regression guard for B1: the public divergence spine must NOT collapse
    // these the way projectScalarGrid → cellsEqual did.
    expect(gridsEqual(blankGrid, nullGrid)).toBe(false);
    expect(gridsEqual(blankGrid, blankGrid)).toBe(true);
  });
});
