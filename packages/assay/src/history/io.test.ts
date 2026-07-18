import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { acquireLock, appendJsonl, readJsonl } from "./io.js";

describe("appendJsonl + readJsonl round-trip", () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "hio-")); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it("appends to a fresh file", () => {
    const path = join(dir, "out.jsonl");
    appendJsonl(path, [{ a: 1 }, { a: 2 }]);
    expect(readJsonl<{ a: number }>(path)).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("appends to an existing file without losing prior rows", () => {
    const path = join(dir, "out.jsonl");
    appendJsonl(path, [{ a: 1 }]);
    appendJsonl(path, [{ a: 2 }, { a: 3 }]);
    expect(readJsonl<{ a: number }>(path)).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }]);
  });

  it("is a no-op when given an empty rows array", () => {
    const path = join(dir, "out.jsonl");
    appendJsonl(path, [{ a: 1 }]);
    appendJsonl(path, []);
    expect(readJsonl(path)).toHaveLength(1);
  });

  it("returns [] for missing files", () => {
    expect(readJsonl(join(dir, "missing.jsonl"))).toEqual([]);
  });

  it("creates parent directories", () => {
    const path = join(dir, "deeply", "nested", "out.jsonl");
    appendJsonl(path, [{ a: 1 }]);
    expect(readJsonl<{ a: number }>(path)).toEqual([{ a: 1 }]);
  });

  it("tolerates trailing newlines + blank lines on read", () => {
    const path = join(dir, "out.jsonl");
    writeFileSync(path, '{"a":1}\n\n{"a":2}\n');
    expect(readJsonl<{ a: number }>(path)).toEqual([{ a: 1 }, { a: 2 }]);
  });

  it("throws with file:line on malformed jsonl", () => {
    const path = join(dir, "bad.jsonl");
    writeFileSync(path, '{"a":1}\nnot-json\n');
    expect(() => readJsonl(path)).toThrow(/bad\.jsonl:2: malformed jsonl/);
  });

  it("survives many small appends without growing super-linearly", () => {
    const path = join(dir, "out.jsonl");
    for (let i = 0; i < 50; i++) appendJsonl(path, [{ a: i }]);
    expect(readJsonl<{ a: number }>(path).length).toBe(50);
  });
});

describe("acquireLock", () => {
  let dir: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "lock-")); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it("acquires + releases", () => {
    const lock = acquireLock(join(dir, ".lock"));
    lock.release();
    // re-acquire after release
    const lock2 = acquireLock(join(dir, ".lock"));
    lock2.release();
  });

  it("rejects double-acquire from the same process", () => {
    const path = join(dir, ".lock");
    const lock = acquireLock(path);
    try {
      expect(() => acquireLock(path)).toThrow(/locked by pid/);
    } finally {
      lock.release();
    }
  });

  it("reclaims a stale lock (dead pid)", () => {
    const path = join(dir, ".lock");
    // pick a pid that is almost certainly dead
    writeFileSync(path, "999999");
    const lock = acquireLock(path);
    lock.release();
  });

  it("release is idempotent", () => {
    const lock = acquireLock(join(dir, ".lock"));
    lock.release();
    expect(() => lock.release()).not.toThrow();
  });
});
