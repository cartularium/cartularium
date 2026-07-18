// Divergence-measurement: report assembly + human-readable printing.

import type { Axis } from "./family.js";
import type { ReductResult } from "./analyze.js";
import type { Verdict } from "./verdict.js";
import type { ForeignOutcome, ForeignPair, ProbeRow } from "./partition.js";

export interface EngineMeta {
  platform: string;
  generatedAt?: string;
}

export interface MeasurementReport {
  subject: string;
  pair: ForeignPair;
  numTolerance: number;
  engines: EngineMeta[];
  axisSpace: Array<{ name: string; locus: string; runtimeCheckable?: boolean; cardinality: number }>;
  tallies: {
    total: number;
    ok: number;
    incomplete: number;
    agree: number;
    differ: number;
    unimplemented: number;
    precision: number;
  };
  analysis: { reducts: string[][]; core: string[] };
  verdict: Verdict;
  divergent: Array<{ name: string; assignment: Record<string, string>; outcome: ForeignOutcome }>;
}

function tally(rows: ProbeRow[]) {
  const t = { total: rows.length, ok: 0, incomplete: 0, agree: 0, differ: 0, unimplemented: 0, precision: 0 };
  for (const r of rows) {
    if (r.precision) t.precision++;
    switch (r.foreign) {
      case "incomplete": t.incomplete++; break;
      case "agree": t.ok++; t.agree++; break;
      case "both-unimpl": t.ok++; t.agree++; break;
      case "differ": t.ok++; t.differ++; break;
      default: t.ok++; t.unimplemented++; break; // unimpl-a / unimpl-b
    }
  }
  return t;
}

export function buildReport(
  subject: string,
  pair: ForeignPair,
  numTolerance: number,
  engines: EngineMeta[],
  axes: Axis[],
  analysis: ReductResult,
  verdict: Verdict,
  rows: ProbeRow[],
): MeasurementReport {
  const divergent = rows
    .filter((r) => r.foreign !== "agree" && r.foreign !== "both-unimpl" && r.foreign !== "incomplete")
    .map((r) => ({ name: r.name, assignment: r.assignment, outcome: r.foreign }));

  return {
    subject,
    pair,
    numTolerance,
    engines,
    axisSpace: axes.map((a) => ({
      name: a.name,
      locus: a.locus,
      runtimeCheckable: a.runtimeCheckable,
      cardinality: analysis.cardinality[a.name] ?? 0,
    })),
    tallies: tally(rows),
    analysis: { reducts: analysis.reducts, core: analysis.core },
    verdict,
    divergent,
  };
}

function fmtPct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function fmtCondition(where: Record<string, string>): string {
  const parts = Object.entries(where).map(([k, v]) => `${k}=${v}`);
  return parts.length ? parts.join(" & ") : "(always)";
}

export function printReport(r: MeasurementReport): void {
  const t = r.tallies;
  console.log(`\n── Divergence measurement: ${r.subject} (${r.pair.a} ↔ ${r.pair.b}) ──`);
  const eng = r.engines.map((e) => `${e.platform}${e.generatedAt ? ` @ ${e.generatedAt.slice(0, 19)}` : ""}`);
  console.log(`  measured:      ${eng.join("  ·  ")}`);
  console.log(`  probes:        ${t.total}   (ok ${t.ok} · incomplete ${t.incomplete})`);
  console.log(
    `  agree ${t.agree}   differ ${t.differ}   unimpl ${t.unimplemented}   precision ${t.precision}`,
  );
  console.log(
    `  completeness:  ${fmtPct(r.verdict.completeness)}${r.verdict.provisional ? "   [provisional]" : ""}`,
  );

  console.log(`\n  Verdict: ${r.verdict.kind}${r.verdict.option ? `  (option: ${r.verdict.option})` : ""}`);
  const d = r.verdict.discriminators ?? [];
  if (d.length) {
    console.log(`    discriminating axes (reduct): [${d.join(", ")}]   core: [${r.analysis.core.join(", ")}]`);
    for (const axis of d) {
      const meta = r.axisSpace.find((a) => a.name === axis);
      const rc = meta?.locus === "data-borne" ? ` (${meta.runtimeCheckable ? "runtime-checkable" : "outcome"})` : "";
      console.log(`      ${axis.padEnd(20)} ${meta?.locus}${rc}`);
    }
  }
  if (r.verdict.fix?.rewriteOn) console.log(`    fix: rewrite on [${r.verdict.fix.rewriteOn.join(", ")}]`);
  if (r.verdict.fix?.configOn) console.log(`    fix: config on [${r.verdict.fix.configOn.join(", ")}]`);
  if (r.verdict.fix?.note) console.log(`    fix: ${r.verdict.fix.note}`);
  if (r.verdict.staticNarrowing) console.log(`    static narrowing: [${r.verdict.staticNarrowing.join(", ")}]`);
  if (r.verdict.residualDataBorne) console.log(`    residual data-borne: [${r.verdict.residualDataBorne.join(", ")}]`);

  if (r.analysis.reducts.length > 1) {
    console.log(`    all minimal reducts: ${r.analysis.reducts.map((re) => `[${re.join(",")}]`).join("  ")}`);
  }

  if (r.verdict.trigger && r.verdict.trigger.length) {
    console.log(`\n  Where engines disagree (over the reduct):`);
    for (const term of r.verdict.trigger.slice(0, 12)) {
      console.log(`    ${fmtCondition(term.where)}  →  ${term.outcome}`);
    }
    if (r.verdict.trigger.length > 12) console.log(`    (+${r.verdict.trigger.length - 12} more)`);
  }

  const pinned = r.verdict.pinnedAxes ?? [];
  if (pinned.length) {
    console.log(`\n  Pinned (unexplored) axes: ${pinned.map((p) => `${p.axis} [${p.locus}]`).join(", ")}`);
  }
  if (r.verdict.surface.irreducibleRegions !== undefined) {
    console.log(`  Irreducible incompatibility surface: ${r.verdict.surface.irreducibleRegions} region(s) ` +
      `(${t.differ + t.unimplemented}/${t.ok} divergent probes)`);
  }
  if (r.verdict.reason) console.log(`  Reason: ${r.verdict.reason}`);
  console.log("");
}
