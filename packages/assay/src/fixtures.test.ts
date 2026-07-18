import { describe, expect, it } from "vitest";
import type { FixtureFile } from "./fixtures.js";
import type { TestSuite } from "./format/catalogue.js";
import { caseKey } from "./identity/index.js";
import { liftScalarGrid } from "@cartularium/drivers";
import { valueOutcome } from "./format/values.js";
import { runFromFixtures } from "./runner.js";

describe("caseKey", () => {
  it("uses v3 semantic hashes and falls back to v2 ids", () => {
    expect(caseKey({ id: "math/abc123" })).toBe("math/abc123");
    expect(caseKey({ id: "SUM/basic", semanticHash: "sha256:deadbeef" })).toBe("sha256:deadbeef");
  });

  it("reads fixture results by semantic hash while reporting public ids", () => {
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
    const fixture: FixtureFile = {
      platform: "excel",
      generatedAt: "2026-05-10T00:00:00.000Z",
      results: {
        [semanticHash]: { outcome: valueOutcome(liftScalarGrid([[2]], "excel")) },
      },
    };

    const result = runFromFixtures(suite, { excel: fixture });

    expect(result.summary.failed).toBe(0);
    expect(result.results[0].passed).toBe(true);
    expect(result.results[0].test.id).toBe("SUM/basic-renamed");
  });
});
