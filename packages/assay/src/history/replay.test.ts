import { describe, expect, it } from "vitest";
import type { FixtureChangeRow } from "./types.js";
import { replayRows } from "./replay.js";

const row = (over: Partial<FixtureChangeRow>): FixtureChangeRow => ({
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

describe("replayRows", () => {
  it("returns empty state on empty log", () => {
    expect(replayRows([])).toEqual(new Map());
  });

  it("captures a baseline value", () => {
    const state = replayRows([row({})]);
    expect(state.get("math.basic.001|gsheets")).toEqual({
      hash: "sha256:aaaa",
      value: 42,
    });
  });

  it("latest row wins per (test_id, engine) key", () => {
    const state = replayRows([
      row({ run_id: "r1", to_hash: "sha256:aaaa", to_value: 42 }),
      row({ run_id: "r2", from_hash: "sha256:aaaa", to_hash: "sha256:bbbb", from_value: 42, to_value: 99 }),
    ]);
    expect(state.get("math.basic.001|gsheets")).toEqual({
      hash: "sha256:bbbb",
      value: 99,
    });
  });

  it("removes a cell when latest row has to_hash: null", () => {
    const state = replayRows([
      row({ run_id: "r1" }),
      row({ run_id: "r2", from_hash: "sha256:aaaa", to_hash: null, from_value: 42, to_value: null }),
    ]);
    expect(state.has("math.basic.001|gsheets")).toBe(false);
  });

  it("scopes per (test_id, engine) — same test, different engines tracked independently", () => {
    const state = replayRows([
      row({ engine: "gsheets", to_hash: "sha256:aa", to_value: 42 }),
      row({ engine: "excel", to_hash: "sha256:bb", to_value: 43 }),
    ]);
    expect(state.size).toBe(2);
    expect(state.get("math.basic.001|gsheets")?.value).toBe(42);
    expect(state.get("math.basic.001|excel")?.value).toBe(43);
  });

  it("upToRunId truncates replay (lexicographic compare on run_id)", () => {
    const rows = [
      row({ run_id: "2026-04-26T00:00:00Z.aaaa", to_hash: "sha256:aa", to_value: 1 }),
      row({ run_id: "2026-04-27T00:00:00Z.bbbb", from_hash: "sha256:aa", to_hash: "sha256:bb", from_value: 1, to_value: 2 }),
      row({ run_id: "2026-04-28T00:00:00Z.cccc", from_hash: "sha256:bb", to_hash: "sha256:cc", from_value: 2, to_value: 3 }),
    ];
    const stateAtR2 = replayRows(rows, "2026-04-27T00:00:00Z.bbbb");
    expect(stateAtR2.get("math.basic.001|gsheets")?.value).toBe(2);
  });
});
