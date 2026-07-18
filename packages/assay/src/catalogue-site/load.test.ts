import { describe, expect, it } from "vitest";
import { loadDvs, loadTests } from "./load.js";

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
