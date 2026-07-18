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
