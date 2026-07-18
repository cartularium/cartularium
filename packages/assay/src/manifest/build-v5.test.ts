import { describe, expect, it } from "vitest";
import { buildManifestV5, type BuildManifestV5Input } from "./build-v5.js";
import { valueOutcome } from "../format/values.js";
import type { Outcome, Platform, PrimitiveValue, RichCellValue } from "../format/values.js";
import type { TestInfo } from "../catalogue-site/load.js";

// minimal Outcome builders. isRichGrid requires both `primitive` and `engine` keys (real
// driver cells always carry engine extras); the stub platform is inert — comparison reads
// only circulating facets (the primitive), never engine extras.
const cell = (primitive: PrimitiveValue): RichCellValue =>
  ({ primitive, engine: { platform: "excel" } } as unknown as RichCellValue);
const num = (n: number): Outcome => valueOutcome([[cell({ kind: "number", value: n })]]);
const err = (sentinel: string): Outcome => valueOutcome([[cell({ kind: "error", sentinel })]]);
const capabilitySkip: Outcome = { kind: "skipped", cause: "capability" };

function test(id: string, subject: string, hash: string, tags?: string[]): TestInfo {
  const [subjectRef, name] = id.split("/");
  return {
    id,
    ref: id,
    subject,
    subjectRef,
    name,
    semanticHash: hash as `sha256:${string}`,
    formula: "=…",
    category: "value",
    suite: subject.toLowerCase(),
    expect: undefined,
    ...(tags ? { tags } : {}),
    overrides: {},
  };
}

function build(
  tests: Array<[TestInfo, Record<string, Outcome>]>,
): ReturnType<typeof buildManifestV5> {
  const testMap = new Map<string, TestInfo>();
  const outcomes = new Map<string, Map<Platform, Outcome>>();
  for (const [t, byEngine] of tests) {
    testMap.set(t.id, t);
    outcomes.set(
      t.semanticHash!,
      new Map(Object.entries(byEngine) as [Platform, Outcome][]),
    );
  }
  const input: BuildManifestV5Input = { dvs: [], tests: testMap, outcomes, generatedAt: "2026-06-17T00:00:00.000Z" };
  return buildManifestV5(input);
}

describe("buildManifestV5 — verdict-free comparison output", () => {
  it("uniform: one agreement-class, every engine value/class:0, set length 1", () => {
    const m = build([
      [test("SUM/add", "SUM", "sha256:sum"), { excel: num(3), gsheets: num(3), hyperformula: num(3) }],
    ]);
    const e = m.tests["SUM/add"];
    expect(e.partition).toHaveLength(1);
    expect(e.partition[0].engines.sort()).toEqual(["excel", "gsheets", "hyperformula"]);
    expect(e.partition[0].values).toEqual([[[{ c: "number", v: 3 }]]]); // set length 1 (exact agreement)
    expect(e.engines).toEqual({
      excel: { capability: "value", class: 0 },
      gsheets: { capability: "value", class: 0 },
      hyperformula: { capability: "value", class: 0 },
    });
    expect(m.version).toBe(5);
    expect(m.rung).toBe("circulating");
  });

  it("forked (clear value diff): two classes; the function's forks list observed case-refs only", () => {
    const m = build([
      [test("FOO/f", "FOO", "sha256:foo"), { excel: num(1), gsheets: num(2) }],
    ]);
    const e = m.tests["FOO/f"];
    expect(e.partition).toHaveLength(2); // forked
    expect(m.functions.FOO.forks).toEqual(["FOO/f"]); // observed case-ref only, no authored ids
    expect(m).not.toHaveProperty("annotations"); // observation-only: no authored layer in the manifest
  });

  it("error-value fork: an engine returning #NAME? is a VALUE in its own class", () => {
    const m = build([
      [
        test("BITAND/basic", "BITAND", "sha256:bitand"),
        { excel: num(1), gsheets: num(1), libreoffice: err("#NAME?") },
      ],
    ]);
    const e = m.tests["BITAND/basic"];
    expect(e.partition).toHaveLength(2); // value-class + error-class
    expect(e.engines.libreoffice).toEqual({ capability: "value", class: expect.any(Number) });
    const libreClass = (e.engines.libreoffice as { class: number }).class;
    expect(e.partition[libreClass].values).toEqual([[[{ c: "error", v: "#NAME?" }]]]);
    expect(m.functions.BITAND.forks).toEqual(["BITAND/basic"]); // the error-value fork is observed
  });

  it("capability gap (no value): skipped{capability} → unsupported, NOT in the partition; uniform → no fork", () => {
    const m = build([
      [test("QUERY/q", "QUERY", "sha256:query"), { gsheets: num(5), excel: capabilitySkip }],
    ]);
    const e = m.tests["QUERY/q"];
    expect(e.partition).toHaveLength(1); // only gsheets produced a value → uniform
    expect(e.partition[0].engines).toEqual(["gsheets"]);
    expect(e.engines.excel).toEqual({ capability: "unsupported" });
    expect(m.functions.QUERY.forks).toEqual([]); // uniform → no fork (capability axis carries the gap)
    expect(m.functions.QUERY.engines.excel.status).toBe("missing");
  });

  it("publishes case-property tags through the R1 hygiene gate (outcome-claim tags dropped)", () => {
    const m = build([
      [
        test("SUM/add", "SUM", "sha256:sum", ["financial", "volatile", "divergence", "excel-only", "coercion-divergence"]),
        { excel: num(3), gsheets: num(3) },
      ],
    ]);
    // case-property tags pass; the three outcome-claim tags are dropped at the relation boundary
    expect(m.tests["SUM/add"].tags).toEqual(["financial", "volatile"]);
  });

  it("omits tags entirely when the gated set is empty (all outcome-claim, or none)", () => {
    const m = build([
      [test("A/a", "A", "sha256:a", ["divergence"]), { excel: num(1), gsheets: num(1) }],
      [test("B/b", "B", "sha256:b"), { excel: num(1), gsheets: num(1) }],
    ]);
    expect(m.tests["A/a"]).not.toHaveProperty("tags"); // only an outcome-claim tag → gated to empty → omitted
    expect(m.tests["B/b"]).not.toHaveProperty("tags"); // no tags authored
  });

  it("tolerance-merged class keeps the distinct values visible (set length > 1)", () => {
    // 1.0 vs 1.0 + 1e-11 — within the 1e-10 relative tolerance → one class, but two distinct values
    const m = build([
      [test("NEAR/n", "NEAR", "sha256:near"), { excel: num(1), gsheets: num(1 + 1e-11) }],
    ]);
    const e = m.tests["NEAR/n"];
    expect(e.partition).toHaveLength(1); // tolerance-merged → uniform
    expect(e.partition[0].values).toHaveLength(2); // but the spread is visible
  });

  it("publishes non-function-subject cases (op:* etc.) in tests, never in functions (D-3f-4 widening)", () => {
    const m = build([
      [test("op:divide/division", "op:/", "sha256:opdiv"), { excel: num(10 / 3), gsheets: err("#DIV/0!") }],
      [test("SUM/add", "SUM", "sha256:sum2"), { excel: num(3), gsheets: num(3) }],
    ]);
    // the operator case is a first-class relation-layer entry — observed truth is not clipped
    const e = m.tests["op:divide/division"];
    expect(e).toBeDefined();
    expect(e.subject).toBe("op:/");
    expect(e.partition.length).toBeGreaterThan(1); // its fork is visible
    // the functions rollup stays function-scoped: no op:* key appears there
    expect(Object.keys(m.functions)).toEqual(["SUM"]);
  });
});
