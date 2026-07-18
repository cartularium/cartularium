// The full platform UNIVERSE — the type space historical records may
// reference. Membership here is not a promise to run anything: the tiers
// below (engines-and-scope decision, 2026-07-18) govern what runs and what
// publishes.
export const ALL_PLATFORMS = [
  "gsheets",
  "excel",
  "lattice",
  "ironcalc",
  "hyperformula",
  "libreoffice",
  "formulas",
  "pycel",
] as const

export type Platform = (typeof ALL_PLATFORMS)[number]

export function isPlatform(value: string): value is Platform {
  return (ALL_PLATFORMS as readonly string[]).includes(value)
}

// === Platform tiers (decisions/2026-07-18-assay-engines-and-scope.md) ===
// Evidence-grade: the engines whose recorded results are the evidence
// record. Lattice is first-class pending its v4 attention — declared, not
// runnable yet. The hibernated five are unrun, unpublished, and
// unreferenced by live surfaces until deliberately woken by decision;
// waking an engine means regenerating through the recorded pipeline, never
// restoring archived pre-substrate data.
export const EVIDENCE_GRADE_PLATFORMS = ["gsheets", "excel"] as const satisfies readonly Platform[]

export const PENDING_PLATFORMS = ["lattice"] as const satisfies readonly Platform[]

export const HIBERNATED_PLATFORMS = [
  "ironcalc",
  "hyperformula",
  "libreoffice",
  "formulas",
  "pycel",
] as const satisfies readonly Platform[]

export function isRunnablePlatform(value: Platform): boolean {
  return (EVIDENCE_GRADE_PLATFORMS as readonly string[]).includes(value)
}
