import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadFixtureEntries, loadTests } from "../catalogue-site/load.js";
import type { FixtureEntry } from "../fixtures.js";
import {
  buildPublicationManifest,
  PublicationGuardError,
  type PublicationFailureClass,
} from "./manifest.js";

const RUN_ID = "2026-07-19T00:00:00Z.test";

function valueEntry(provenance: Partial<FixtureEntry> = {}): Record<string, unknown> {
  return {
    outcome: {
      kind: "value",
      grid: [[{
        primitive: { kind: "number", value: 1 },
        engine: { platform: "excel" },
      }]],
    },
    ...provenance,
  };
}

function runRow(): Record<string, unknown> {
  return {
    row: "run",
    schema: 2,
    run_id: RUN_ID,
    seq: 1,
    trigger: "manual",
    scope: { kind: "full" },
    corpus_commit: "corpus-commit",
    engines: {
      excel: {
        driver: "excel@1+driver-commit",
        engine_version: "16.0",
        conditions: {
          locale: "en-US",
          calc: { epoch: "1900", iterative: false, precision: "full" },
        },
        capacity_events: [],
      },
    },
  };
}

function completionRow(): Record<string, unknown> {
  return {
    row: "complete",
    run_id: RUN_ID,
    at: "2026-07-19T00:01:00.000Z",
    observed: {},
    counts: {},
  };
}

function evidenceRow(): Record<string, unknown> {
  return {
    row: "evidence",
    run_id: RUN_ID,
    commit: "evidence-commit",
    files: {},
  };
}

function corpus(
  entry: Record<string, unknown>,
  ledgerRows: Record<string, unknown>[],
): string {
  const root = mkdtempSync(join(tmpdir(), "assay-manifest-"));
  mkdirSync(join(root, "divergences"));
  mkdirSync(join(root, "tests"));
  mkdirSync(join(root, "fixtures", "math"), { recursive: true });
  mkdirSync(join(root, "history"));
  writeFileSync(
    join(root, "tests", "math.yaml"),
    [
      "schemaVersion: 2",
      "tests:",
      "  - id: SUM/basic",
      "    subject: SUM",
      "    formula: =1",
      "    category: value",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(root, "fixtures", "math", "excel.json"),
    JSON.stringify({
      schemaVersion: 2,
      platform: "excel",
      generatedAt: "2026-07-19T00:01:00.000Z",
      results: { "SUM/basic": entry },
    }),
  );
  writeFileSync(
    join(root, "history", "runs.jsonl"),
    ledgerRows.map((row) => JSON.stringify(row)).join("\n") + "\n",
  );
  return root;
}

function build(root: string) {
  return buildPublicationManifest({
    catalogueDir: join(root, "divergences"),
    testsDir: join(root, "tests"),
    fixturesDir: join(root, "fixtures"),
    ledgerPath: join(root, "history", "runs.jsonl"),
    generatedAt: "2026-07-19T01:00:00.000Z",
  });
}

function expectFailure(root: string, kind: PublicationFailureClass): PublicationGuardError {
  try {
    build(root);
  } catch (error) {
    expect(error).toBeInstanceOf(PublicationGuardError);
    const guard = error as PublicationGuardError;
    expect([...guard.failures.keys()]).toEqual([kind]);
    expect(guard.failures.get(kind)).toEqual(["SUM/basic/excel"]);
    expect(guard.lines()[0]).toContain(`${kind}: 1`);
    return guard;
  }
  throw new Error("expected publication guard failure");
}

describe("manifest publication guard", () => {
  it("builds a clean corpus and publishes the referenced run provenance", () => {
    const root = corpus(
      valueEntry({ run_id: RUN_ID }),
      [runRow(), completionRow(), evidenceRow()],
    );

    const manifest = build(root);

    expect(manifest.tests["SUM/basic"].engines.excel).toEqual({ capability: "value", class: 0 });
    expect(manifest.provenance).toEqual({
      runs: [{
        run_id: RUN_ID,
        evidence_commit: "evidence-commit",
        engines: {
          excel: {
            driver: "excel@1+driver-commit",
            engine_version: "16.0",
            conditions: {
              locale: "en-US",
              calc: { epoch: "1900", iterative: false, precision: "full" },
            },
          },
        },
      }],
    });
  });

  it("rejects a pre-ledger entry", () => {
    const root = corpus(
      valueEntry({ preLedger: true, run_id: null }),
      [runRow(), completionRow(), evidenceRow()],
    );
    expectFailure(root, "preledger");
  });

  it("rejects an entry with a null run id", () => {
    const root = corpus(
      valueEntry({ run_id: null }),
      [runRow(), completionRow(), evidenceRow()],
    );
    expectFailure(root, "unjoined");
  });

  it("rejects a run id whose ledger entry has no run row", () => {
    const root = corpus(
      valueEntry({ run_id: RUN_ID }),
      [completionRow(), evidenceRow()],
    );
    expectFailure(root, "unknown-run");
  });

  it("rejects a run without a completion row", () => {
    const root = corpus(
      valueEntry({ run_id: RUN_ID }),
      [runRow(), evidenceRow()],
    );
    expectFailure(root, "incomplete-run");
  });

  it("rejects a completed run without an evidence row", () => {
    const root = corpus(
      valueEntry({ run_id: RUN_ID }),
      [runRow(), completionRow()],
    );
    expectFailure(root, "no-evidence-row");
  });

  it("lifts a legacy entry without synthesizing provenance, then rejects it as unjoined", () => {
    const root = corpus({ result: [[1]] }, [runRow(), completionRow(), evidenceRow()]);
    const tests = loadTests(join(root, "tests"));
    const entries = loadFixtureEntries(join(root, "fixtures"), tests);
    const entry = entries.get("SUM/basic")?.get("excel");

    expect(entry?.outcome).toMatchObject({
      kind: "value",
      grid: [[{ primitive: { kind: "number", value: 1 } }]],
    });
    expect(entry).not.toHaveProperty("run_id");
    expect(entry).not.toHaveProperty("preLedger");
    expectFailure(root, "unjoined");
  });
});
