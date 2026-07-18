import { describe, expect, it } from "vitest";
import { analyzeOutcomes, type OutcomeRow } from "./analyze.js";
import { decideVerdict } from "./verdict.js";
import type { Axis, AxisLocus, ProbeFamily } from "./family.js";
import { expandToSuite, validateBuilders } from "./family.js";
import { classifyEntry, foreignOutcome, parseAssignment } from "./partition.js";
import type { FixtureEntry } from "../fixtures.js";
import { valueOutcome, type RichGridValue } from "../format/values.js";
import { vlookupFamily } from "./families/vlookup.js";

// minimal Axis (settings unused by analyze/verdict — cardinality comes from rows)
function ax(name: string, locus: AxisLocus, runtimeCheckable?: boolean): Axis {
  return {
    name,
    locus,
    settings: [],
    ...(runtimeCheckable !== undefined ? { runtimeCheckable } : {}),
  };
}
function row(assignment: Record<string, string>, target: string, incomplete?: boolean): OutcomeRow {
  return { assignment, target, ...(incomplete ? { incomplete: true } : {}) };
}
function run(rows: OutcomeRow[], axes: Axis[]) {
  const analysis = analyzeOutcomes(
    rows,
    axes.map((a) => a.name),
  );
  const okRows = rows.filter((r) => !r.incomplete);
  const verdict = decideVerdict("TEST", analysis, axes, okRows);
  return { analysis, verdict };
}
// scalar grid as a fixture result (toScalarGrid passes legacy grids through)
function entry(result: unknown): FixtureEntry {
  return { outcome: valueOutcome(result as RichGridValue) };
}

