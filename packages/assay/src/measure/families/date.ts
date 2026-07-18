// DATE edge-case probe family.
//
// `=DATE(y, m, d)` with literal args (so the discriminator is syntactic — the
// out-of-range literal is visible in the formula text) across rollover and the
// 1900 leap-year cases. Result is a serial number; an epoch divergence would
// show as a constant offset (an environment-level fix), a rollover divergence
// as a per-case (syntactic) one.

import type { Assignment, ProbeFamily } from "../family.js";

const CASES: Record<string, [number, number, number]> = {
  normal: [2020, 6, 15],
  monthover: [2020, 13, 1], // month 13 → rolls into next year
  dayover: [2020, 1, 32], // day 32 → rolls into Feb
  monthzero: [2020, 0, 15], // month 0 → prior Dec
  dayzero: [2020, 1, 0], // day 0 → prior Dec 31
  feb291900: [1900, 2, 29], // the Excel 1900-leap-year bug
};

export const dateFamily: ProbeFamily = {
  subject: "DATE",
  axes: [
    { name: "case", locus: "syntactic", settings: Object.keys(CASES).map((label) => ({ label })) },
  ],
  build(a: Assignment) {
    const [y, m, d] = CASES[a.case];
    return { formula: `=DATE(${y}, ${m}, ${d})` };
  },
};
