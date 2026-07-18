import { readFileSync, writeFileSync } from "node:fs";
import {
  PREVIEW_RESULT_CONTRACT_VERSION,
  type AssayPreviewInput,
  type AssayPreviewResult,
  runAssayPreview,
  stringField,
} from "../preview.js";
import { values } from "./shared.js";

export async function preview(args: string[]): Promise<void> {
  const [inputPath, outputPath] = args;
  if (!inputPath) {
    console.error("usage: assay preview <input.json> [output.json]");
    process.exitCode = 1;
    return;
  }

  let input: AssayPreviewInput | null = null;
  let result: AssayPreviewResult;
  try {
    input = JSON.parse(readFileSync(inputPath, "utf8")) as AssayPreviewInput;
    const runnerId = typeof values["runner-id"] === "string" ? values["runner-id"] : undefined;
    result = await runAssayPreview(input, { runnerId });
  } catch (e) {
    result = runnerFailureResult(input, e);
  }

  const json = `${JSON.stringify(result, null, 2)}\n`;

  if (outputPath) writeFileSync(outputPath, json);
  else process.stdout.write(json);

  if (result.diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    process.exitCode = 1;
  }
}

function runnerFailureResult(input: AssayPreviewInput | null, error: unknown): AssayPreviewResult {
  const now = new Date().toISOString();
  return {
    contractVersion: PREVIEW_RESULT_CONTRACT_VERSION,
    jobId: stringField(input, "jobId"),
    draftId: stringField(input, "draftId"),
    candidateHash: stringField(input, "candidateHash"),
    runnerId: "local-preview",
    startedAt: now,
    completedAt: now,
    platforms: {},
    diagnostics: [{
      severity: "error",
      field: "runner",
      message: error instanceof Error ? error.message : String(error),
    }],
  };
}
