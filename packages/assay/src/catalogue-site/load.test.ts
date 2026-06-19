import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadDvs, loadTests, loadFixtureOutcomes, type TestInfo } from "./load.js";
import { valueOutcome } from "../format/values.js";
import type { Outcome, PrimitiveValue, RichCellValue } from "../format/values.js";

describe("catalogue corpus links", () => {
  it("resolves every DV test reference in the current corpus", () => {
    const tests = loadTests("tests");
    const unresolved = loadDvs("divergences").flatMap((dv) =>
      dv.tests
        .filter((testRef) => !tests.has(testRef))
        .map((testRef) => `${dv.id}: ${testRef}`),
    );

    expect(unresolved).toEqual([]);
  });
});

// minimal rich cell — isRichGrid needs both `primitive` and `engine` (see build-v5.test.ts)
const cell = (primitive: PrimitiveValue): RichCellValue =>
  ({ primitive, engine: { platform: "excel" } } as unknown as RichCellValue);

function writeFixture(dir: string, suite: string, platform: string, results: Record<string, unknown>): void {
  const suiteDir = join(dir, suite);
  mkdirSync(suiteDir, { recursive: true });
  writeFileSync(join(suiteDir, `${platform}.json`), JSON.stringify({ platform, generatedAt: "x", results }));
}

function info(id: string, hash: `sha256:${string}`): TestInfo {
  const [subject, name] = id.split("/");
  return { id, ref: id, subject, name, semanticHash: hash, formula: "=…", category: "value", suite: subject.toLowerCase(), expect: undefined, overrides: {} };
}

describe("loadFixtureOutcomes — the §6.6 outcome-aware loader", () => {
  it("reads new-shape `.outcome` through, lifts legacy `.result`, and skips non-platform files", () => {
    const dir = mkdtempSync(join(tmpdir(), "assay-fx-"));
    const hash = "sha256:abc" as const;
    const newOutcome: Outcome = valueOutcome([[cell({ kind: "number", value: 7 })]]);

    // excel carries a new-shape outcome; gsheets carries a legacy scalar grid
    writeFixture(dir, "sum", "excel", { [hash]: { outcome: newOutcome } });
    writeFixture(dir, "sum", "gsheets", { [hash]: { result: [[3]] } });
    // a stray non-platform json must be ignored, not parsed as an engine
    writeFixture(dir, "sum", "notes", { [hash]: { result: [[1]] } });

    const tests = new Map<string, TestInfo>([["SUM/add", info("SUM/add", hash)]]);
    const outcomes = loadFixtureOutcomes(dir, tests);

    // semantic-hash row is exposed under the public ref (key resolution)
    const byEngine = outcomes.get("SUM/add");
    expect(byEngine).toBeDefined();
    expect([...byEngine!.keys()].sort()).toEqual(["excel", "gsheets"]); // `notes` skipped
    expect(byEngine!.get("excel")).toEqual(newOutcome); // new shape read through unchanged
    expect(byEngine!.get("gsheets")?.kind).toBe("value"); // legacy scalar lifted to a value outcome
  });
});
