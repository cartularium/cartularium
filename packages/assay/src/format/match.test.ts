import { describe, expect, it } from "vitest";
import type { RichGridValue } from "./values.js";
import { evaluateMatcher, gridsEqual } from "./match.js";
import { liftScalarGrid } from "@cartularium/drivers";

const tol = { numTolerance: 1e-10 };

function liftedExcel(scalar: number | string | boolean | { error: string } | null) {
  return liftScalarGrid([[scalar]], "excel");
}

describe("evaluateMatcher — legacy scalar matchers against rich actuals", () => {
  it("number literal matches rich number primitive", () => {
    const actual = liftedExcel(42);
    expect(evaluateMatcher(42, actual, tol).passed).toBe(true);
  });

  it("CellError literal matches rich classic error", () => {
    const actual = liftedExcel({ error: "#DIV/0!" });
    expect(evaluateMatcher({ error: "#DIV/0!" }, actual, tol).passed).toBe(true);
  });

  it("MatcherObject {error:...} matches rich error primitive", () => {
    const actual = liftedExcel({ error: "#VALUE!" });
    expect(evaluateMatcher({ error: "#VALUE!" }, actual, tol).passed).toBe(true);
    expect(evaluateMatcher({ error: "any" }, actual, tol).passed).toBe(true);
  });

  it("MatcherObject {near, tol} matches rich number with tolerance", () => {
    const actual = liftedExcel(3.14159);
    expect(evaluateMatcher({ near: 3.14, tol: 0.01 }, actual, tol).passed).toBe(true);
  });
});

describe("evaluateMatcher — structural-subset rich matchers", () => {
  it("primitive kind matches against rich actual", () => {
    const actual = liftedExcel(42);
    expect(
      evaluateMatcher({ primitive: { kind: "number" } }, actual, tol).passed,
    ).toBe(true);
    expect(
      evaluateMatcher({ primitive: { kind: "string" } }, actual, tol).passed,
    ).toBe(false);
  });

  it("primitive kind + value matches when value matches", () => {
    const actual = liftedExcel(42);
    expect(
      evaluateMatcher(
        { primitive: { kind: "number", value: 42 } },
        actual,
        tol,
      ).passed,
    ).toBe(true);
    expect(
      evaluateMatcher(
        { primitive: { kind: "number", value: 43 } },
        actual,
        tol,
      ).passed,
    ).toBe(false);
  });

  it("primitive extended-error matches with sentinel", () => {
    // Build a rich actual with extended-error directly (lift produces classic
    // error for the literal, so construct manually).
    const actual: RichGridValue = [[{
      primitive: { kind: "extended-error", sentinel: "#SPILL!", error_type: 8 },
      engine: { platform: "excel" },
    }]];
    expect(
      evaluateMatcher(
        { primitive: { kind: "extended-error", sentinel: "#SPILL!" } },
        actual,
        tol,
      ).passed,
    ).toBe(true);
    expect(
      evaluateMatcher(
        { primitive: { kind: "extended-error", sentinel: "#CALC!" } },
        actual,
        tol,
      ).passed,
    ).toBe(false);
  });

  it("engine structural-subset matches engine extras path", () => {
    const actual: RichGridValue = [[{
      primitive: { kind: "extended-error", sentinel: "#SPILL!" },
      engine: {
        platform: "excel",
        modern_error_detail: { error_type: 8, sub_type: 1, extras: { colOffset: "2" } },
      },
    }]];
    expect(
      evaluateMatcher(
        {
          engine: {
            platform: "excel",
            modern_error_detail: { sub_type: 1 },
          },
        },
        actual,
        tol,
      ).passed,
    ).toBe(true);
    expect(
      evaluateMatcher(
        {
          engine: {
            platform: "excel",
            modern_error_detail: { sub_type: 2 },
          },
        },
        actual,
        tol,
      ).passed,
    ).toBe(false);
  });

  it("primitive + engine compose as AND", () => {
    const actual: RichGridValue = [[{
      primitive: { kind: "extended-error", sentinel: "#SPILL!", error_type: 8 },
      engine: { platform: "excel", modern_error_detail: { error_type: 8, sub_type: 1 } },
    }]];
    const passed = evaluateMatcher(
      {
        primitive: { kind: "extended-error", sentinel: "#SPILL!" },
        engine: { platform: "excel", modern_error_detail: { sub_type: 1 } },
      },
      actual,
      tol,
    ).passed;
    expect(passed).toBe(true);
  });

  it("formula shared field matches", () => {
    const actual: RichGridValue = [[{
      primitive: { kind: "number", value: 55 },
      formula: "SUM(A1:A10)",
      engine: { platform: "excel" },
    }]];
    expect(evaluateMatcher({ formula: "SUM(A1:A10)" }, actual, tol).passed).toBe(true);
    expect(evaluateMatcher({ formula: "AVERAGE(A1:A10)" }, actual, tol).passed).toBe(false);
  });

  it("rich blank vs rich null are distinguished by kind", () => {
    const blankActual: RichGridValue = [[{
      primitive: { kind: "blank", reason: "untouched" },
      engine: { platform: "excel" },
    }]];
    const nullActual: RichGridValue = [[{
      primitive: { kind: "null", reason: "formula-returned-null" },
      engine: { platform: "gsheets", wire_kind: "null" },
    }]];
    expect(
      evaluateMatcher({ primitive: { kind: "blank" } }, blankActual, tol).passed,
    ).toBe(true);
    expect(
      evaluateMatcher({ primitive: { kind: "blank" } }, nullActual, tol).passed,
    ).toBe(false);
    expect(
      evaluateMatcher({ primitive: { kind: "null" } }, nullActual, tol).passed,
    ).toBe(true);
  });
});

describe("gridsEqual — rich and scalar interop", () => {
  it("two equivalent rich grids compare equal at the primitive axis", () => {
    const a: RichGridValue = [[{
      primitive: { kind: "number", value: 5 },
      engine: { platform: "excel" },
    }]];
    const b: RichGridValue = [[{
      primitive: { kind: "number", value: 5 },
      engine: { platform: "gsheets", wire_kind: "number" },
    }]];
    expect(gridsEqual(a, b)).toBe(true);
  });

  it("rich grids with different engine extras still compare equal (primitive-axis default)", () => {
    const a: RichGridValue = [[{
      primitive: { kind: "extended-error", sentinel: "#SPILL!" },
      engine: { platform: "excel", modern_error_detail: { error_type: 8, sub_type: 1 } },
    }]];
    const b: RichGridValue = [[{
      primitive: { kind: "extended-error", sentinel: "#SPILL!" },
      engine: { platform: "excel", modern_error_detail: { error_type: 8, sub_type: 2 } },
    }]];
    // Default divergence semantics = primitive axis only (coalescing-session lock).
    expect(gridsEqual(a, b)).toBe(true);
  });

  it("scalar grid and rich grid compare via projection", () => {
    const rich: RichGridValue = [[{
      primitive: { kind: "number", value: 5 },
      engine: { platform: "excel" },
    }]];
    expect(gridsEqual(rich, [[5]])).toBe(true);
    expect(gridsEqual(rich, [[6]])).toBe(false);
  });

  it("projects rich grids when the first row is all null", () => {
    const rich: RichGridValue = [
      [null],
      [{
        primitive: { kind: "number", value: 7 },
        engine: { platform: "excel" },
      }],
    ];

    expect(gridsEqual(rich, [[null], [7]])).toBe(true);
    expect(evaluateMatcher([[null], [7]], rich, tol).passed).toBe(true);
  });
});
