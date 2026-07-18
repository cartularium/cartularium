// The result fingerprint, fpv 1 (approved design §4; the 2026-06-15 model
// with its escalation rule). A fingerprint MATCH establishes projected
// equality at this version and rung; a MISMATCH is only an escalation
// trigger (stability.ts) — round-then-hash cannot represent the
// non-transitive tolerant equality, so inequality is never concluded from
// hashes alone.
//
// === fpv 1 canonical encoding (normative byte contract) ===
// payload = { version: 1, kind, ... } serialized by canonicalJson
// (code-unit-sorted keys, UTF-8) and sha256-hashed.
//
// value outcomes: { version, kind: "value", extent: {rows, cols},
//   grid: CirculatingCell[][] encoded per cell } — extent is explicit and
//   load-bearing (a trimmed trailing blank is not a smaller grid).
//   Cell encoding by class:
//   - number: encoded as the STRING String(Number(v.toPrecision(12))).
//     12 significant digits is a relative grid of ~1e-11, strictly finer
//     than the comparator tolerance (1e-10), so two values that share an
//     encoding are always comparator-equal — the match direction of the
//     invariant holds by construction; within-tolerance pairs straddling a
//     digit boundary hash apart and escalate. -0 encodes as "0". NaN /
//     Infinity / -Infinity encode as those strings (comparator: NaN=NaN).
//   - string / rich-text: normalizeCirculatingText (NFC; case and
//     whitespace preserved).
//   - error: sentinel exactly (classic and extended already unified by
//     canonicalizePrimitive).
//   - opaque: type_tag exactly — a match claims TYPE-TAG STABILITY ONLY;
//     content is no-data and no stronger claim may be read from it.
//   - blank / null: class alone, kept distinct (D8.β).
//
// non-value outcomes: { version, kind, identity } where identity is the
// per-class projection below — DRAFTED for maintainer ratification
// (approval record rider 1), not silently settled:
//   rejected     -> { code } when code is present, else { reason } —
//                   a structured code outranks prose; prose is identity
//                   only when it is all the engine gave.
//   crashed      -> { channel } — detail is diagnostic noise.
//   pending      -> { source ?? null }.
//   skipped      -> { cause } — reason is noise.
//   driver-error -> {} — class only; detail is our stack, not behavior.
//   infra        -> {} — class only; "HTTP 429" vs "HTTP 429: retry
//                   after 30s" must not be two behaviors, and retryable
//                   is advice, not observation.
//   unclassified -> {} — honest no-data; raw is unserializable in general.
//
// Engine-stability boundary (approved decision point 7): value, rejected,
// and crashed participate in the engine-stability relation. pending,
// skipped, driver-error, infra, and unclassified are OPERATIONAL
// observations — fingerprinted for their own comparability, excluded from
// engine stability, so a quota hiccup is never recorded as engine drift.
// (pending sits with the operational set HERE even though the §6.6
// catalogue attribution counts it engine-attributable — an async
// not-yet-value is an observation state, not observed behavior. Flagged
// for ratification with the projections.)

import { createHash } from "node:crypto";
import { canonicalJson } from "../identity/semantic-hash.js";
import { canonicalizeCell, type CirculatingCell, type Extent, type Outcome, type RichGridValue } from "../format/values.js";
import { normalizeCirculatingText } from "./normalize.js";

export const FPV = 1;

export type Fingerprint = `sha256:${string}`;

export function quantizeNumberFpv1(v: number): string {
  if (Number.isNaN(v)) return "NaN";
  if (v === Infinity) return "Infinity";
  if (v === -Infinity) return "-Infinity";
  if (v === 0) return "0"; // includes -0
  return String(Number(v.toPrecision(12)));
}

type EncodedCell =
  | { c: "number" | "string" | "rich-text" | "error" | "opaque"; v: string }
  | { c: "boolean"; v: boolean }
  | { c: "blank" | "null" };

export function encodeCirculatingCellFpv1(cell: CirculatingCell): EncodedCell {
  switch (cell.c) {
    case "number":
      return { c: "number", v: quantizeNumberFpv1(cell.v) };
    case "string":
    case "rich-text":
      return { c: cell.c, v: normalizeCirculatingText(cell.v) };
    case "boolean":
      return { c: "boolean", v: cell.v };
    case "error":
    case "opaque":
      return { c: cell.c, v: cell.v };
    case "blank":
    case "null":
      return { c: cell.c };
  }
}

export function fingerprintValue(grid: RichGridValue, extent: Extent): Fingerprint {
  const encoded = grid.map((row) => row.map((cell) => encodeCirculatingCellFpv1(canonicalizeCell(cell))));
  return hash({ version: FPV, kind: "value", extent: { rows: extent.rows, cols: extent.cols }, grid: encoded });
}

export function fingerprintOutcome(o: Outcome): Fingerprint {
  switch (o.kind) {
    case "value":
      return fingerprintValue(o.grid, o.extent);
    case "rejected":
      return hash({ version: FPV, kind: o.kind, identity: o.code !== undefined ? { code: o.code } : { reason: normalizeCirculatingText(o.reason) } });
    case "crashed":
      return hash({ version: FPV, kind: o.kind, identity: { channel: o.channel } });
    case "pending":
      return hash({ version: FPV, kind: o.kind, identity: { source: o.source ?? null } });
    case "skipped":
      return hash({ version: FPV, kind: o.kind, identity: { cause: o.cause } });
    case "driver-error":
    case "infra":
    case "unclassified":
      return hash({ version: FPV, kind: o.kind, identity: {} });
  }
}

/** The engine-STABILITY relation's membership — narrower than the §6.6
 * catalogue attribution (pending is operational here; see header). */
export function isStabilityComparable(o: Outcome): boolean {
  return o.kind === "value" || o.kind === "rejected" || o.kind === "crashed";
}

function hash(payload: unknown): Fingerprint {
  return `sha256:${createHash("sha256").update(canonicalJson(payload)).digest("hex")}`;
}
