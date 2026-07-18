// Contamination invariant — the isolation acceptance gate (driver-contract §2.2,
// seeding §6.3). `evaluateBatch(tasks)` results MUST be mutually independent:
// each result equals what evaluating that task ALONE in a fresh environment
// would produce. Batching is a performance amortization, never observable
// coupling; a driver that shares a host across tasks owns isolation within it.
//
// The gate is a REUSABLE HARNESS over the minimal Driver slice (`evaluate` +
// `evaluateBatch`). It runs the adversarial batch (an error + an order-sensitive
// SORT + an ordinary formula), compares each task's batched result to its
// run-alone result, AND repeats under a permuted order so order-coupling can't
// hide. Pure engines pass by construction (the reference); the heavy two — Excel
// process-death recovery (D3) and gsheets un-wedge (D4) — must satisfy it.
// Misbehavior isolation (read-model.ts T3 `isolated`) is the recovery path that
// *upholds* this guarantee when a co-tenant crashes/wedges; here we assert the
// clean-value half (§6.3: "Excel passes — a regression guard, not a fix target").

import {
  isCellError,
  outcomeErrorText,
  projectScalarGrid,
  type CellValue,
  type DriverTask,
  type DriverTaskResult,
  type RichGridValue,
} from "../../format/values.js";

/** The minimal driver slice the gate exercises (a structural subset of `Driver`). */
export interface IsolationSubject {
  evaluate(formula: string, grid?: Record<string, CellValue>): Promise<RichGridValue>;
  evaluateBatch(tasks: DriverTask[]): Promise<DriverTaskResult[]>;
}

/** The §6.3 adversarial batch: error + order-sensitive SORT + an ordinary formula. */
export const ADVERSARIAL_BATCH: DriverTask[] = [
  { formula: "=SORT({3;1;2})" },
  { formula: "=1/0" },
  { formula: "=1+1" },
];

export interface ContaminationViolation {
  taskIndex: number;
  formula: string;
  mode: "batched" | "permuted";
  alone: CellValue[][];
  observed: CellValue[][] | { error?: string; skipped?: string };
}

export interface ContaminationOptions {
  /**
   * Exclude volatile tasks from the equality check — they legitimately differ
   * per evaluation (NOW/RAND/TODAY); §6.3 "volatiles excluded/seeded first".
   */
  isVolatile?: (task: DriverTask) => boolean;
  /** A fixed permutation (indices into `tasks`) for the order-coupling pass. */
  permutation?: number[];
}

const DEFAULT_VOLATILE = (t: DriverTask): boolean =>
  /\b(NOW|RAND|RANDBETWEEN|RANDARRAY|TODAY)\s*\(/i.test(t.formula);

/**
 * Run the contamination invariant against `subject`. Returns the violations —
 * empty means batching is isolated. Each task is compared (scalar-projected,
 * volatiles excluded) against its run-alone result, both in natural order and
 * under a permutation.
 */
export async function checkContamination(
  subject: IsolationSubject,
  tasks: DriverTask[] = ADVERSARIAL_BATCH,
  opts: ContaminationOptions = {},
): Promise<ContaminationViolation[]> {
  const isVolatile = opts.isVolatile ?? DEFAULT_VOLATILE;
  const permutation = opts.permutation ?? tasks.map((_, i) => tasks.length - 1 - i);

  // Baseline: each task evaluated ALONE in a fresh call.
  const alone: CellValue[][][] = [];
  for (const t of tasks) {
    alone.push(projectScalarGrid(await subject.evaluate(t.formula, t.grid)));
  }

  const violations: ContaminationViolation[] = [];
  const collect = (results: DriverTaskResult[], mode: "batched" | "permuted"): void => {
    tasks.forEach((t, i) => {
      if (isVolatile(t)) return;
      const r = results[i];
      const observed: CellValue[][] | { error?: string; skipped?: string } =
        r && r.outcome.kind === "value"
          ? projectScalarGrid(r.outcome.grid)
          : {
              error: r ? outcomeErrorText(r.outcome) : undefined,
              skipped: r?.outcome.kind === "skipped" ? r.outcome.reason : undefined,
            };
      if (!gridsEqual(alone[i], observed)) {
        violations.push({ taskIndex: i, formula: t.formula, mode, alone: alone[i], observed });
      }
    });
  };

  // Batched, natural order.
  collect(await subject.evaluateBatch(tasks), "batched");

  // Batched, permuted order — remap results back to natural order before compare.
  const permResults = await subject.evaluateBatch(permutation.map((i) => tasks[i]));
  const remapped: DriverTaskResult[] = [];
  permutation.forEach((origIdx, permIdx) => {
    remapped[origIdx] = permResults[permIdx];
  });
  collect(remapped, "permuted");

  return violations;
}

function gridsEqual(a: CellValue[][], b: unknown): boolean {
  if (!Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    const ra = a[r];
    const rb = (b as CellValue[][])[r];
    if (!Array.isArray(rb) || ra.length !== rb.length) return false;
    for (let c = 0; c < ra.length; c++) {
      if (!cellsEqual(ra[c], rb[c])) return false;
    }
  }
  return true;
}

function cellsEqual(a: CellValue, b: CellValue): boolean {
  if (isCellError(a) || isCellError(b)) {
    return isCellError(a) && isCellError(b) && a.error === b.error;
  }
  return a === b;
}
