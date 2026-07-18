// shared cluster fingerprinting — used by `assay matrix` and `assay history`

import type { Platform } from "../format/values.js";
import type { Cause } from "../format/catalogue.js";

export interface ClusterKeyInput {
  cause: Cause;
  engines: Platform[];
  signature: string;
}

// `<cause>__<engines-sorted>__<sig-hash>` — sticky across runs
export function clusterKey(input: ClusterKeyInput): string {
  const enginesSorted = [...input.engines].sort();
  return `${input.cause}__${enginesSorted.join("+")}__${shortHash(input.signature)}`;
}

export function behaviorSignature(v: unknown): string {
  return JSON.stringify(canonicalize(v));
}

function canonicalize(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(canonicalize);
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(v as object).sort()) {
    out[k] = canonicalize((v as Record<string, unknown>)[k]);
  }
  return out;
}

// djb2; only disambiguates the signature portion of clusterKey
export function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, "0");
}
