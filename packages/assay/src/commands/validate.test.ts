import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { FixtureEntry, FixtureFile } from "../fixtures.js";
import { fixturePath, loadFixture } from "../fixtures.js";
import { valueOutcome, type RichGridValue } from "../format/values.js";
import { reconcileValidatedFixture } from "./validate.js";

function writeFixture(root: string): string {
  const testFile = join(root, "tests", "math.yaml");
  mkdirSync(join(root, "tests"), { recursive: true });
  mkdirSync(join(root, "fixtures", "math"), { recursive: true });
  writeFileSync(testFile, "schemaVersion: 3\ntests: []\n");
  writeFileSync(
    fixturePath(testFile, "hyperformula"),
    JSON.stringify(
      {
        platform: "hyperformula",
        generatedAt: "2026-05-10T00:00:00.000Z",
        results: {
          "sha256:case": {
            outcome: valueOutcome([[1]] as unknown as RichGridValue),
            "formula-as-evaluated": "=1",
          },
        },
      },
      null,
      2,
    ) + "\n",
  );
  return testFile;
}

describe("validate fixture reconciliation", () => {
  it("reports drift without writing fixture files during dry-run", () => {
    const root = mkdtempSync(join(tmpdir(), "assay-validate-"));
    const testFile = writeFixture(root);
    const before = readFileSync(fixturePath(testFile, "hyperformula"), "utf8");
    const existing = loadFixture(testFile, "hyperformula") as FixtureFile;
    const fresh: Record<string, FixtureEntry> = {
      "sha256:case": {
        outcome: valueOutcome([[2]] as unknown as RichGridValue),
        "formula-as-evaluated": "=1",
      },
    };

    const drifts = reconcileValidatedFixture({
      testFile,
      platform: "hyperformula",
      existing,
      fresh,
      displayNames: new Map([["sha256:case", "SUM/basic"]]),
      dryRun: true,
      log: () => {},
    });

    expect(drifts).toBe(1);
    expect(readFileSync(fixturePath(testFile, "hyperformula"), "utf8")).toBe(before);
  });
});
