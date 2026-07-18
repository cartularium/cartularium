import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ALL_PLATFORMS, valueOutcome, type RichGridValue } from "../format/values.js";
import { computeAgreementHistory } from "./agreement.js";
import { appendJsonl } from "./io.js";
import type { FixtureChangeRow, RunRow } from "./types.js";

const mkRun = (over: Partial<RunRow>): RunRow => ({
  run_id: "2026-04-26T12:00:00Z.aaaa",
  trigger: "manual",
  engine_versions: {},
  capabilities_hash: "sha256:abcd",
  test_count: 0,
  dv_count: 0,
  fixture_change_count: 0,
  ...over,
});

const mkChange = (over: Partial<FixtureChangeRow>): FixtureChangeRow => ({
  run_id: "2026-04-26T12:00:00Z.aaaa",
  ts: "2026-04-26T12:00:00Z",
  test_id: "math.001",
  engine: "gsheets",
  from_hash: null,
  to_hash: "sha256:abc12345def",
  from_value: null,
  to_value: 42,
  ...over,
});

describe("computeAgreementHistory", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "hagree-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns empty when no runs", () => {
    const r = computeAgreementHistory(dir);
    expect(r.runs).toEqual([]);
    expect(r.engines).toEqual(ALL_PLATFORMS);
  });

  it("emits one snapshot per run with delta scoped to that run", () => {
    appendJsonl(join(dir, "runs.jsonl"), [
      mkRun({ run_id: "r1", test_count: 1 }),
      mkRun({ run_id: "r2", test_count: 1 }),
    ]);
    appendJsonl(join(dir, "fixture_changes.jsonl"), [
      mkChange({ run_id: "r1", test_id: "t1", engine: "gsheets", to_hash: "sha256:aaaaaaaaffff" }),
      mkChange({ run_id: "r1", test_id: "t1", engine: "excel", to_hash: "sha256:aaaaaaaaffff" }),
      mkChange({
        run_id: "r2",
        test_id: "t1",
        engine: "excel",
        to_hash: "sha256:bbbbbbbbeeee",
        from_hash: "sha256:aaaaaaaaffff",
        from_value: 42,
        to_value: 99,
      }),
    ]);

    const ah = computeAgreementHistory(dir);
    expect(ah.runs).toHaveLength(2);
    expect(ah.runs[0].delta).toHaveLength(2);
    expect(ah.runs[1].delta).toHaveLength(1);
    expect(ah.runs[1].delta[0]).toEqual({ tid: "t1", engine: "excel", to: 99 });
  });

  it("emits fixture result values instead of row hashes", () => {
    appendJsonl(join(dir, "runs.jsonl"), [mkRun({ run_id: "r1" })]);
    appendJsonl(join(dir, "fixture_changes.jsonl"), [
      mkChange({
        run_id: "r1",
        to_value: {
          outcome: valueOutcome([[2]] as unknown as RichGridValue),
          "formula-as-evaluated": "=1+1",
        },
      }),
    ]);
    const ah = computeAgreementHistory(dir);
    expect(ah.runs[0].delta[0].to).toEqual([[2]]);
  });

  it("preserves null to_hash on cell-removal rows", () => {
    appendJsonl(join(dir, "runs.jsonl"), [mkRun({ run_id: "r1" })]);
    appendJsonl(join(dir, "fixture_changes.jsonl"), [
      mkChange({
        run_id: "r1",
        to_hash: null,
        from_hash: "sha256:aaaa",
        from_value: 1,
        to_value: null,
      }),
    ]);
    const ah = computeAgreementHistory(dir);
    expect(ah.runs[0].delta[0].to).toBeNull();
  });

  it("strips adapter metadata from historical fixture entries", () => {
    appendJsonl(join(dir, "runs.jsonl"), [mkRun({ run_id: "r1" })]);
    appendJsonl(join(dir, "fixture_changes.jsonl"), [
      mkChange({
        run_id: "r1",
        test_id: "t1",
        engine: "excel",
        to_hash: "sha256:legacy-excel",
        to_value: { outcome: valueOutcome([[2]] as unknown as RichGridValue) },
      }),
      mkChange({
        run_id: "r1",
        test_id: "t1",
        engine: "ironcalc",
        to_hash: "sha256:legacy-ironcalc",
        to_value: {
          outcome: valueOutcome([[2]] as unknown as RichGridValue),
          "formula-as-evaluated": "=1+1",
        },
      }),
    ]);

    const ah = computeAgreementHistory(dir);
    expect(ah.runs[0].delta[0].to).toEqual([[2]]);
    expect(ah.runs[0].delta[1].to).toEqual([[2]]);
  });

  it("derives ts from run_id by stripping the random suffix", () => {
    appendJsonl(join(dir, "runs.jsonl"), [mkRun({ run_id: "2026-04-26T12:00:00Z.aaaa" })]);
    const ah = computeAgreementHistory(dir);
    expect(ah.runs[0].ts).toBe("2026-04-26T12:00:00Z");
  });

  it("emits engines list at the top level", () => {
    appendJsonl(join(dir, "runs.jsonl"), [mkRun({ run_id: "r1" })]);
    const ah = computeAgreementHistory(dir);
    expect(ah.engines).toEqual(ALL_PLATFORMS);
  });
});
