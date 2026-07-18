import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { withExcelLock } from "./excel.js";

const LOCK_PATH = join(tmpdir(), "assay-excel.lock");

function removeLock(): void {
  try {
    unlinkSync(LOCK_PATH);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

beforeEach(removeLock);
afterEach(removeLock);

describe("withExcelLock", () => {
  it("acquires the lock atomically with pid and ISO timestamp metadata", async () => {
    const result = await withExcelLock(() => {
      const lock = JSON.parse(readFileSync(LOCK_PATH, "utf8")) as {
        pid: number;
        timestamp: string;
      };
      expect(lock.pid).toBe(process.pid);
      expect(new Date(lock.timestamp).toISOString()).toBe(lock.timestamp);
      return 42;
    });

    expect(result).toBe(42);
    expect(existsSync(LOCK_PATH)).toBe(false);
  });

  it("queues a second acquisition until the holder releases", async () => {
    let release!: () => void;
    const held = withExcelLock(() => new Promise<void>((resolve) => (release = resolve)));
    let acquired = false;
    const waiting = withExcelLock(() => {
      acquired = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(acquired).toBe(false);
    release();
    await held;
    await waiting;
    expect(acquired).toBe(true);
  });

  it("steals a fresh lock held by a dead pid", async () => {
    const child = spawnSync(process.execPath, ["-e", "process.stdout.write(String(process.pid))"]);
    const deadPid = Number(child.stdout.toString());
    expect(child.status).toBe(0);
    expect(Number.isInteger(deadPid)).toBe(true);
    writeFileSync(
      LOCK_PATH,
      JSON.stringify({ pid: deadPid, timestamp: new Date().toISOString() }),
      { flag: "wx" },
    );

    await withExcelLock(() => {
      const lock = JSON.parse(readFileSync(LOCK_PATH, "utf8")) as { pid: number };
      expect(lock.pid).toBe(process.pid);
    });
  });

  it("steals a lock older than 15 minutes even when its pid is live", async () => {
    writeFileSync(
      LOCK_PATH,
      JSON.stringify({
        pid: process.pid,
        timestamp: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
      }),
      { flag: "wx" },
    );

    await withExcelLock(() => {
      const lock = JSON.parse(readFileSync(LOCK_PATH, "utf8")) as { timestamp: string };
      expect(Date.now() - Date.parse(lock.timestamp)).toBeLessThan(15 * 60 * 1000);
    });
  });

  it("releases the lock when the wrapped call throws", async () => {
    await expect(
      withExcelLock(() => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(existsSync(LOCK_PATH)).toBe(false);
  });
});
