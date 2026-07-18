import { createHash } from "node:crypto";

export function semanticHashForCase(raw: Record<string, unknown>): `sha256:${string}` {
  const payload = {
    version: "assay-case-v1",
    case: canonicalizeSemanticCase(raw),
  };
  return `sha256:${createHash("sha256").update(canonicalJson(payload)).digest("hex")}`;
}

// This field list IS the case identity. Adding/removing a key changes the
// semanticHash of every case that carries it — which orphans that case's
// recorded fixtures (they are keyed by the old hash) until a regen re-keys or
// re-records them. Bump `version` above and regenerate when you change this set.
// (2026-06-16: dropping `semanticDomain` orphaned 69 cases; deferred to the
// pending foundation regen rather than re-keyed.)
function canonicalizeSemanticCase(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of [
    "subject",
    "formula",
    "grid",
    "expect",
    "overrides",
    "features",
    "supportLevel",
    "status",
    "setup",
    "assertions",
  ]) {
    const value = raw[key];
    if (value !== undefined) {
      out[key] = key === "features" && Array.isArray(value) ? [...value].sort() : value;
    }
  }
  return out;
}

export function canonicalJson(value: unknown): string {
  if (value === null) return "null";

  switch (typeof value) {
    case "string":
    case "boolean":
      return JSON.stringify(value);
    case "number":
      if (!Number.isFinite(value)) {
        throw new Error(`canonicalJson cannot encode non-finite number ${String(value)}`);
      }
      return JSON.stringify(value);
    case "undefined":
      throw new Error("canonicalJson cannot encode undefined");
    case "bigint":
    case "function":
    case "symbol":
      throw new Error(`canonicalJson cannot encode ${typeof value}`);
  }

  if (Array.isArray(value)) {
    const items: string[] = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) {
        throw new Error("canonicalJson cannot encode sparse arrays");
      }
      items.push(canonicalJson(value[index]));
    }
    return `[${items.join(",")}]`;
  }

  if (value && typeof value === "object") {
    if (!isPlainObject(value)) {
      throw new Error(`canonicalJson cannot encode non-plain object ${objectTag(value)}`);
    }
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => compareCodeUnits(a, b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }

  throw new Error(`canonicalJson cannot encode ${typeof value}`);
}

function compareCodeUnits(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function objectTag(value: object): string {
  return Object.prototype.toString.call(value);
}
