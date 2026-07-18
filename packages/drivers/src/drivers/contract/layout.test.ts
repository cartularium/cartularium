import { describe, it, expect } from "vitest";
import {
  DEFAULT_LAYOUT,
  colToLetter,
  letterToCol,
  coordToA1,
  a1ToCoord,
  formulaCellA1,
  stagingRangeA1,
  inputRangeA1,
  requiredDimensions,
  inInputRegion,
  isDeclaredObstacle,
  validateGrid,
} from "./layout.js";

describe("A1 <-> coordinate conversion", () => {
  it("colToLetter is bijective base-26, 1-indexed", () => {
    expect(colToLetter(1)).toBe("A");
    expect(colToLetter(26)).toBe("Z");
    expect(colToLetter(27)).toBe("AA");
    expect(colToLetter(46)).toBe("AT");
    expect(colToLetter(702)).toBe("ZZ");
    expect(colToLetter(703)).toBe("AAA");
  });

  it("letterToCol inverts colToLetter", () => {
    for (const col of [1, 26, 27, 46, 702, 703, 16384]) {
      expect(letterToCol(colToLetter(col))).toBe(col);
    }
  });

  it("coordToA1 / a1ToCoord round-trip", () => {
    expect(coordToA1({ row: 1, col: 27 })).toBe("AA1");
    expect(a1ToCoord("AA1")).toEqual({ row: 1, col: 27 });
    expect(a1ToCoord("z30")).toEqual({ row: 30, col: 26 }); // case-insensitive
  });

  it("rejects invalid input", () => {
    expect(() => colToLetter(0)).toThrow();
    expect(() => letterToCol("A1")).toThrow();
    expect(() => a1ToCoord("1A")).toThrow();
    expect(() => a1ToCoord("AA")).toThrow();
  });
});

describe("DEFAULT_LAYOUT derived ranges match the legacy constants", () => {
  it("formula cell is AA1", () => {
    expect(formulaCellA1(DEFAULT_LAYOUT)).toBe("AA1");
  });
  it("staging window is AA1:AT20", () => {
    expect(stagingRangeA1(DEFAULT_LAYOUT)).toBe("AA1:AT20");
  });
  it("input region is A1:Z{rows}", () => {
    expect(inputRangeA1(DEFAULT_LAYOUT, 30)).toBe("A1:Z30");
    expect(inputRangeA1(DEFAULT_LAYOUT, 0)).toBe("A1:Z1"); // floors at 1
  });
});

describe("requiredDimensions (§5 rule 1 — derived, not defaulted)", () => {
  it("covers the staging window's far corner and the taller of input/staging rows", () => {
    // formula col 27 + 20 - 1 = 46 (AT); staging last row = 1 + 20 - 1 = 20
    expect(requiredDimensions(DEFAULT_LAYOUT, 30)).toEqual({ rows: 30, cols: 46 });
    expect(requiredDimensions(DEFAULT_LAYOUT, 5)).toEqual({ rows: 20, cols: 46 });
  });
  it("adds headroom", () => {
    expect(requiredDimensions(DEFAULT_LAYOUT, 30, 10)).toEqual({ rows: 40, cols: 56 });
  });
});

describe("validateGrid (§5 rule 3 — region validation)", () => {
  it("accepts refs inside the INPUT region", () => {
    expect(validateGrid(DEFAULT_LAYOUT, { A1: 1, Z30: "x", B5: true })).toEqual([]);
  });
  it("flags a ref colliding with the FORMULA/STAGING window", () => {
    const v = validateGrid(DEFAULT_LAYOUT, { AA1: 1 }); // formula cell itself
    expect(v).toHaveLength(1);
    expect(v[0].reason).toMatch(/FORMULA\/STAGING/);
    const v2 = validateGrid(DEFAULT_LAYOUT, { AB5: 1 }); // inside staging (col 28, row 5)
    expect(v2[0].reason).toMatch(/FORMULA\/STAGING/);
  });
  it("flags a ref outside INPUT but past the staging window", () => {
    const v = validateGrid(DEFAULT_LAYOUT, { AU1: 1 }); // col 47, beyond staging last col 46
    expect(v[0].reason).toMatch(/outside INPUT/);
  });
  it("flags an unparseable ref", () => {
    expect(validateGrid(DEFAULT_LAYOUT, { "1A": 1 })[0].reason).toMatch(/unparseable/);
  });
  it("inInputRegion agrees", () => {
    expect(inInputRegion(DEFAULT_LAYOUT, { row: 1, col: 1 })).toBe(true);
    expect(inInputRegion(DEFAULT_LAYOUT, { row: 1, col: 27 })).toBe(false);
  });
});

describe("declared spill-path obstacles (the spill-block family)", () => {
  // AB5 = col 28, row 5 — inside the staging window (AA1:AT20).
  const withObstacle = { ...DEFAULT_LAYOUT, obstacles: [{ row: 5, col: 28 }] };

  it("a declared obstacle inside the window is a legal fixture, not a violation", () => {
    expect(validateGrid(withObstacle, { AB5: 1 })).toEqual([]);
    // ...but without the declaration the same seed is a violation.
    expect(validateGrid(DEFAULT_LAYOUT, { AB5: 1 })[0].reason).toMatch(/FORMULA\/STAGING/);
  });

  it("an UNdeclared collision is still a violation even when others are declared", () => {
    const v = validateGrid(withObstacle, { AB5: 1, AC6: 1 }); // AC6 undeclared
    expect(v).toHaveLength(1);
    expect(v[0].ref).toBe("AC6");
  });

  it("the formula cell is never legalized, even if listed as an obstacle", () => {
    const sneaky = { ...DEFAULT_LAYOUT, obstacles: [{ row: 1, col: 27 }] }; // AA1 = formula
    expect(validateGrid(sneaky, { AA1: 1 })[0].reason).toMatch(/FORMULA\/STAGING/);
    expect(isDeclaredObstacle(sneaky, { row: 1, col: 27 })).toBe(false);
  });

  it("isDeclaredObstacle distinguishes declared / undeclared", () => {
    expect(isDeclaredObstacle(withObstacle, { row: 5, col: 28 })).toBe(true);
    expect(isDeclaredObstacle(withObstacle, { row: 6, col: 28 })).toBe(false);
  });
});