describe("analyzeOutcomes + decideVerdict", () => {
  it("1. agrees-everywhere → AGREES_EVERYWHERE", () => {
    const axes = [ax("mode", "syntactic"), ax("present", "data-borne")];
    const rows = [
      row({ mode: "exact", present: "yes" }, "agree"),
      row({ mode: "approx", present: "yes" }, "agree"),
      row({ mode: "exact", present: "no" }, "agree"),
      row({ mode: "approx", present: "no" }, "agree"),
    ];
    const { analysis, verdict } = run(rows, axes);
    expect(analysis.reducts).toEqual([[]]);
    expect(analysis.constantTarget).toBe("agree");
    expect(verdict.kind).toBe("AGREES_EVERYWHERE");
    expect(verdict.provisional).toBe(false);
  });

  it("2. single syntactic discriminator → EXPLICIT_BRIDGE (rewrite)", () => {
    const axes = [ax("mode", "syntactic"), ax("present", "data-borne")];
    const rows = [
      row({ mode: "exact", present: "yes" }, "agree"),
      row({ mode: "approx", present: "yes" }, "differ"),
      row({ mode: "exact", present: "no" }, "agree"),
      row({ mode: "approx", present: "no" }, "differ"),
    ];
    const { analysis, verdict } = run(rows, axes);
    expect(analysis.reducts).toEqual([["mode"]]);
    expect(verdict.kind).toBe("EXPLICIT_BRIDGE");
    expect(verdict.fix?.rewriteOn).toEqual(["mode"]);
    expect(verdict.fix?.configOn).toBeUndefined();
    expect(verdict.trigger).toEqual([{ where: { mode: "approx" }, outcome: "differ" }]);
  });

  it("3. single data-borne (outcome) → IRREDUCIBLE author-flag", () => {
    const axes = [ax("mode", "syntactic"), ax("present", "data-borne", false)];
    const rows = [
      row({ mode: "exact", present: "yes" }, "agree"),
      row({ mode: "approx", present: "yes" }, "agree"),
      row({ mode: "exact", present: "no" }, "differ"),
      row({ mode: "approx", present: "no" }, "differ"),
    ];
    const { analysis, verdict } = run(rows, axes);
    expect(analysis.reducts).toEqual([["present"]]);
    expect(verdict.kind).toBe("IRREDUCIBLE");
    expect(verdict.residualDataBorne).toEqual(["present"]);
    expect(verdict.option).toBe("author-flag");
  });

  it("4. data-borne but runtime-checkable → IRREDUCIBLE runtime-guard", () => {
    const axes = [ax("shape", "data-borne", true)];
    const rows = [row({ shape: "scalar" }, "agree"), row({ shape: "2d" }, "differ")];
    const { verdict } = run(rows, axes);
    expect(verdict.kind).toBe("IRREDUCIBLE");
    expect(verdict.option).toBe("runtime-guard");
  });

  it("5. conjunction (interaction) → reduct is the pair, neither alone", () => {
    const axes = [ax("mode", "syntactic"), ax("sorted", "data-borne", false)];
    const rows = [
      row({ mode: "exact", sorted: "yes" }, "agree"),
      row({ mode: "exact", sorted: "no" }, "agree"),
      row({ mode: "approx", sorted: "yes" }, "agree"),
      row({ mode: "approx", sorted: "no" }, "differ"), // only this combo diverges
    ];
    const { analysis, verdict } = run(rows, axes);
    expect(analysis.reducts).toEqual([["mode", "sorted"]]);
    expect(verdict.kind).toBe("IRREDUCIBLE");
    expect(verdict.staticNarrowing).toEqual(["mode"]);
    expect(verdict.residualDataBorne).toEqual(["sorted"]);
    expect(verdict.trigger).toEqual([
      { where: { mode: "approx", sorted: "no" }, outcome: "differ" },
    ]);
  });

  it("6. multiple reducts → prefers the all-syntactic explanation", () => {
    const axes = [ax("mode", "syntactic"), ax("mirror", "data-borne")];
    // mirror perfectly co-varies with mode, so both fully explain the outcome
    const rows = [
      row({ mode: "approx", mirror: "hi" }, "differ"),
      row({ mode: "exact", mirror: "lo" }, "agree"),
    ];
    const { analysis, verdict } = run(rows, axes);
    expect(analysis.reducts).toEqual([["mode"], ["mirror"]]);
    expect(analysis.core).toEqual([]);
    expect(verdict.kind).toBe("EXPLICIT_BRIDGE");
    expect(verdict.discriminators).toEqual(["mode"]);
  });

  it("7. only reduct is mixed (syntactic+data-borne) → IRREDUCIBLE", () => {
    const axes = [ax("a", "syntactic"), ax("b", "data-borne", false)];
    const rows = [
      row({ a: "x", b: "p" }, "agree"),
      row({ a: "x", b: "q" }, "differ"),
      row({ a: "y", b: "p" }, "differ"),
      row({ a: "y", b: "q" }, "agree"),
    ]; // XOR-like: needs both axes
    const { analysis, verdict } = run(rows, axes);
    expect(analysis.reducts).toEqual([["a", "b"]]);
    expect(verdict.kind).toBe("IRREDUCIBLE");
    expect(verdict.staticNarrowing).toEqual(["a"]);
  });

  it("8. environment-only reduct → EXPLICIT_BRIDGE via config", () => {
    const axes = [ax("array_mode", "environment")];
    const rows = [row({ array_mode: "dynamic" }, "agree"), row({ array_mode: "legacy" }, "differ")];
    const { verdict } = run(rows, axes);
    expect(verdict.kind).toBe("EXPLICIT_BRIDGE");
    expect(verdict.fix?.configOn).toEqual(["array_mode"]);
    expect(verdict.fix?.rewriteOn).toBeUndefined();
  });

  it("9. purity violation (uncontrolled variable) → ABORTED", () => {
    const axes = [ax("mode", "syntactic")];
    const rows = [row({ mode: "exact" }, "agree"), row({ mode: "exact" }, "differ")];
    const { analysis, verdict } = run(rows, axes);
    expect(analysis.purityViolation).toBeDefined();
    expect(verdict.kind).toBe("ABORTED");
  });

  it("10. holes are excluded, never flip agreement; mark provisional", () => {
    const axes = [ax("mode", "syntactic")];
    const rows = [
      row({ mode: "exact" }, "agree"),
      row({ mode: "approx" }, "agree"),
      row({ mode: "weird" }, "differ", true), // incomplete → excluded
    ];
    const { analysis, verdict } = run(rows, axes);
    expect(analysis.okCount).toBe(2);
    expect(analysis.incompleteCount).toBe(1);
    expect(verdict.kind).toBe("AGREES_EVERYWHERE");
    expect(verdict.completeness).toBeCloseTo(2 / 3);
    expect(verdict.provisional).toBe(true);
    expect(verdict.surface.okProbes).toBe(2);
  });

  it("11. constant divergence (no data dependence) → EXPLICIT_BRIDGE unconditional", () => {
    const axes = [ax("mode", "syntactic"), ax("present", "data-borne")];
    const rows = [
      row({ mode: "exact", present: "yes" }, "differ"),
      row({ mode: "approx", present: "no" }, "differ"),
    ];
    const { analysis, verdict } = run(rows, axes);
    expect(analysis.constantTarget).toBe("differ");
    expect(verdict.kind).toBe("EXPLICIT_BRIDGE");
    expect(verdict.discriminators).toEqual([]);
  });

  it("12. pinned data-borne axis → caveat (provisional)", () => {
    const axes = [ax("mode", "syntactic"), ax("present", "data-borne")];
    const rows = [
      row({ mode: "exact", present: "yes" }, "agree"),
      row({ mode: "approx", present: "yes" }, "differ"), // present is constant ("yes")
    ];
    const { analysis, verdict } = run(rows, axes);
    expect(analysis.cardinality.present).toBe(1);
    expect(verdict.kind).toBe("EXPLICIT_BRIDGE");
    expect(verdict.provisional).toBe(true);
    expect(verdict.pinnedAxes).toContainEqual({ axis: "present", locus: "data-borne" });
  });
});

