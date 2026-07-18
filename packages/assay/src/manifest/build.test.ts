import { describe, expect, it } from "vitest";
import { buildManifest } from "./build.js";

describe("buildManifest", () => {
  it("emits manifest v4 keyed by public refs", () => {
    const manifest = buildManifest({
      generatedAt: "2026-05-10T00:00:00.000Z",
      dvs: [],
      fixtures: new Map([
        [
          "sha256:abc",
          new Map([
            ["excel", { result: [[3]] }],
            ["gsheets", { result: [[3]] }],
          ]),
        ],
      ]),
      tests: new Map([
        [
          "SUM/basic-addition",
          {
            id: "SUM/basic-addition",
            ref: "SUM/basic-addition",
            subject: "SUM",
            subjectRef: "SUM",
            name: "basic-addition",
            semanticHash: "sha256:abc",
            formula: "=SUM(1,2)",
            category: "value",
            suite: "math",
            expect: 3,
            aliases: ["SUM/add-basic"],
            overrides: {},
          },
        ],
      ]),
    });

    expect(manifest.version).toBe(4);
    expect(manifest.tests["SUM/basic-addition"]).toMatchObject({
      ref: "SUM/basic-addition",
      hash: "sha256:abc",
      url: "/test/SUM/basic-addition/",
    });
    expect(manifest.functions.SUM.tests).toEqual(["SUM/basic-addition"]);
    expect(manifest.hashes["sha256:abc"]).toBe("SUM/basic-addition");
    expect(manifest.aliases).toEqual({
      "SUM/add-basic": { target: "SUM/basic-addition", kind: "public-ref" },
    });
    expect(manifest.tombstones).toEqual({});
  });

  it("uses semantic hashes when classifying fixture results", () => {
    const manifest = buildManifest({
      generatedAt: "2026-05-10T00:00:00.000Z",
      dvs: [
        {
          id: "DV-0001",
          summary: "SUM diverges",
          cause: "error-code",
          category: "error-code",
          engines: ["excel"],
          behavior: { signature: "excel differs" },
          testCount: 1,
          subjects: ["SUM"],
          tests: ["SUM/basic-addition"],
          seeded: "2026-05-10",
          lastConfirmed: "2026-05-10",
        },
      ],
      fixtures: new Map([
        [
          "sha256:abc",
          new Map([
            ["excel", [[{ error: "#VALUE!" }]]],
            ["gsheets", [[3]]],
          ]),
        ],
      ]),
      tests: new Map([
        [
          "SUM/basic-addition",
          {
            id: "SUM/basic-addition",
            ref: "SUM/basic-addition",
            subject: "SUM",
            subjectRef: "SUM",
            name: "basic-addition",
            semanticHash: "sha256:abc",
            formula: "=SUM(1,2)",
            category: "value",
            suite: "math",
            expect: 3,
            overrides: {},
          },
        ],
      ]),
    });

    expect(manifest.functions.SUM.engines.excel).toEqual({
      status: "partial",
      via: "DV-0001",
    });
    expect(manifest.tests["SUM/basic-addition"].engines).toMatchObject({
      excel: "diverge",
      gsheets: "match",
    });
  });
});
