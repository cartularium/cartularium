import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { newRunId, readRows, snapshotCapabilities } from "./io.js";
import { LedgerWriter, RESULTS_FILE, RUNS_FILE, readLedger } from "./writer.js";
import type { EngineRunInfo } from "./types.js";

const ENGINE: EngineRunInfo = {
  driver: "@cartularium/drivers@0.1.0+abc123",
  engine_version: null,
  capabilities: `sha256:${"0".repeat(64)}`,
  conditions: { locale: "en-US", calc: { epoch: "1899-12-30", iterative: false, precision: "full" } },
  capacity_events: [],
};

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "assay-ledger-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

function openRun(w: LedgerWriter) {
  return w.openRun({
    start: new Date("2026-07-18T14:00:00.000Z"),
    trigger: "manual",
    scope: { kind: "full" },
    corpus_commit: "deadbeef",
    engines: { gsheets: ENGINE },
  });
}

describe("ledger", () => {
  it("run ids are instant-plus-suffix and branch-merge safe", () => {
    const a = newRunId(new Date("2026-07-18T14:00:00.000Z"));
    const b = newRunId(new Date("2026-07-18T14:00:00.000Z"));
    expect(a).toMatch(/^2026-07-18T14:00:00Z\.[0-9a-f]{4}$/);
    expect(a).not.toBe(b);
  });

  it("round-trips a full run lifecycle", () => {
    const w = new LedgerWriter(dir);
    const run = openRun(w);
    expect(run.seq).toBe(1);
    const [res] = w.appendResults([{
      run_id: run.run_id, case: "op:add/addition", stimulus: `sha256:${"1".repeat(64)}`,
      engine: "gsheets", at: "2026-07-18T14:00:01Z", outcome: "value",
      fingerprint: `sha256:${"2".repeat(64)}`, fpv: 1,
    }]);
    w.complete(
      run.run_id,
      "2026-07-18T14:05:00Z",
      { gsheets: { from: "2026-07-18T14:00:00Z", to: "2026-07-18T14:05:00Z" } },
      { gsheets: { selected: 1, attempted: 1, recorded: 1, outcomes: { value: 1 } } },
    );
    w.appendEvidence({ run_id: run.run_id, commit: "cafe", files: { "fixtures/arithmetic/gsheets.json": `sha256:${"3".repeat(64)}` } });
    w.release();

    const view = readLedger(dir);
    expect(view.runs).toHaveLength(1);
    expect(view.results).toEqual([res]);
    expect(view.incomplete).toEqual([]);
    expect(view.evidence[0].commit).toBe("cafe");
    expect(view.tornTail).toBe(false);

    const w2 = new LedgerWriter(dir);
    expect(w2.nextSeq()).toBe(2);
    w2.release();
  });

  it("a run without a completion row is visibly incomplete", () => {
    const w = new LedgerWriter(dir);
    const run = openRun(w);
    w.release();
    expect(readLedger(dir).incomplete).toEqual([run.run_id]);
  });

  it("recovers from a torn final line without losing prior rows", () => {
    const w = new LedgerWriter(dir);
    openRun(w);
    w.release();
    appendFileSync(join(dir, RUNS_FILE), '{"row":"complete","run_id":"2026-'); // crash mid-append
    const view = readLedger(dir);
    expect(view.runs).toHaveLength(1);
    expect(view.tornTail).toBe(true);
    expect(view.incomplete).toHaveLength(1); // the torn completion never landed
  });

  it("refuses interior corruption", () => {
    writeFileSync(join(dir, RUNS_FILE), 'not json\n{"row":"run"}\n');
    expect(() => readRows(join(dir, RUNS_FILE))).toThrow(/interior/);
  });

  it("one writer at a time", () => {
    const w = new LedgerWriter(dir);
    expect(() => new LedgerWriter(dir)).toThrow(/locked/);
    w.release();
    const w2 = new LedgerWriter(dir);
    w2.release();
  });

  it("results require an open run in this writer", () => {
    const w = new LedgerWriter(dir);
    expect(() =>
      w.appendResults([{
        run_id: "2026-07-18T00:00:00Z.ffff", case: "x/y", stimulus: `sha256:${"1".repeat(64)}`,
        engine: "gsheets", at: "t", outcome: "value", fingerprint: `sha256:${"2".repeat(64)}`, fpv: 1,
      }]),
    ).toThrow(/not open/);
    w.release();
  });

  it("corrections name the erroneous row and leave it in place", () => {
    const w = new LedgerWriter(dir);
    const run = openRun(w);
    w.appendCorrection({
      corrects: run.run_id, at: "2026-07-18T15:00:00Z",
      per: "decision-record:example", replaces: { trigger: "ci" },
    });
    w.release();
    const view = readLedger(dir);
    expect(view.runs).toHaveLength(1); // original stays
    expect(view.corrections[0].corrects).toBe(run.run_id);
  });

  it("capabilities snapshots are content-addressed with a materialized referent", () => {
    const caps = mkdtempSync(join(tmpdir(), "assay-caps-"));
    writeFileSync(join(caps, "gsheets.json"), '{"SUM":"native"}');
    const hash = snapshotCapabilities(caps, dir);
    expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/);
    const stored = readFileSync(join(dir, "capabilities", `${hash.slice(7)}.json`), "utf8");
    expect(JSON.parse(stored)).toEqual({ "gsheets.json": { SUM: "native" } });
    // deterministic: same content, same address
    expect(snapshotCapabilities(caps, dir)).toBe(hash);
    rmSync(caps, { recursive: true, force: true });
  });
});
