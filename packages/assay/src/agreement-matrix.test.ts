import { describe, expect, it } from "vitest";
import { computeAgreementMatrix } from "./agreement-matrix.js";
import { valueOutcome } from "./format/values.js";
import type { Outcome, Platform, PrimitiveValue, RichCellValue } from "./format/values.js";
import type { TestInfo } from "./catalogue-site/load.js";

// minimal rich cell (isRichGrid needs primitive + engine; see build-v5.test.ts)
const cell = (primitive: PrimitiveValue): RichCellValue =>
  ({ primitive, engine: { platform: "excel" } } as unknown as RichCellValue);
const num = (n: number): Outcome => valueOutcome([[cell({ kind: "number", value: n })]]);
const err = (sentinel: string): Outcome => valueOutcome([[cell({ kind: "error", sentinel })]]);
const capabilitySkip: Outcome = { kind: "skipped", cause: "capability" };

function info(id: string, subject: string): TestInfo {
  const [, name] = id.split("/");
  return { id, ref: id, subject, name, formula: "=…", category: "value", suite: subject.toLowerCase(), expect: undefined, overrides: {} };
}

function build(rows: Array<[string, string, Record<string, Outcome>]>) {
  const tests = new Map<string, TestInfo>();
  const outcomes = new Map<string, Map<Platform, Outcome>>();
  for (const [id, subject, byEngine] of rows) {
    tests.set(id, info(id, subject));
    outcomes.set(id, new Map(Object.entries(byEngine) as [Platform, Outcome][]));
  }
  return computeAgreementMatrix(tests, outcomes);
}

const engine = (r: ReturnType<typeof build>, e: Platform) => r.perEngine.find((s) => s.engine === e)!;
const pairOf = (r: ReturnType<typeof build>, a: Platform, b: Platform) =>
  r.pairwise.find((p) => (p.engineA === a && p.engineB === b) || (p.engineA === b && p.engineB === a))!;

describe("computeAgreementMatrix — verdict-free reporting over observed Outcomes", () => {
  it("uniform: one class, co-classed pair, no fork participation", () => {
    const r = build([["SUM/a", "SUM", { excel: num(3), gsheets: num(3), hyperformula: num(3) }]]);
    expect(r.totalTests).toBe(1);
    expect(r.uniformTests).toBe(1);
    expect(r.forkedTests).toBe(0);
    expect(r.forkShapes).toEqual([]);
    expect(engine(r, "excel")).toMatchObject({ valueTests: 1, forkParticipation: 0, singletonIsolation: 0 });
    const p = pairOf(r, "excel", "gsheets");
    expect(p).toMatchObject({ coCovered: 1, coClassed: 1, differ: 0, coClassPct: 100 });
  });

  it("forked: pairwise splits, the lone engine is a singleton, fork-shape recorded", () => {
    // excel/gsheets agree (1); ironcalc differs (2) → 2 classes
    const r = build([["FOO/f", "FOO", { excel: num(1), gsheets: num(1), ironcalc: num(2) }]]);
    expect(r.forkedTests).toBe(1);
    // excel↔gsheets co-class; excel↔ironcalc do not
    expect(pairOf(r, "excel", "gsheets")).toMatchObject({ coCovered: 1, coClassed: 1, coClassPct: 100 });
    expect(pairOf(r, "excel", "ironcalc")).toMatchObject({ coCovered: 1, coClassed: 0, differ: 1, coClassPct: 0 });
    // ironcalc is alone in its class → singleton; excel (class of 2) is not
    expect(engine(r, "ironcalc")).toMatchObject({ forkParticipation: 1, singletonIsolation: 1 });
    expect(engine(r, "excel")).toMatchObject({ forkParticipation: 1, singletonIsolation: 0 });
    expect(r.forkShapes).toHaveLength(1);
    expect(r.forkShapes[0]).toMatchObject({ signature: "excel,gsheets|ironcalc", classCount: 2, testCount: 1 });
  });

  it("error-value forks like any other value (capability gap is separate)", () => {
    // ironcalc errors (a VALUE) → its own class; excel/gsheets agree
    const r = build([["BITAND/b", "BITAND", { excel: num(1), gsheets: num(1), ironcalc: err("#NAME?") }]]);
    expect(r.forkedTests).toBe(1);
    expect(engine(r, "ironcalc").valueTests).toBe(1); // error is a value, in the partition
    expect(engine(r, "ironcalc").noValueTests).toBe(0);
  });

  it("capability gap: skipped{capability} → no-value, excluded from the partition & pairwise denominator", () => {
    const r = build([["QUERY/q", "QUERY", { gsheets: num(5), excel: capabilitySkip }]]);
    expect(r.uniformTests).toBe(1); // only gsheets produced a value
    expect(engine(r, "excel")).toMatchObject({ valueTests: 0, noValueTests: 1, byCapability: { unsupported: 1 } });
    // excel produced no value → the excel/gsheets pair was never co-covered
    expect(pairOf(r, "excel", "gsheets").coCovered).toBe(0);
  });

  it("fork-shapes aggregate across tests by partition signature", () => {
    const split = (id: string): [string, string, Record<string, Outcome>] => [
      id,
      id.split("/")[0],
      { excel: num(1), gsheets: num(1), ironcalc: num(2) },
    ];
    const r = build([split("A/1"), split("B/1"), ["C/1", "C", { excel: num(1), gsheets: num(2) }]]);
    // two tests share "excel,gsheets|ironcalc"; one has the distinct "excel|gsheets"
    const shape = r.forkShapes.find((s) => s.signature === "excel,gsheets|ironcalc")!;
    expect(shape.testCount).toBe(2);
    expect(shape.subjects).toEqual(["A", "B"]);
    expect(r.forkShapes.find((s) => s.signature === "excel|gsheets")!.testCount).toBe(1);
  });
});