describe("partition", () => {
  it("13. classifyEntry: skip/driver-error = unimplemented; computed #N/A = ok value", () => {
    expect(classifyEntry(undefined).kind).toBe("hole");
    expect(
      classifyEntry({ outcome: { kind: "skipped", cause: "capability", reason: "feature absent" } })
        .kind,
    ).toBe("unimplemented");
    expect(classifyEntry({ outcome: { kind: "driver-error", detail: "#NAME?" } }).kind).toBe(
      "unimplemented",
    );
    expect(
      classifyEntry({ outcome: { kind: "infra", detail: "quota exceeded", retryable: true } }).kind,
    ).toBe("hole");
    // a COMPUTED #N/A cell is a value, not unimplemented (the VLOOKUP not-found trap)
    const naValue = classifyEntry(entry([[{ error: "#N/A" }]]));
    expect(naValue.kind).toBe("ok");
  });

  it("14. foreignOutcome: tolerance boundary (precision) vs real differ vs unimpl", () => {
    const tol = 1e-10;
    const ok1 = classifyEntry(entry([[1]]));
    const okNear = classifyEntry(entry([[1 + 1e-12]]));
    const okFar = classifyEntry(entry([[1.5]]));
    const unimpl = classifyEntry({ outcome: { kind: "skipped", cause: "policy", reason: "x" } });

    const near = foreignOutcome(ok1, okNear, tol);
    expect(near.outcome).toBe("agree");
    expect(near.precision).toBe(true); // within tol but signatures differ

    expect(foreignOutcome(ok1, okFar, tol).outcome).toBe("differ");
    expect(foreignOutcome(ok1, unimpl, tol).outcome).toBe("unimpl-b");
    expect(foreignOutcome(unimpl, ok1, tol).outcome).toBe("unimpl-a");
    expect(foreignOutcome(ok1, { kind: "hole", reason: "x" }, tol).outcome).toBe("incomplete");
  });

  it("15. parseAssignment reads ax:* tags", () => {
    expect(
      parseAssignment(["sweep:vlookup", "ax:mode=approx", "ax:present=absent", "lookup"]),
    ).toEqual({
      mode: "approx",
      present: "absent",
    });
  });
});

describe("family expansion + builder validation", () => {
  it("16. validateBuilders throws when a syntactic axis does not change formula text", () => {
    const bad: ProbeFamily = {
      subject: "BAD",
      axes: [ax("flag", "syntactic")],
      build: () => ({ formula: "=BAD()" }), // ignores the axis
    };
    bad.axes[0].settings = [{ label: "on" }, { label: "off" }];
    expect(() => validateBuilders(bad)).toThrow(/does not change formula text/);
  });

  it("17. vlookup family validates and expands to a bounded sweep", () => {
    expect(() => validateBuilders(vlookupFamily)).not.toThrow();
    const { suite, stats } = expandToSuite(vlookupFamily);
    expect(stats.kept).toBeGreaterThan(50);
    expect(stats.kept).toBeLessThan(160);
    expect(suite.tests.length).toBe(stats.kept);
    // every probe carries its sweep + axis tags, status observed, unique names
    const names = new Set(suite.tests.map((t) => t.name));
    expect(names.size).toBe(suite.tests.length);
    for (const t of suite.tests) {
      expect(t.status).toBe("observed");
      expect(t.tags).toContain("sweep:vlookup");
      expect(t.tags.some((tag) => tag.startsWith("ax:range_lookup="))).toBe(true);
    }
  });
});
