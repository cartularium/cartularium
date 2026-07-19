import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { preview } from "./commands/preview.js";
import { computeCandidateHash, runAssayPreview, type AssayPreviewInput } from "./preview.js";

function previewInput(): AssayPreviewInput {
  const input: AssayPreviewInput = {
    contractVersion: 1,
    jobId: "job-local-1",
    draftId: "draft-local-1",
    ownerId: "user-local-1",
    candidateHash: "",
    requestedPlatforms: ["hyperformula"],
    candidate: {
      id: "sum-two-values",
      subject: "SUM",
      formula: "=SUM(2,2)",
      category: "value",
      expect: 4,
      tags: ["preview-local"],
    },
    createdAt: "2026-05-08T00:00:00.000Z",
  };
  input.candidateHash = computeCandidateHash(input);
  return input;
}

describe("assay preview", () => {
  it("runs a normalized candidate through hyperformula", async () => {
    const result = await runAssayPreview(previewInput(), { runnerId: "test-runner" });

    expect(result.runnerId).toBe("test-runner");
    expect(result.diagnostics).toEqual([]);
    expect(result.platforms.hyperformula).toMatchObject({
      state: "succeeded",
      result: [[4]],
      passed: true,
      expected: [[4]],
    });
  });

  it("runs the preview command against a checked-in sample input", async () => {
    const dir = mkdtempSync(join(tmpdir(), "assay-preview-command-"));
    const outputPath = join(dir, "result.json");

    await preview(["test-fixtures/preview/sum.json", outputPath]);

    const saved = JSON.parse(readFileSync(outputPath, "utf8")) as Awaited<ReturnType<typeof runAssayPreview>>;
    expect(saved.jobId).toBe("fixture-sum");
    expect(saved.diagnostics).toEqual([]);
    expect(saved.platforms.hyperformula).toMatchObject({
      state: "succeeded",
      result: [[4]],
      passed: true,
    });
  });

  it("preview command writes runner-failure JSON when input parsing throws", async () => {
    const dir = mkdtempSync(join(tmpdir(), "assay-preview-command-failure-"));
    const inputPath = join(dir, "input.json");
    const outputPath = join(dir, "result.json");

    writeFileSync(inputPath, "{not json");
    const priorExitCode = process.exitCode;
    process.exitCode = undefined;
    try {
      await preview([inputPath, outputPath]);
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = priorExitCode;
    }

    const saved = JSON.parse(readFileSync(outputPath, "utf8")) as Awaited<ReturnType<typeof runAssayPreview>>;
    expect(saved.jobId).toBe("");
    expect(saved.platforms).toEqual({});
    expect(saved.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "runner", severity: "error" }),
    ]));
  });

  it("supports platform formula maps with grid values", async () => {
    const input = previewInput();
    input.candidate.formula = {
      hyperformula: "=SUM(A1,B1)",
      excel: "=SUM(A1,B1)",
    };
    input.candidate.grid = {
      A1: 2,
      B1: 2,
    };
    input.candidateHash = computeCandidateHash(input);

    const result = await runAssayPreview(input);

    expect(result.diagnostics).toEqual([]);
    expect(result.platforms.hyperformula).toMatchObject({
      state: "succeeded",
      result: [[4]],
      passed: true,
    });
  });

  it("rejects stale candidate hashes", async () => {
    const input = previewInput();
    input.candidate.formula = "=SUM(2,3)";

    const result = await runAssayPreview(input);

    expect(result.platforms).toEqual({});
    expect(result.diagnostics[0]).toMatchObject({
      severity: "error",
      field: "candidateHash",
    });
  });

  it("checked-in fixture hash matches computeCandidateHash output", () => {
    const fixture = JSON.parse(readFileSync("test-fixtures/preview/sum.json", "utf8")) as AssayPreviewInput;
    expect(computeCandidateHash(fixture)).toBe(fixture.candidateHash);
  });

  it("treats tag and feature order as hash-insignificant", () => {
    const a = previewInput();
    a.candidate.tags = ["b", "a"];
    a.candidate.features = ["spill", "array-literal"];

    const b = previewInput();
    b.candidate.tags = ["a", "b"];
    b.candidate.features = ["array-literal", "spill"];

    expect(computeCandidateHash(a)).toBe(computeCandidateHash(b));
  });

  it("returns diagnostics for malformed JSON shapes", async () => {
    const result = await runAssayPreview({
      jobId: "bad-shape",
      draftId: "draft",
      ownerId: "owner",
      candidateHash: "not-a-real-hash",
      requestedPlatforms: "hyperformula",
      candidate: null,
      createdAt: "2026-05-08T00:00:00.000Z",
    } as unknown as AssayPreviewInput);

    expect(result.platforms).toEqual({});
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "requestedPlatforms", severity: "error" }),
      expect.objectContaining({ field: "candidate", severity: "error" }),
    ]));
  });

  it("rejects unknown feature names against the registry", async () => {
    const input = previewInput();
    input.candidate.features = ["regex", "broadcasing"];
    input.candidateHash = computeCandidateHash(input);

    const result = await runAssayPreview(input);

    expect(result.platforms).toEqual({});
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "candidate.features", severity: "error" }),
    ]));
  });

  it("blocks unsupported categories, platforms, and external formulas", async () => {
    const input = previewInput();
    input.requestedPlatforms = ["lattice"];
    input.candidate.category = "unknown";
    input.candidate.formula = '=WEBSERVICE("https://example.com")';
    input.candidateHash = computeCandidateHash(input);

    const result = await runAssayPreview(input);

    expect(result.platforms).toEqual({});
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "requestedPlatforms", severity: "error" }),
      expect.objectContaining({ field: "candidate.category", severity: "error" }),
      expect.objectContaining({ field: "candidate.formula", severity: "error" }),
    ]));
  });

  it("treats gsheets as preview-capable before driver execution", async () => {
    const input = previewInput();
    input.requestedPlatforms = ["gsheets"];
    input.candidate.formula = '=WEBSERVICE("https://example.com")';
    input.candidateHash = computeCandidateHash(input);

    const result = await runAssayPreview(input);

    expect(result.platforms).toEqual({});
    expect(result.diagnostics).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "requestedPlatforms" }),
    ]));
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "candidate.formula", severity: "error" }),
    ]));
  });

  it("isolates per-platform setup failures from sibling platforms", async () => {
    const input = previewInput();
    input.requestedPlatforms = ["gsheets", "hyperformula"];
    input.candidateHash = computeCandidateHash(input);

    const originalEnv = process.env.ASSAY_GOOGLE_TOKEN_JSON;
    process.env.ASSAY_GOOGLE_TOKEN_JSON = "not-json";
    try {
      const result = await runAssayPreview(input);
      expect(result.platforms.gsheets).toMatchObject({ state: "failed" });
      expect(result.platforms.hyperformula).toMatchObject({ state: "succeeded", passed: true });
      expect(result.diagnostics).toEqual(expect.arrayContaining([
        expect.objectContaining({ field: "platforms.gsheets", severity: "error" }),
      ]));
    } finally {
      if (originalEnv === undefined) delete process.env.ASSAY_GOOGLE_TOKEN_JSON;
      else process.env.ASSAY_GOOGLE_TOKEN_JSON = originalEnv;
    }
  });

  it("rejects supportedPlatforms entries that are known but not implemented for preview", async () => {
    const input = previewInput();
    input.requestedPlatforms = ["lattice"];
    input.candidateHash = computeCandidateHash(input);

    const result = await runAssayPreview(input, { supportedPlatforms: ["lattice"] });

    expect(result.platforms).toEqual({});
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "requestedPlatforms",
        severity: "error",
        message: "lattice is not implemented for preview jobs.",
      }),
    ]));
  });
});
