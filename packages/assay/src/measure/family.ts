// Divergence-measurement: probe families.
//
// A ProbeFamily declares a function under test as a structured *input space*:
// a set of named axes, each carrying a *locus* (where its discriminator lives —
// see docs/archive/divergence-measurement-*.md / bridge-translation §6). Expanding a
// family's cartesian product gives a sweep of concrete probes, each an ordinary
// schemaVersion-3 TestCase that runs through the unchanged `generate` → fixture
// pipeline. The axis-assignment that produced each probe is carried in `tags`
// (`ax:<axis>=<setting>`), so the analysis step can recover it after the fact.
//
// The only thing new here vs. hand-authoring the YAML is the systematic
// expansion + the per-axis locus metadata the analysis consumes.

import type { CellValue } from "../format/values.js";
import type { PlatformFormula } from "../format/catalogue.js";

// Where a divergence's discriminator lives — decides static carve-ability:
//  - syntactic   : in the formula text (literal flags, encoding, structure) →
//                  a static *rewrite* can key off it.
//  - environment : execution-model config (dynamic-array mode, date epoch,
//                  precision, locale). Statically knowable (a target property),
//                  so carve-able, but the *fix is configuration*, not a rewrite.
//  - data-borne  : a runtime cell value (found/not-found, sortedness, a ref'd
//                  cell's value/type/null-kind). NOT statically observable →
//                  total-decompose / runtime-guard / author-flag.
export type AxisLocus = "syntactic" | "environment" | "data-borne";

// One discrete setting of an axis. `label` must be slug-safe ([a-z0-9-]); it is
// the value used in tags and in the analysis. Families attach whatever payload
// `build` needs via additional fields.
export interface AxisSetting {
  label: string;
  [key: string]: unknown;
}

export interface Axis {
  name: string; // slug-safe axis id, e.g. "range_lookup_encoding"
  locus: AxisLocus;
  // data-borne only: is the discriminator a cheaply runtime-checkable input
  // shape/type (a runtime *guard* is possible) vs. an outcome property like
  // found/not-found (guard impossible → total-decompose or author-flag)?
  runtimeCheckable?: boolean;
  settings: AxisSetting[];
}

// One point in the input space: axis name → chosen setting label.
export type Assignment = Record<string, string>;

export interface BuildResult {
  // formula text (no leading "="), or a per-platform map (PlatformFormula) when
  // engine-specific syntax is needed (e.g. `@` on excel, ARRAYFORMULA on sheets).
  formula: string | PlatformFormula;
  grid?: Record<string, CellValue>;
  // optional category override for the generated TestCase (defaults to "value").
  category?: string;
}

export interface ProbeFamily {
  subject: string; // e.g. "VLOOKUP"
  axes: Axis[];
  // prune invalid / redundant assignments before they become probes; return
  // false to drop. Use it to keep e.g. key_type only when key_encoding=ref.
  constraint?: (a: Assignment) => boolean;
  // materialize one probe. `settings` resolves each axis name to the chosen
  // AxisSetting object (the payload), so build() doesn't re-look-up labels.
  build: (a: Assignment, settings: Record<string, AxisSetting>) => BuildResult;
}

// === expansion =============================================================

// An authored (pre-loadTestSuite) test case — the YAML shape we emit. Kept
// loose so we don't couple to the post-derivation TestCase (id/semanticHash).
export interface AuthoredCase {
  subject: string;
  name: string;
  formula: string | PlatformFormula;
  category: string;
  status: "observed";
  grid?: Record<string, CellValue>;
  tags: string[];
}

export interface AuthoredSuite {
  schemaVersion: 3;
  name: string;
  tests: AuthoredCase[];
}

export interface ExpandStats {
  combos: number; // full cartesian size before constraints
  kept: number; // probes emitted
  pruned: number; // dropped by constraint
  collisions: number; // distinct assignments that collapsed to an existing (formula,grid)
}

export interface ExpandResult {
  suite: AuthoredSuite;
  stats: ExpandStats;
  // assignment vector per emitted probe, parallel to suite.tests
  assignments: Assignment[];
}

const SWEEP_TAG = (subject: string) => `sweep:${subject.toLowerCase()}`;

/** axis name → chosen AxisSetting for an assignment. */
function resolveSettings(family: ProbeFamily, a: Assignment): Record<string, AxisSetting> {
  const out: Record<string, AxisSetting> = {};
  for (const axis of family.axes) {
    const setting = axis.settings.find((s) => s.label === a[axis.name]);
    if (!setting) throw new Error(`axis ${axis.name} has no setting "${a[axis.name]}"`);
    out[axis.name] = setting;
  }
  return out;
}

