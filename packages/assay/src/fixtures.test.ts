import { describe, expect, it } from "vitest";
import type { FixtureFile } from "./fixtures.js";
import type { TestSuite } from "./format/catalogue.js";
import { caseKey } from "./identity/index.js";
import { liftScalarGrid } from "@cartularium/drivers";
import { valueOutcome } from "./format/values.js";
import { runFromFixtures } from "./runner.js";

describe("caseKey", () => {
  it("is the declared id (stability substrate); semanticHash no longer keys", () => {
    expect(caseKey({ id: "math/abc123" })).toBe("math/abc123");
    expect(caseKey({ id: "SUM/basic", semanticHash: "sha256:deadbeef" })).toBe("SUM/basic");
  });

  it("reads fixture results by declared id; the retired hash key no longer resolves", () => {
    const semanticHash = "sha256:deadbeef";
    const suite: TestSuite = {
      schemaVersion: 3,
      tests: [
        {
          id: "SUM/basic-renamed",
          subject: "SUM",
          subjectRef: "SUM",
          name: "basic-renamed",
          semanticHash,
          category: "value",
          formula: "=SUM(1,1)",
          expect: 2,
        },
      ],
    };
    const byId: FixtureFile = {
      schemaVersion: 2,
      platform: "excel",
      generatedAt: "2026-05-10T00:00:00.000Z",
      results: {
        "SUM/basic-renamed": { outcome: valueOutcome(liftScalarGrid([[2]], "excel")) },
      },
    };
    const good = runFromFixtures(suite, { excel: byId });
    expect(good.summary.failed).toBe(0);
    expect(good.results[0].passed).toBe(true);

    const byHash: FixtureFile = { ...byId, results: { [semanticHash]: byId.results["SUM/basic-renamed"] } };
    const stale = runFromFixtures(suite, { excel: byHash });
    expect(stale.summary.failed).toBe(1); // hibernation retired the hash fallback
  });
});

describe("saveFixture prune semantics", () => {
  it("merges over existing entries by default; prune replaces the snapshot", async () => {
    const { mkdtempSync, rmSync, mkdirSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { saveFixture, loadFixture } = await import("./fixtures.js");

    const dir = mkdtempSync(join(tmpdir(), "fixprune-"));
    try {
      mkdirSync(join(dir, "tests"), { recursive: true });
      const testFile = join(dir, "tests", "suite.yaml");
      writeFileSync(testFile, "");
      const entry = (n: number) => ({ outcome: valueOutcome(liftScalarGrid([[n]], "excel")) });

      // full-regeneration write: two entries
      saveFixture(testFile, "excel", { "A/one": entry(1), "A/two": entry(2) }, { prune: true });

      // partial regeneration (a --tags or --missing run): one entry, default merge
      saveFixture(testFile, "excel", { "A/two": entry(22) });
      let results = loadFixture(testFile, "excel")!.results;
      expect(Object.keys(results).sort()).toEqual(["A/one", "A/two"]); // A/one survives
      expect(results["A/two"].outcome).toEqual(entry(22).outcome); // fresh result wins

      // full regeneration again: prune drops entries absent from the run
      saveFixture(testFile, "excel", { "A/two": entry(2) }, { prune: true });
      results = loadFixture(testFile, "excel")!.results;
      expect(Object.keys(results)).toEqual(["A/two"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
