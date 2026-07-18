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

  it("resolves every authored scope ref-set ref and subjectIn subject in the current corpus", () => {
    const tests = loadTests("tests");
    const subjects = new Set([...tests.values()].map((t) => t.subject));
    const problems = loadDvs("divergences").flatMap((dv) =>
      (dv.scope ?? []).flatMap((clause) => {
        if (clause.kind === "ref-set") {
          return clause.refs.filter((r) => !tests.has(r)).map((r) => `${dv.id}: ref ${r}`);
        }
        return (clause.query.subjectIn ?? [])
          .filter((s) => !subjects.has(s))
          .map((s) => `${dv.id}: subject ${s}`);
      }),
    );
    expect(problems).toEqual([]);
  });
});

describe("DV scope parsing (yaml `scope:` sugar, 3f)", () => {
  function loadOne(yaml: string): ReturnType<typeof loadDvs> {
    const dir = mkdtempSync(join(tmpdir(), "assay-dv-"));
    writeFileSync(join(dir, "DV-9999.yaml"), yaml);
    return loadDvs(dir);
  }
  const base = "id: DV-9999\nsummary: s\ncause: precision\ncategory: value\ntests:\n  - A/a\n";

  it("parses a ref-set clause and a predicate clause", () => {
    const [dv] = loadOne(base + "scope:\n  - refs: [A/a, B/b]\n  - tags: [complex-number]\n    subjectIn: [IMSUM]\n");
    expect(dv.scope).toEqual([
      { kind: "ref-set", refs: ["A/a", "B/b"] },
      { kind: "predicate", query: { tags: ["complex-number"], subjectIn: ["IMSUM"] } },
    ]);
  });

  it("omits scope when the yaml has none (migration default applies downstream)", () => {
    const [dv] = loadOne(base);
    expect(dv.scope).toBeUndefined();
  });

  it("rejects a clause mixing refs with predicate keys", () => {
    expect(() => loadOne(base + "scope:\n  - refs: [A/a]\n    tags: [x]\n")).toThrow(/refs XOR/);
  });

  it("rejects unknown clause keys (observed dims are not yaml-authorable)", () => {
    expect(() => loadOne(base + "scope:\n  - enginesAlone: [pycel]\n")).toThrow(/unknown clause key/);
  });

  it("rejects an empty scope list and empty string tokens", () => {
    expect(() => loadOne(base + "scope: []\n")).toThrow(/non-empty list of clauses/);
    expect(() => loadOne(base + 'scope:\n  - refs: [""]\n')).toThrow(/non-empty strings/);
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
