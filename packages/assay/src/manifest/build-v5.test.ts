import { describe, expect, it } from "vitest";
import { buildManifestV5, type BuildManifestV5Input } from "./build-v5.js";
import { valueOutcome } from "../format/values.js";
import type { Outcome, Platform, PrimitiveValue, RichCellValue } from "../format/values.js";
import type { DvEntry, TestInfo } from "../catalogue-site/load.js";

// minimal Outcome builders. isRichGrid requires both `primitive` and `engine` keys (real
// driver cells always carry engine extras); the stub platform is inert — comparison reads
// only circulating facets (the primitive), never engine extras.
const cell = (primitive: PrimitiveValue): RichCellValue =>
  ({ primitive, engine: { platform: "excel" } } as unknown as RichCellValue);
const num = (n: number): Outcome => valueOutcome([[cell({ kind: "number", value: n })]]);
const err = (sentinel: string): Outcome => valueOutcome([[cell({ kind: "error", sentinel })]]);
const capabilitySkip: Outcome = { kind: "skipped", cause: "capability" };

function test(id: string, subject: string, hash: string): TestInfo {
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
    overrides: {},
  };
}

function dv(id: string, cause: string, engines: string[], tests: string[]): DvEntry {
  return {
    id,
    summary: `${engines[0]}: ${cause}`,
    cause,
    category: "value",
    engines,
    behavior: { signature: "" },
    testCount: tests.length,
    subjects: tests.map((t) => t.split("/")[0]),
    tests,
    seeded: "",
    lastConfirmed: "",
  };
}

function build(
  tests: Array<[TestInfo, Record<string, Outcome>]>,
  dvs: DvEntry[] = [],
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
  const input: BuildManifestV5Input = { dvs, tests: testMap, outcomes, generatedAt: "2026-06-17T00:00:00.000Z" };
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

  it("forked (clear value diff): two classes; a DV on it emits an annotation", () => {
    const m = build(
      [[test("FOO/f", "FOO", "sha256:foo"), { excel: num(1), gsheets: num(2) }]],
      [dv("DV-1", "arg-semantics", ["gsheets"], ["FOO/f"])],
    );
    const e = m.tests["FOO/f"];
    expect(e.partition).toHaveLength(2); // forked
    expect(m.annotations["DV-1"]).toMatchObject({ cause: "arg-semantics", engines: ["gsheets"] });
    expect(m.functions.FOO.forks).toContain("FOO/f");
    expect(m.functions.FOO.forks).toContain("DV-1");
  });

  it("error-value fork: an engine returning #NAME? is a VALUE in its own class; missing-function annotation KEPT", () => {
    const m = build(
      [
        [
          test("BITAND/basic", "BITAND", "sha256:bitand"),
          { excel: num(1), gsheets: num(1), libreoffice: err("#NAME?") },
        ],
      ],
      [dv("DV-2", "missing-function", ["libreoffice"], ["BITAND/basic"])],
    );
    const e = m.tests["BITAND/basic"];
    expect(e.partition).toHaveLength(2); // value-class + error-class
    expect(e.engines.libreoffice).toEqual({ capability: "value", class: expect.any(Number) });
    const libreClass = (e.engines.libreoffice as { class: number }).class;
    expect(e.partition[libreClass].values).toEqual([[[{ c: "error", v: "#NAME?" }]]]);
    // the case forks, so the missing-function DV is a faithful fork annotation → KEPT
    expect(m.annotations["DV-2"]).toMatchObject({ cause: "missing-function", engines: ["libreoffice"] });
  });

  it("capability gap (no value): skipped{capability} → unsupported, NOT in the partition; uniform → missing-function DV DROPPED", () => {
    const m = build(
      [
        [
          test("QUERY/q", "QUERY", "sha256:query"),
          { gsheets: num(5), excel: capabilitySkip },
        ],
      ],
      [dv("DV-3", "missing-function", ["excel"], ["QUERY/q"])],
    );
    const e = m.tests["QUERY/q"];
    expect(e.partition).toHaveLength(1); // only gsheets produced a value → uniform
    expect(e.partition[0].engines).toEqual(["gsheets"]);
    expect(e.engines.excel).toEqual({ capability: "unsupported" });
    // case does NOT fork → the missing-function DV is gated OUT (capability axis carries it)
    expect(m.annotations["DV-3"]).toBeUndefined();
    expect(m.functions.QUERY.engines.excel.status).toBe("missing");
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
});
