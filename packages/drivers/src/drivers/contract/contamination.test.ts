import { describe, it, expect } from "vitest";
import type {
  CellValue,
  DriverTask,
  DriverTaskResult,
  RichGridValue,
} from "../../format/values.js";
import { liftScalarGrid } from "../lift.js";
import { valueOutcome } from "../../format/values.js";
import { ADVERSARIAL_BATCH, checkContamination, type IsolationSubject } from "./contamination.js";

// A miniature engine over the adversarial batch's formulas. `evaluate` (alone) is
// always correct; the two `evaluateBatch` variants below differ only in whether
// batching couples tasks — which is exactly what the gate must detect.
function fakeEval(formula: string): CellValue[][] {
  if (formula === "=SORT({3;1;2})") return [[1], [2], [3]];
  if (formula === "=1/0") return [[{ error: "#DIV/0!" }]];
  if (formula === "=1+1") return [[2]];
  return [[null]];
}

const richResult = (formula: string): DriverTaskResult => ({
  outcome: valueOutcome(liftScalarGrid(fakeEval(formula), "hyperformula")),
});

const faithful: IsolationSubject = {
  async evaluate(formula): Promise<RichGridValue> {
    return liftScalarGrid(fakeEval(formula), "hyperformula");
  },
  async evaluateBatch(tasks): Promise<DriverTaskResult[]> {
    return tasks.map((t) => richResult(t.formula)); // isolated by construction
  },
};

// The contamination: when an error task is co-resident, the SORT comes back
// UNSORTED (the shape of the retired Excel claim — kept as a regression guard).
const contaminating: IsolationSubject = {
  async evaluate(formula): Promise<RichGridValue> {
    return liftScalarGrid(fakeEval(formula), "hyperformula"); // alone = correct
  },
  async evaluateBatch(tasks): Promise<DriverTaskResult[]> {
    const hasError = tasks.some((t) => t.formula === "=1/0");
    return tasks.map((t) => {
      if (hasError && t.formula === "=SORT({3;1;2})") {
        return { outcome: valueOutcome(liftScalarGrid([[3], [1], [2]], "hyperformula")) };
      }
      return richResult(t.formula);
    });
  },
};

describe("contamination gate", () => {
  it("passes an isolated batcher (the reference — pure engines)", async () => {
    expect(await checkContamination(faithful)).toEqual([]);
  });

  it("catches a batch that couples an error into a sibling's SORT", async () => {
    const violations = await checkContamination(contaminating);
    expect(violations.length).toBeGreaterThan(0);
    const sortHit = violations.find((v) => v.formula === "=SORT({3;1;2})");
    expect(sortHit).toBeDefined();
    // Caught in BOTH orderings — order-coupling can't hide it.
    expect(violations.map((v) => v.mode)).toContain("batched");
    expect(violations.map((v) => v.mode)).toContain("permuted");
  });

  it("excludes volatiles from the equality check (§6.3)", async () => {
    let tick = 0;
    const next = (formula: string): CellValue[][] => (formula.includes("NOW") ? [[++tick]] : [[1]]);
    const volatileSubject: IsolationSubject = {
      async evaluate(formula): Promise<RichGridValue> {
        return liftScalarGrid(next(formula), "hyperformula");
      },
      async evaluateBatch(tasks): Promise<DriverTaskResult[]> {
        return tasks.map((t) => ({
          outcome: valueOutcome(liftScalarGrid(next(t.formula), "hyperformula")),
        }));
      },
    };
    const tasks: DriverTask[] = [{ formula: "=NOW()" }, { formula: "=1+1" }];
    // NOW() differs every call, but the default volatile filter excludes it.
    expect(await checkContamination(volatileSubject, tasks)).toEqual([]);
    // Without the filter, the volatile difference IS flagged — proving the filter
    // is what suppresses it (not an accidental equality).
    const unfiltered = await checkContamination(volatileSubject, tasks, {
      isVolatile: () => false,
    });
    expect(unfiltered.some((v) => v.formula === "=NOW()")).toBe(true);
  });

  it("the default adversarial batch is error + SORT + ordinary", () => {
    expect(ADVERSARIAL_BATCH.map((t) => t.formula)).toEqual(["=SORT({3;1;2})", "=1/0", "=1+1"]);
  });
});
