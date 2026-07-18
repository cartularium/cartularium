import { describe, it, expect } from "vitest";
import type { RichGridValue } from "../../format/values.js";
import { DEFAULT_LAYOUT } from "./layout.js";
import {
  routeByExtent,
  stagingBoundaryReached,
  stagingCells,
  fitsStaging,
  DEFAULT_BUDGET,
  type Extent,
} from "./read-model.js";

describe("routeByExtent — §5.3 binary budget fork (materialize | digest)", () => {
  it("materialize: an extent within budget (also fits the staging window)", () => {
    expect(routeByExtent({ rows: 5, cols: 3 }).route).toBe("materialize");
  });

  it("materialize: a result EXCEEDING the staging window but within budget (T0/T1 collapsed)", () => {
    // the old ladder split these into staged vs sized-reread; §5.3 makes both
    // 'materialize' — staging size is a read-execution detail, not a cost route
    expect(routeByExtent({ rows: 50, cols: 1 }).route).toBe("materialize");
  });

  it("digest: an extent exceeding the materialize budget", () => {
    const r = routeByExtent({ rows: 2000, cols: 1 }, { maxMaterializeCells: 1000 });
    expect(r.route).toBe("digest");
    expect(r.reason).toMatch(/budget/);
  });

  it("only ever materialize | digest — isolation is a separate axis, never returned here", () => {
    const huge: Extent = { rows: 1_000_000, cols: 1_000_000 };
    expect(["materialize", "digest"]).toContain(routeByExtent(huge).route);
  });

  it("the default budget is 1M cells", () => {
    expect(DEFAULT_BUDGET.maxMaterializeCells).toBe(1_000_000);
  });
});

describe("stagingCells / fitsStaging", () => {
  it("stagingCells is rows×cols of the window", () => {
    expect(stagingCells(DEFAULT_LAYOUT)).toBe(400); // 20×20
  });
  it("fitsStaging at and below the window edge, not beyond", () => {
    expect(fitsStaging({ rows: 20, cols: 20 }, DEFAULT_LAYOUT)).toBe(true);
    expect(fitsStaging({ rows: 21, cols: 1 }, DEFAULT_LAYOUT)).toBe(false);
    expect(fitsStaging({ rows: 1, cols: 21 }, DEFAULT_LAYOUT)).toBe(false);
  });
});

describe("stagingBoundaryReached — runtime-probe tripwire, NOT a truncation flag", () => {
  const cell = () => null; // contents irrelevant; only shape matters

  it("trips when the staged read fills the window height (→ fire the extent probe)", () => {
    const g: RichGridValue = Array.from({ length: 20 }, () => [cell()]);
    expect(stagingBoundaryReached(g, DEFAULT_LAYOUT)).toBe(true);
  });

  it("trips when the staged read fills the window width", () => {
    const g: RichGridValue = [Array.from({ length: 20 }, () => cell())];
    expect(stagingBoundaryReached(g, DEFAULT_LAYOUT)).toBe(true);
  });

  it("does not trip for a result comfortably inside the window", () => {
    const g: RichGridValue = [[cell()], [cell()]];
    expect(stagingBoundaryReached(g, DEFAULT_LAYOUT)).toBe(false);
  });
});
