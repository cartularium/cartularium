import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { newRunId, readRows, snapshotCapabilities, validateRunRow } from "./io.js";
import { loadLedgerIndex } from "./index-read.js";
import { engineRunInfo } from "./record.js";
import { LedgerWriter, RESULTS_FILE, RUNS_FILE, readLedger } from "./writer.js";
import type { EngineRunInfo } from "./types.js";

const ENGINE: EngineRunInfo = {
  driver: "@cartularium/drivers@0.1.0+abc123",
  engine_version: null,
  capabilities: `sha256:${"0".repeat(64)}`,
  conditions: { locale: "en-US", calc: { epoch: "1899-12-30", iterative: false, precision: "full" } },
  capacity_events: [],
};

function withoutCapabilities(info: EngineRunInfo): EngineRunInfo {
  const copy = { ...info };
  delete copy.capabilities;
  return copy;
}

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
  it("accepts a serialized schema-1 run row with capabilities", () => {
    const line = '{"row":"run","run_id":"2026-07-18T14:00:00Z.0001","seq":1,"trigger":"manual","scope":{"kind":"full"},"corpus_commit":"deadbeef","engines":{"gsheets":{"driver":"@cartularium/drivers@0.1.0+abc123","engine_version":null,"capabilities":"sha256:0000000000000000000000000000000000000000000000000000000000000000","conditions":{"locale":"en-US","calc":{"epoch":"1899-12-30","iterative":false,"precision":"full"}},"capacity_events":[]}}}\n';
    writeFileSync(join(dir, RUNS_FILE), line);

    const [run] = readLedger(dir).runs;
    expect(run.run_id).toBe("2026-07-18T14:00:00Z.0001");
    expect("schema" in run).toBe(false);
  });

  it("rejects a schema-1 run row missing capabilities", () => {
    expect(() => validateRunRow({
      row: "run",
      run_id: "2026-07-18T14:00:00Z.0001",
      seq: 1,
      trigger: "manual",
      scope: { kind: "full" },
      corpus_commit: "deadbeef",
      engines: { gsheets: withoutCapabilities(ENGINE) },
    })).toThrow("ledger: run 2026-07-18T14:00:00Z.0001: schema-1 row missing capabilities for gsheets");
  });

  it("accepts a schema-2 run row without capabilities", () => {
    expect(validateRunRow({
      row: "run",
      schema: 2,
      run_id: "2026-07-18T14:00:00Z.0002",
      seq: 2,
      trigger: "manual",
      scope: { kind: "full" },
      corpus_commit: "deadbeef",
      engines: { gsheets: withoutCapabilities(ENGINE) },
    })).toMatchObject({ schema: 2 });
  });

  it("rejects malformed schema-2 capabilities", () => {
    expect(() => validateRunRow({
      row: "run",
      schema: 2,
      run_id: "2026-07-18T14:00:00Z.0002",
      seq: 2,
      trigger: "manual",
      scope: { kind: "full" },
      corpus_commit: "deadbeef",
      engines: { gsheets: { ...ENGINE, capabilities: "not-a-sha" } },
    })).toThrow(/schema-2 row has malformed capabilities for gsheets/);
  });

  it("rejects unknown run-row schemas", () => {
    expect(() => validateRunRow({
      row: "run",
      schema: 3,
      run_id: "2026-07-18T14:00:00Z.0003",
      engines: {},
    })).toThrow("ledger: run 2026-07-18T14:00:00Z.0003: unknown run-row schema 3");
  });

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

  it("stamps schema 2 when opening a run", () => {
    const w = new LedgerWriter(dir);
    openRun(w);
    w.release();

    const [run] = readLedger(dir).runs;
    expect((run as { schema?: unknown }).schema).toBe(2);
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

  it("indexes orphan lifecycle rows while skipping malformed rows and corrections", () => {
    writeFileSync(join(dir, RUNS_FILE), [
      JSON.stringify({
        row: "complete",
        run_id: "orphan",
        at: "2026-07-18T14:05:00Z",
        observed: {},
        counts: {},
      }),
      JSON.stringify({ row: "evidence", run_id: "orphan", commit: "cafe", files: {} }),
      JSON.stringify({ row: "complete", run_id: "malformed" }),
      JSON.stringify({ row: "correction", corrects: "orphan", replaces: {} }),
      "",
    ].join("\n"));

    const index = loadLedgerIndex(join(dir, RUNS_FILE));
    expect(index.get("orphan")).toMatchObject({
      complete: { row: "complete" },
      evidence: { row: "evidence", commit: "cafe" },
    });
    expect(index.get("orphan")?.run).toBeUndefined();
    expect(index.has("malformed")).toBe(false);
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

  it("omits capabilities when the source directory does not exist", () => {
    const driversDir = mkdtempSync(join(dir, "drivers-"));
    writeFileSync(join(driversDir, "package.json"), '{"version":"0.1.0"}');
    expect(snapshotCapabilities(join(driversDir, "capabilities"), dir)).toBeNull();

    const info = engineRunInfo({
      driversDir,
      historyDir: dir,
      corpusCommit: "deadbeef",
      engineVersion: null,
      conditions: ENGINE.conditions,
    });
    expect("capabilities" in info).toBe(false);
  });
});
