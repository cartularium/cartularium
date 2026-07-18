import { describe, it, expect } from "vitest";
import {
  analyzeFormula,
  coHostPlacement,
  isLumpable,
  requiresIsolation,
} from "./cohost.js";

describe("coHostPlacement — the lump screen + opaque-ref routing", () => {
  it("LUMP: reference-free ∧ position-insensitive formulas", () => {
    for (const f of ["=1+1", "=PI()", "=SUM(1,2)", "=SQRT(2)*3", '=CONCAT("a","b")']) {
      expect(coHostPlacement(f)).toBe("lump");
    }
  });

  it("LUMP: a digit-bearing function name is not mistaken for a cell ref", () => {
    // LOG10 / ATAN2 contain letters+digits but are functions, not references.
    expect(coHostPlacement("=LOG10(1000)")).toBe("lump");
    expect(coHostPlacement("=ATAN2(1,1)")).toBe("lump");
    expect(isLumpable("=SUMSQ(3,4)")).toBe(true);
  });

  it("IN-PLACE: formulas with cell/range references", () => {
    for (const f of ["=A1", "=B2*2", "=SUM(A1:A10)", "=SUM(A:A)", "=Sheet2!A1"]) {
      expect(coHostPlacement(f)).toBe("in-place");
    }
  });

  it("IN-PLACE: position-sensitive functions that are not opaque", () => {
    for (const f of ["=ROW()", "=COLUMN()", '=CELL("row")']) {
      expect(coHostPlacement(f)).toBe("in-place");
    }
  });

  it("ISOLATE: opaque references (INDIRECT/OFFSET) — reach unbounded", () => {
    for (const f of ['=INDIRECT("A"&B1)', "=OFFSET(A1,1,0)", "=SUM(OFFSET(A1,0,0,10,1))"]) {
      expect(coHostPlacement(f)).toBe("isolate");
      expect(requiresIsolation(f)).toBe(true);
    }
  });

  it("isolate takes precedence over in-place (opaque ⊃ position-sensitive)", () => {
    // INDIRECT is both position-sensitive and opaque — must route to the stronger.
    expect(coHostPlacement('=INDIRECT("Z9")')).toBe("isolate");
  });
});

describe("text-analysis robustness (no parser)", () => {
  it("a reference-LOOKING string literal is not a reference", () => {
    // ="A1" is the literal text "A1", reference-free ⇒ lumpable.
    expect(coHostPlacement('="A1"')).toBe("lump");
    expect(analyzeFormula('="A1"').hasReferences).toBe(false);
  });

  it("an opaque-LOOKING string literal does not force isolation", () => {
    // "INDIRECT" inside a string is not a call.
    const f = '=IF(A1,"INDIRECT","x")';
    expect(analyzeFormula(f).opaqueReference).toBe(false);
    expect(coHostPlacement(f)).toBe("in-place"); // still has the A1 ref
  });

  it("analyzeFormula reports the function set + volatility", () => {
    const facts = analyzeFormula("=NOW()+RAND()");
    expect(facts.functionsUsed).toEqual(["NOW", "RAND"]);
    expect(facts.volatile).toBe(true);
    expect(facts.hasReferences).toBe(false);
    // volatile but reference-free + position-insensitive ⇒ still lump-packable
    // (volatility is a drift-exclusion axis, not a placement one).
    expect(coHostPlacement("=NOW()")).toBe("lump");
  });
});