/** Cartesian product of every axis's settings → assignment vectors. */
export function cartesian(axes: Axis[]): Assignment[] {
  let acc: Assignment[] = [{}];
  for (const axis of axes) {
    const next: Assignment[] = [];
    for (const partial of acc) {
      for (const setting of axis.settings) {
        next.push({ ...partial, [axis.name]: setting.label });
      }
    }
    acc = next;
  }
  return acc;
}

/** A stable, slug-safe, unique probe name from the assignment (axis order). */
function probeName(family: ProbeFamily, a: Assignment): string {
  return family.axes.map((axis) => a[axis.name]).join("-");
}

// Canonical (formula, grid) key for collision detection — mirrors the fields
// semanticHashForCase folds in (minus the constant subject/status), so two
// probes that would collide on caseKey are detected here at gen time.
function semanticKey(b: BuildResult): string {
  return JSON.stringify({ formula: b.formula, grid: b.grid ?? null });
}

/**
 * Expand a family into an authored suite. Probes are emitted in cartesian
 * order, after `constraint` pruning. Assignments that collapse to a
 * (formula, grid) already emitted are recorded as collisions and skipped — they
 * are the same experiment and would share a fixture key anyway; the analysis
 * still maps every assignment back via the suite tags.
 */
export function expandToSuite(family: ProbeFamily): ExpandResult {
  const all = cartesian(family.axes);
  const tests: AuthoredCase[] = [];
  const assignments: Assignment[] = [];
  const seen = new Set<string>();
  let pruned = 0;
  let collisions = 0;

  for (const a of all) {
    if (family.constraint && !family.constraint(a)) {
      pruned++;
      continue;
    }
    const settings = resolveSettings(family, a);
    const built = family.build(a, settings);
    const key = semanticKey(built);
    if (seen.has(key)) {
      collisions++;
      continue;
    }
    seen.add(key);
    const tags = [
      SWEEP_TAG(family.subject),
      ...family.axes.map((axis) => `ax:${axis.name}=${a[axis.name]}`),
    ];
    const test: AuthoredCase = {
      subject: family.subject,
      name: probeName(family, a),
      formula: built.formula,
      category: built.category ?? "value",
      status: "observed",
      tags,
    };
    if (built.grid) test.grid = built.grid;
    tests.push(test);
    assignments.push(a);
  }

  return {
    suite: { schemaVersion: 3, name: `sweep: ${family.subject}`, tests },
    stats: { combos: all.length, kept: tests.length, pruned, collisions },
    assignments,
  };
}

// === builder validation ====================================================

/** Normalize a BuildResult's formula to a comparable string. */
function formulaText(f: string | PlatformFormula): string {
  return typeof f === "string" ? f : JSON.stringify(f);
}

/**
 * Verify every `syntactic`-labeled axis actually changes the formula text
 * across its settings — otherwise the label is a lie (the input is really
 * entering via the grid / environment, and the analysis would mis-classify any
 * divergence it drives). Holds the other axes at a constraint-valid base and
 * varies the target axis. Throws on the first inconsistency. Returns the list
 * of axes it could not validate (fewer than 2 constraint-valid settings).
 */
export function validateBuilders(family: ProbeFamily): { unvalidated: string[] } {
  const unvalidated: string[] = [];
  const valid = (family.constraint ? cartesian(family.axes).filter(family.constraint) : cartesian(family.axes));
  if (valid.length === 0) throw new Error(`${family.subject}: no constraint-valid assignments`);

  for (const axis of family.axes) {
    if (axis.locus !== "syntactic") continue;

    // pick a base assignment, then substitute each setting of `axis`, keeping
    // only the substitutions that remain constraint-valid.
    const base = valid[0];
    const texts = new Map<string, string>();
    for (const setting of axis.settings) {
      const candidate = { ...base, [axis.name]: setting.label };
      if (family.constraint && !family.constraint(candidate)) continue;
      const built = family.build(candidate, resolveSettings(family, candidate));
      texts.set(setting.label, formulaText(built.formula));
    }

    if (texts.size < 2) {
      unvalidated.push(axis.name);
      continue;
    }
    const distinct = new Set(texts.values());
    if (distinct.size < texts.size) {
      const dump = [...texts.entries()].map(([l, t]) => `  ${l}: ${t}`).join("\n");
      throw new Error(
        `${family.subject}: axis "${axis.name}" is labeled syntactic but does not change ` +
          `formula text across its settings:\n${dump}`,
      );
    }
  }
  return { unvalidated };
}
