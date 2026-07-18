import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREVIEW_WORKER_PLATFORMS,
  parsePreviewWorkerPlatforms,
} from "./preview-worker.js";

describe("preview worker platform selection", () => {
  it("defaults to the production review lane", () => {
    expect(DEFAULT_PREVIEW_WORKER_PLATFORMS).toEqual(["excel", "gsheets"]);
    expect(parsePreviewWorkerPlatforms(undefined)).toEqual(["excel", "gsheets"]);
  });

  it("honors explicit platform lists", () => {
    expect(parsePreviewWorkerPlatforms("hyperformula")).toEqual(["hyperformula"]);
  });
});
