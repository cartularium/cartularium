import { describe, it, expect } from "vitest";
import {
  classifySeed,
  isSeedFormula,
  normalizeFormula,
  expectedTypeProbes,
  CLASSIC_ERROR_SENTINELS,
} from "./seed.js";

describe("classifySeed — type decided once (D1)", () => {
  it("classifies scalars by their JS type", () => {
    expect(classifySeed(3)).toEqual({ kind: "number", value: 3 });
    expect(classifySeed("x")).toEqual({ kind: "text", value: "x" });
    expect(classifySeed(true)).toEqual({ kind: "boolean", value: true });
    expect(classifySeed(null)).toEqual({ kind: "blank" });
  });

  it("a string that LOOKS like an error is still text (D1: quoting is type)", () => {
    expect(classifySeed("#DIV/0!")).toEqual({ kind: "text", value: "#DIV/0!" });
  });

  it("an error seed is a CellError, not a string (D6 native error literal)", () => {
    expect(classifySeed({ error: "#DIV/0!" })).toEqual({ kind: "error", sentinel: "#DIV/0!" });
  });

  it("a formula-bearing entry classifies as a formula, normalized (decision B)", () => {
    expect(classifySeed({ formula: "=DATE(2021,1,1)" })).toEqual({
      kind: "formula",
      formula: "=DATE(2021,1,1)",
    });
    expect(classifySeed({ formula: "DATE(2021,1,1)" })).toEqual({
      kind: "formula",
      formula: "=DATE(2021,1,1)",
    });
  });
});

describe("isSeedFormula / normalizeFormula", () => {
  it("discriminates the formula entry from an error entry", () => {
    expect(isSeedFormula({ formula: "=1+1" })).toBe(true);
    expect(isSeedFormula({ error: "#N/A" })).toBe(false);
    expect(isSeedFormula(3)).toBe(false);
    expect(isSeedFormula(null)).toBe(false);
  });

  it("ensures exactly one leading '=' and rejects empty", () => {
    expect(normalizeFormula("1+1")).toBe("=1+1");
    expect(normalizeFormula("=1+1")).toBe("=1+1");
    expect(normalizeFormula("  =A1  ")).toBe("=A1");
    expect(() => normalizeFormula("")).toThrow();
    expect(() => normalizeFormula("=")).toThrow();
  });
});

describe("expectedTypeProbes — the type-fidelity invariant's oracle", () => {
  it("number / text / boolean / error / blank each have one true probe (or none)", () => {
    expect(expectedTypeProbes(classifySeed(3))).toMatchObject({ isNumber: true, isError: false });
    expect(expectedTypeProbes(classifySeed("x"))).toMatchObject({ isText: true });
    expect(expectedTypeProbes(classifySeed(true))).toMatchObject({ isLogical: true });
    expect(expectedTypeProbes(classifySeed({ error: "#REF!" }))).toMatchObject({ isError: true });
    expect(expectedTypeProbes(classifySeed(null))).toEqual({
      isNumber: false, isText: false, isLogical: false, isError: false,
    });
  });

  it("a formula seed carries no fixed expectation (invariant skips it)", () => {
    expect(expectedTypeProbes(classifySeed({ formula: "=1/0" }))).toBeNull();
  });
});

describe("CLASSIC_ERROR_SENTINELS", () => {
  it("is the portable 7-error set", () => {
    expect(CLASSIC_ERROR_SENTINELS).toHaveLength(7);
    expect(CLASSIC_ERROR_SENTINELS).toContain("#DIV/0!");
    expect(CLASSIC_ERROR_SENTINELS).toContain("#N/A");
  });
});
