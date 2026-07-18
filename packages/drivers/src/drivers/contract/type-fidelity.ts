// Type-fidelity invariant — the ingestion-fidelity acceptance gate
// (driver-contract §3.4 / seeding §6.3). A driver MUST store a seeded value as
// the type the contract specifies, never silently coerce it. The gsheets crack
// (`USER_ENTERED` turns the string "3" into a number while Excel/openpyxl keep it
// text) manufactures false divergence — the same seed becoming different types
// per engine. This gate catches exactly that.
//
// It is a REUSABLE HARNESS over the minimal slice of the Driver surface it needs
// (`evaluate`). Its conformance targets are the FIRST-CLASS engines only — Excel
// + gsheets today, lattice once built (§2.1). Peripheral engines (hyperformula,
// ironcalc, formulas, pycel, libreoffice) are conform-or-hole and forgone
// indefinitely: one that coerces on ingest (hyperformula reads "3" as a number
// and "#DIV/0!" as an error) is marked no-data for that case, NEVER a fix target —
// recording it as divergence would manufacture exactly the false divergence the
// gate exists to prevent. seed.ts decides each seed's canonical type ONCE
// (`classifySeed`) and `expectedTypeProbes` is the oracle; this harness only
// sweeps the seeds and compares the engine's own `IS*` answers against it.

import {
  projectScalarGrid,
  type CellValue,
  type RichGridValue,
} from "../../format/values.js";
import {
  CLASSIC_ERROR_SENTINELS,
  classifySeed,
  expectedTypeProbes,
  type SeedValue,
} from "./seed.js";

/** The minimal driver slice the gate exercises (a structural subset of `Driver`). */
export interface TypeFidelitySubject {
  evaluate(formula: string, grid?: Record<string, CellValue>): Promise<RichGridValue>;
}

/** The four type probes, keyed to match `expectedTypeProbes`'s return. */
export const TYPE_PROBES = [
  { key: "isNumber", formula: "=ISNUMBER(A1)" },
  { key: "isText", formula: "=ISTEXT(A1)" },
  { key: "isLogical", formula: "=ISLOGICAL(A1)" },
  { key: "isError", formula: "=ISERROR(A1)" },
] as const;

/**
 * Default seed sweep: the common five + D1's two footguns (error-LOOKING text,
 * number-LOOKING text — both are text, not their lookalike) + the classic-7 error
 * literals (D6, real `CellError`s — the only way to seed an actual error).
 */
export const DEFAULT_SEEDS: SeedValue[] = [
  0,
  1,
  -3.5,
  "x",
  "#DIV/0!", // error-LOOKING string ⇒ text
  "3", // number-LOOKING string ⇒ text (the coercion crack)
  true,
  false,
  null, // blank
  ...CLASSIC_ERROR_SENTINELS.map((s) => ({ error: s })),
];

export interface TypeFidelityViolation {
  seed: SeedValue;
  probe: string;
  expected: boolean;
  actual: CellValue;
}

/**
 * Run the type-fidelity invariant against `subject`. For each non-formula seed,
 * place it in A1 and assert the four type probes match `expectedTypeProbes`.
 * Returns the violations — empty means the driver ingests faithfully. Formula
 * seeds carry no fixed type (the formula decides), so the oracle returns null and
 * the harness skips them.
 */
export async function checkTypeFidelity(
  subject: TypeFidelitySubject,
  seeds: SeedValue[] = DEFAULT_SEEDS,
): Promise<TypeFidelityViolation[]> {
  const violations: TypeFidelityViolation[] = [];
  for (const seed of seeds) {
    const expected = expectedTypeProbes(classifySeed(seed));
    if (expected === null) continue; // formula seed — no fixed expectation
    // A blank is an absent cell; everything else is a CellValue (errors included).
    const grid: Record<string, CellValue> =
      seed === null ? {} : { A1: seed as CellValue };
    for (const probe of TYPE_PROBES) {
      const rich = await subject.evaluate(probe.formula, grid);
      const actual = projectScalarGrid(rich)[0]?.[0] ?? null;
      const want = expected[probe.key];
      if (actual !== want) {
        violations.push({ seed, probe: probe.formula, expected: want, actual });
      }
    }
  }
  return violations;
}
