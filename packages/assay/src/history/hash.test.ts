import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { capabilitiesHash, fixtureBehaviorHash, valueHash } from "./hash.js";
import { valueOutcome, type RichGridValue } from "../format/values.js";

describe("valueHash", () => {
  it("returns sha256-prefixed hex", () => {
    const h = valueHash(42);
    expect(h).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("is stable across equal values", () => {
    expect(valueHash({ a: 1, b: 2 })).toBe(valueHash({ a: 1, b: 2 }));
  });

  it("is order-insensitive on object keys (canonical-json)", () => {
    expect(valueHash({ a: 1, b: 2 })).toBe(valueHash({ b: 2, a: 1 }));
  });

  it("distinguishes value differences", () => {
    expect(valueHash(1)).not.toBe(valueHash(2));
    expect(valueHash("1")).not.toBe(valueHash(1));
    expect(valueHash([1, 2])).not.toBe(valueHash([2, 1]));
  });

  it("treats null and undefined as the canonical null", () => {
    expect(valueHash(null)).toBe(valueHash(undefined));
  });

  it("hashes fixture behavior without adapter provenance", () => {
    const plain = { outcome: valueOutcome([[2]] as unknown as RichGridValue) };
    const withAdapter = {
      outcome: valueOutcome([[2]] as unknown as RichGridValue),
      "formula-as-evaluated": "=1+1",
    };
    expect(fixtureBehaviorHash(plain)).toBe(fixtureBehaviorHash(withAdapter));
  });
});

describe("capabilitiesHash", () => {
  it("hashes file content + filenames, deterministic across order", () => {
    const dir = mkdtempSync(join(tmpdir(), "caps-"));
    try {
      writeFileSync(join(dir, "a.json"), '{"x":1}');
      writeFileSync(join(dir, "b.json"), '{"y":2}');
      const h1 = capabilitiesHash(dir);
      expect(h1).toMatch(/^sha256:[0-9a-f]{64}$/);

      // touch file order-via-mtime; hash should still match content-sorted
      writeFileSync(join(dir, "a.json"), '{"x":1}');
      const h2 = capabilitiesHash(dir);
      expect(h2).toBe(h1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("changes when file content changes", () => {
    const dir = mkdtempSync(join(tmpdir(), "caps-"));
    try {
      writeFileSync(join(dir, "a.json"), '{"x":1}');
      const h1 = capabilitiesHash(dir);
      writeFileSync(join(dir, "a.json"), '{"x":2}');
      const h2 = capabilitiesHash(dir);
      expect(h2).not.toBe(h1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("ignores non-json files", () => {
    const dir = mkdtempSync(join(tmpdir(), "caps-"));
    try {
      writeFileSync(join(dir, "a.json"), '{"x":1}');
      const h1 = capabilitiesHash(dir);
      writeFileSync(join(dir, "readme.md"), "ignored");
      const h2 = capabilitiesHash(dir);
      expect(h2).toBe(h1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
