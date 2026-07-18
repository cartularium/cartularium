// jsonl append + pid lock for history/

import {
  appendFileSync, closeSync, existsSync, mkdirSync, openSync,
  readFileSync, unlinkSync, writeFileSync, fsyncSync,
} from "node:fs";
import { dirname } from "node:path";

// real append — single write call + fsync. a torn line on crash is
// recoverable: readJsonl throws with file:line, point at the last row
export function appendJsonl(path: string, rows: unknown[]): void {
  if (rows.length === 0) return;
  ensureDir(dirname(path));
  const lines = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  appendFileSync(path, lines);
  const fd = openSync(path, "r+");
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

// throws on malformed json, tolerates blank lines
export function readJsonl<T>(path: string): T[] {
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf8");
  const out: T[] = [];
  let lineNum = 0;
  for (const line of text.split("\n")) {
    lineNum++;
    if (line.trim() === "") continue;
    try {
      out.push(JSON.parse(line) as T);
    } catch (e) {
      throw new Error(`${path}:${lineNum}: malformed jsonl row — ${(e as Error).message}`);
    }
  }
  return out;
}

export interface LockHandle {
  release(): void;
}

// pid-aware; reclaims stale locks (dead pid)
export function acquireLock(path: string): LockHandle {
  ensureDir(dirname(path));
  if (existsSync(path)) {
    const pid = parsePid(path);
    if (pid !== null && isAlive(pid)) {
      throw new Error(`history is locked by pid ${pid} (${path}). retry once that process exits.`);
    }
    unlinkSync(path);
  }
  // wx = O_EXCL|O_CREAT — fails if another process raced us
  let fd: number;
  try {
    fd = openSync(path, "wx");
  } catch (e) {
    throw new Error(`history is locked (${path}): ${(e as Error).message}`);
  }
  try {
    writeFileSync(fd, String(process.pid));
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  let released = false;
  return {
    release(): void {
      if (released) return;
      released = true;
      try { unlinkSync(path); } catch {}
    },
  };
}

function parsePid(path: string): number | null {
  try {
    const s = readFileSync(path, "utf8").trim();
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function isAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function ensureDir(d: string): void {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}
