import { describe, it, expect } from "vitest";
import { planPacking, regionsOverlap, findRegionCollisions } from "./packing.js";
import { DEFAULT_LAYOUT } from "./layout.js";

describe("regionsOverlap", () => {
  const a = { top: 1, left: 1, rows: 20, cols: 20 };
  it("disjoint / edge-touching regions do NOT overlap", () => {
    expect(regionsOverlap(a, { top: 21, left: 1, rows: 20, cols: 20 })).toBe(false); // directly below
    expect(regionsOverlap(a, { top: 1, left: 21, rows: 20, cols: 20 })).toBe(false); // directly right
  });
  it("nested / corner-sharing regions DO overlap", () => {
    expect(regionsOverlap(a, { top: 10, left: 10, rows: 5, cols: 5 })).toBe(true); // inside
    expect(regionsOverlap(a, { top: 20, left: 20, rows: 5, cols: 5 })).toBe(true); // shares cell (20,20)
  });
});

describe("planPacking — the M1 placement planner", () => {
  it("opaque references (INDIRECT/OFFSET) are isolated, each its own host", () => {
    const plan = planPacking(["=INDIRECT(A1)", "=OFFSET(A1,1,1)"]);
    expect(plan.tasks.map((t) => t.placement)).toEqual(["isolate", "isolate"]);
    expect(plan.tasks[0].host).not.toBe(plan.tasks[1].host);
  });

  it("reference-bearing formulas are in-place, each its own host", () => {
    const plan = planPacking(["=SUM(A1:A3)", "=A1+B1"]);
    expect(plan.tasks.map((t) => t.placement)).toEqual(["in-place", "in-place"]);
    expect(plan.tasks[0].host).not.toBe(plan.tasks[1].host);
  });

  it("reference-free scalars lump; the conservative default gives each its own host", () => {
    const plan = planPacking(["=1+1", "=SUM(1,2,3)", '=UPPER("x")']);
    expect(plan.tasks.every((t) => t.placement === "lump")).toBe(true);
    expect(new Set(plan.tasks.map((t) => t.host)).size).toBe(3); // no dense tiling by default
  });

  it("a reference-free formula WITH seeded input is NOT lumpable (its seeds would collide)", () => {
    // the spill-block shape: =SEQUENCE(...) (reference-free) + a blocker grid. hasInput
    // forces in-place so the seeds stay on its own host (the tiled-vs-untiled bleed fix).
    const plan = planPacking(["=SEQUENCE(5)", "=1+1"], {
      hostRows: DEFAULT_LAYOUT.stagingRows * 2,
      hostCols: DEFAULT_LAYOUT.stagingCols * 2,
      hasInput: [true, false],
    });
    expect(plan.tasks[0].placement).toBe("in-place"); // grid-bearing → own host
    expect(plan.tasks[1].placement).toBe("lump");
    expect(plan.tasks[0].host).not.toBe(plan.tasks[1].host);
    expect(findRegionCollisions(plan)).toEqual([]);
  });

  it("a larger host tiles lump tasks densely into NON-overlapping staging windows (m4)", () => {
    // host = 2×2 staging windows => 4 lump tasks per host
    const formulas = Array.from({ length: 5 }, (_, i) => `=${i}+1`);
    const plan = planPacking(formulas, {
      hostRows: DEFAULT_LAYOUT.stagingRows * 2,
      hostCols: DEFAULT_LAYOUT.stagingCols * 2,
    });
    expect(plan.hostCount).toBe(2); // 5 tasks, 4 per host
    expect(findRegionCollisions(plan)).toEqual([]); // the spill-reach guarantee holds
  });

  it("isolate/in-place never share a host with any other task, even when lumps tile", () => {
    const plan = planPacking(["=1+1", "=INDIRECT(A1)", "=2+2"], {
      hostRows: DEFAULT_LAYOUT.stagingRows * 2,
      hostCols: DEFAULT_LAYOUT.stagingCols * 2,
    });
    const isolateHost = plan.tasks.find((t) => t.placement === "isolate")!.host;
    expect(plan.tasks.filter((t) => t.host === isolateHost)).toHaveLength(1);
    expect(findRegionCollisions(plan)).toEqual([]);
  });
});
