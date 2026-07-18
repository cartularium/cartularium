import { describe, it, expect } from "vitest";
import { isCellError, type CellValue, type RichGridValue } from "../../format/values.js";
import { liftScalarGrid } from "../lift.js";
import {
  checkTypeFidelity,
  DEFAULT_SEEDS,
  type TypeFidelitySubject,
} from "./type-fidelity.js";

// A miniature engine: it ingests A1 with a configurable policy, then answers the
// IS* probes from the STORED type. This lets us prove the gate both passes a
// faithful ingester and CATCHES a coercing one — without a live host.
type StoredKind = "number" | "text" | "boolean" | "error" | "blank";

function ingest(v: CellValue | undefined, coerceNumericStrings: boolean): StoredKind {
  if (v === undefined || v === null) return "blank";
  if (typeof v === "number") return "number";
  if (typeof v === "boolean") return "boolean";
  if (isCellError(v)) return "error";
  // string: a faithful engine keeps "3" as text; the gsheets crack coerces it.
  if (coerceNumericStrings && /^-?\d+(\.\d+)?$/.test(v)) return "number";
  return "text";
}

function fakeEngine(coerceNumericStrings: boolean): TypeFidelitySubject {
  return {
    async evaluate(formula, grid = {}): Promise<RichGridValue> {
      const stored = ingest(grid["A1"], coerceNumericStrings);
      const answer =
        formula === "=ISNUMBER(A1)"
          ? stored === "number"
          : formula === "=ISTEXT(A1)"
            ? stored === "text"
            : formula === "=ISLOGICAL(A1)"
              ? stored === "boolean"
              : formula === "=ISERROR(A1)"
                ? stored === "error"
                : false;
      return liftScalarGrid([[answer]], "hyperformula");
    },
  };
}

describe("type-fidelity gate", () => {
  it("passes a faithful ingester (the reference — pure engines)", async () => {
    const violations = await checkTypeFidelity(fakeEngine(false));
    expect(violations).toEqual([]);
  });

  it("catches a coercing ingester (the gsheets USER_ENTERED crack)", async () => {
    const violations = await checkTypeFidelity(fakeEngine(true));
    expect(violations.length).toBeGreaterThan(0);
    // The "3"-as-text seed is the canonical crack: it gets stored as a number.
    const flaggedSeeds = violations.map((v) => v.seed);
    expect(flaggedSeeds).toContain("3");
    // And specifically ISNUMBER("3") wrongly returns true.
    const isnum = violations.find((v) => v.seed === "3" && v.probe === "=ISNUMBER(A1)");
    expect(isnum).toMatchObject({ expected: false, actual: true });
  });

  it("an error-LOOKING string is text, not an error (D1)", async () => {
    // Faithful engine: seeding the STRING "#DIV/0!" must read as text, not error.
    const violations = await checkTypeFidelity(fakeEngine(false), ["#DIV/0!"]);
    expect(violations).toEqual([]);
  });

  it("sweeps the classic-7 error literals among the defaults", () => {
    // sanity: the default sweep includes real error seeds (CellError objects)
    const errorSeeds = DEFAULT_SEEDS.filter(
      (s) => typeof s === "object" && s !== null && "error" in s,
    );
    expect(errorSeeds.length).toBe(7);
  });
});
