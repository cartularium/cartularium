// `assay ledger` — the stability-substrate ledger's CLI face.
//   --list                 runs with completion status
//   --evidence <run_id>    append the evidence row linking a completed run
//                          to the commit and content hashes of the fixture
//                          files it wrote (run AFTER committing fixtures)

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { LedgerWriter, readLedger } from "../ledger/writer.js";
import { sha256OfFile } from "../ledger/io.js";
import { values } from "./shared.js";

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const historyDir = join(pkgDir, "history");
const repoRoot = join(pkgDir, "..", "..");

export async function ledger(): Promise<void> {
  const evidence = values.evidence as string | undefined;
  const list = values.list as boolean;

  if (list) return runList();
  if (evidence) return runEvidence(evidence);
  console.error("ledger: pass --list or --evidence <run_id>");
  process.exit(2);
}

function runList(): void {
  const view = readLedger(historyDir);
  if (view.tornTail) console.error("ledger: WARNING — torn final line recovered; last append was lost");
  if (view.runs.length === 0) {
    console.log("ledger: no runs recorded");
    return;
  }
  const evidenced = new Set(view.evidence.map((e) => e.run_id));
  const done = new Set(view.completions.map((c) => c.run_id));
  for (const run of view.runs) {
    const results = view.results.filter((r) => r.run_id === run.run_id).length;
    const status = done.has(run.run_id)
      ? evidenced.has(run.run_id) ? "complete, evidenced" : "complete, awaiting evidence"
      : "INCOMPLETE";
    console.log(
      `#${run.seq}  ${run.run_id}  ${run.scope.kind}  engines: ${Object.keys(run.engines).join(",")}  results: ${results}  ${status}`,
    );
  }
  for (const c of view.corrections) {
    console.log(`correction ${c.row_id} -> ${c.corrects} (${c.per})`);
  }
}

function runEvidence(runId: string): void {
  const view = readLedger(historyDir);
  const run = view.runs.find((r) => r.run_id === runId);
  if (!run) {
    console.error(`ledger: run ${runId} not found`);
    process.exit(1);
  }
  if (!view.completions.some((c) => c.run_id === runId)) {
    console.error(`ledger: run ${runId} has no completion row — refusing to evidence an incomplete run`);
    process.exit(1);
  }
  if (view.evidence.some((e) => e.run_id === runId)) {
    console.error(`ledger: run ${runId} already has an evidence row`);
    process.exit(1);
  }
  // the evidence row claims content hashes for fixtures and ledger rows —
  // those paths must match HEAD; unrelated in-flight work elsewhere in the
  // monorepo is none of this record's business
  const dirty = execSync(
    "git status --porcelain -- packages/assay/fixtures packages/assay/history",
    { cwd: repoRoot, encoding: "utf8" },
  ).trim();
  if (dirty !== "") {
    console.error("ledger: --evidence requires the run's fixture and ledger changes to be committed. Dirty:\n" + dirty);
    process.exit(1);
  }
  const commit = execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();

  // the files this run wrote: every fixture file containing an entry that
  // carries this run_id
  const files: Record<string, `sha256:${string}`> = {};
  const fixturesDir = join(pkgDir, "fixtures");
  for (const suite of readdirSync(fixturesDir)) {
    const suiteDir = join(fixturesDir, suite);
    let names: string[];
    try { names = readdirSync(suiteDir); } catch { continue; }
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      const path = join(suiteDir, name);
      const fx = JSON.parse(readFileSync(path, "utf8")) as {
        schemaVersion?: number;
        results?: Record<string, { run_id?: string | null }>;
      };
      if (fx.schemaVersion !== 2) continue;
      const touched = Object.values(fx.results ?? {}).some((e) => e.run_id === runId);
      if (touched) files[relative(repoRoot, path)] = sha256OfFile(path);
    }
  }
  if (Object.keys(files).length === 0) {
    console.error(`ledger: no committed fixture file carries run ${runId} — nothing to evidence`);
    process.exit(1);
  }

  const writer = new LedgerWriter(historyDir);
  try {
    writer.appendEvidence({ run_id: run.run_id, commit, files });
  } finally {
    writer.release();
  }
  console.log(`evidence recorded: run ${runId} -> ${commit.slice(0, 12)} (${Object.keys(files).length} files)`);
}
