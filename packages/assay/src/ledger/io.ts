// Append + read for the stability-substrate ledger. The write protocol
// (approved design §3): one writer at a time (pid lock), a row is a single
// write, fsync after append, a torn FINAL line is recoverable — the run it
// belonged to has no completion row, so nothing is silently lost. Interior
// corruption is never tolerated.

import { createHash, randomBytes } from "node:crypto";
import {
  appendFileSync, closeSync, existsSync, fsyncSync, mkdirSync,
  openSync, readdirSync, readFileSync, writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { acquireLock, type LockHandle } from "../history/io.js";
import { canonicalJson } from "../identity/semantic-hash.js";
import type { RunId } from "./types.js";

export function newRunId(start: Date): RunId {
  const iso = start.toISOString().replace(/\.\d{3}Z$/, "Z");
  return `${iso}.${randomBytes(2).toString("hex")}` as RunId;
}

export function newRowId(): string {
  return randomBytes(6).toString("hex");
}

export function appendRows(path: string, rows: unknown[]): void {
  if (rows.length === 0) return;
  ensureDir(dirname(path));
  const lines = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  appendFileSync(path, lines);
  const fd = openSync(path, "r+");
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

export interface ReadResult<T> {
  rows: T[];
  /** a torn final line was dropped — the writer crashed mid-append */
  tornTail: boolean;
}

// tolerates: blank lines, one torn FINAL line. throws on interior damage.
export function readRows<T>(path: string): ReadResult<T> {
  if (!existsSync(path)) return { rows: [], tornTail: false };
  const lines = readFileSync(path, "utf8").split("\n");
  const rows: T[] = [];
  let lastBad: number | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    try {
      rows.push(JSON.parse(line) as T);
      if (lastBad !== null) {
        throw new Error(`${path}:${lastBad + 1}: malformed interior row — ledger damaged, refusing to read`);
      }
    } catch (e) {
      if (lastBad !== null) throw e;
      lastBad = i;
    }
  }
  return { rows, tornTail: lastBad !== null };
}

export function lockLedger(dir: string): LockHandle {
  return acquireLock(join(dir, ".lock"));
}

export function sha256OfFile(path: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}

// content-addressed capabilities snapshot: one JSON object holding every
// capability file, stored at history/capabilities/<hash>.json so the run
// row's hash always has a materialized referent
export function snapshotCapabilities(capabilitiesDir: string, historyDir: string): `sha256:${string}` {
  const files = readdirSync(capabilitiesDir).filter((f) => f.endsWith(".json")).sort();
  const snapshot: Record<string, unknown> = {};
  for (const f of files) {
    snapshot[f] = JSON.parse(readFileSync(join(capabilitiesDir, f), "utf8"));
  }
  const body = canonicalJson(snapshot) + "\n";
  const hash = createHash("sha256").update(body).digest("hex");
  const dir = join(historyDir, "capabilities");
  ensureDir(dir);
  const path = join(dir, `${hash}.json`);
  if (!existsSync(path)) writeFileSync(path, body);
  return `sha256:${hash}`;
}

function ensureDir(d: string): void {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}
