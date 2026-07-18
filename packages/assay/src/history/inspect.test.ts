import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendJsonl } from "./io.js";
import { inspectRun, listSince } from "./inspect.js";
import type { DvEventRow, FixtureChangeRow, RunRow } from "./types.js";

const mkRun = (over: Partial<RunRow>): RunRow => ({
  run_id: "2026-04-26T12:00:00Z.aaaa",
  trigger: "manual",
  engine_versions: { ironcalc: "0.7.0", hyperformula: "3.2.0" },
  capabilities_hash: "sha256:abcd",
  test_count: 1952,
  dv_count: 244,
  fixture_change_count: 12,
  ...over,
});

const mkEvent = (over: Partial<DvEventRow>): DvEventRow => ({
  run_id: "2026-04-26T12:00:00Z.aaaa",
  ts: "2026-04-26T12:00:00Z",
  dv_id: "DV-0001",
  event: "confirmed",
  test_count: 5,
  delta: 0,
  fingerprint: "missing-function__pycel__abc",
  ...over,
});

const mkChange = (over: Partial<FixtureChangeRow>): FixtureChangeRow => ({
  run_id: "2026-04-26T12:00:00Z.aaaa",
  ts: "2026-04-26T12:00:00Z",
  test_id: "math.basic.001",
  engine: "gsheets",
  from_hash: null,
  to_hash: "sha256:aaaa",
  from_value: null,
  to_value: 42,
  ...over,
});

describe("inspectRun", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "hinsp-"));
    appendJsonl(join(dir, "runs.jsonl"), [
      mkRun({ run_id: "r1", note: "first" }),
      mkRun({ run_id: "r2", note: "second" }),
    ]);
    appendJsonl(join(dir, "dv_events.jsonl"), [
      mkEvent({ run_id: "r1", dv_id: "DV-0001", event: "confirmed" }),
      mkEvent({ run_id: "r1", dv_id: "DV-0002", event: "grown", delta: 3, test_count: 8 }),
      mkEvent({ run_id: "r1", dv_id: "DV-0003", event: "vanished", delta: -2, test_count: 0 }),
      mkEvent({ run_id: "r2", dv_id: "DV-0001", event: "confirmed" }),
    ]);
    appendJsonl(join(dir, "fixture_changes.jsonl"), [
      mkChange({ run_id: "r1", engine: "gsheets" }),
      mkChange({ run_id: "r1", engine: "excel" }),
      mkChange({ run_id: "r1", engine: "gsheets", test_id: "math.002" }),
      mkChange({ run_id: "r2", engine: "ironcalc" }),
    ]);
  });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it("loads only the requested run's events + changes", () => {
    const r = inspectRun("r1", dir);
    expect(r.run.run_id).toBe("r1");
    expect(r.events_by_kind).toEqual({ confirmed: 1, grown: 1, vanished: 1 });
    expect(r.fixture_changes_total).toBe(3);
    expect(r.fixture_changes_by_engine).toEqual({ gsheets: 2, excel: 1 });
  });

  it("resolves 'latest' to the last run", () => {
    expect(inspectRun("latest", dir).run.run_id).toBe("r2");
  });

  it("resolves a unique prefix", () => {
    expect(inspectRun("r1", dir).run.run_id).toBe("r1");
  });

  it("throws on unknown run_id", () => {
    expect(() => inspectRun("nope", dir)).toThrow(/no run matches/);
  });

  it("throws on empty history when asking for latest", () => {
    rmSync(dir, { recursive: true, force: true });
    dir = mkdtempSync(join(tmpdir(), "hinsp-"));
    expect(() => inspectRun("latest", dir)).toThrow(/no runs in history/);
  });

  it("groups events by kind for the run", () => {
    const r = inspectRun("r1", dir);
    const kinds = r.events_grouped.map((g) => g.kind).sort();
    expect(kinds).toEqual(["confirmed", "grown", "vanished"]);
  });

  it("samples fixture changes (default 5)", () => {
    const r = inspectRun("r1", dir);
    expect(r.fixture_change_sample.length).toBeLessThanOrEqual(5);
    expect(r.fixture_change_sample.every((c) => c.run_id === "r1")).toBe(true);
  });
});

describe("listSince", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "hsince-"));
    appendJsonl(join(dir, "runs.jsonl"), [
      mkRun({ run_id: "2026-04-25T12:00:00Z.aaaa" }),
      mkRun({ run_id: "2026-04-26T12:00:00Z.bbbb" }),
      mkRun({ run_id: "2026-04-27T12:00:00Z.cccc" }),
    ]);
  });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it("returns runs at or after the cutoff (lexicographic = chronological)", () => {
    const r = listSince("2026-04-26", dir);
    expect(r.map((x) => x.run_id)).toEqual([
      "2026-04-26T12:00:00Z.bbbb",
      "2026-04-27T12:00:00Z.cccc",
    ]);
  });

  it("returns empty when no runs match", () => {
    expect(listSince("2030-01-01", dir)).toEqual([]);
  });

  it("returns all runs for an early cutoff", () => {
    expect(listSince("2020-01-01", dir).length).toBe(3);
  });
});
