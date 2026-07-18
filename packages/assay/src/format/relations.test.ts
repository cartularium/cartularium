import { describe, it, expect } from "vitest";
import type { PrimitiveValue, RichCellValue, RichGridValue } from "./values.js";
import { partitionByAgreement, isForked, type AgreementClass } from "./relations.js";

// Minimal rich cell — gridsEqual reads only `.primitive`, the engine stub is inert.
const cell = (primitive: PrimitiveValue): RichCellValue => ({
  primitive,
  engine: { platform: "gsheets", wire_kind: "blank" },
});
const num = (v: number): RichGridValue => [[cell({ kind: "number", value: v })]];

// canonical view of a partition for order-independent comparison
const shape = (classes: AgreementClass[]) => classes.map((c) => c.engines);

// symmetric, unordered-pair edge predicate for injected-relation tests
const edges = (...pairs: string[]) => {
  const set = new Set(pairs);
  return (a: string, b: string) => set.has([a, b].sort().join("-"));
};

// every permutation of an array (small n only)
function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) =>
    permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((rest) => [x, ...rest]),
  );
}
const reorder = (results: Record<string, RichGridValue>, order: string[]) =>
  Object.fromEntries(order.map((k) => [k, results[k]]));

describe("partitionByAgreement — verdict-free cross-engine relation", () => {
  it("agreeing engines share a class; disagreeing ones split (value agreement)", () => {
    const results = {
      excel: num(1),
      gsheets: num(1),
      hyperformula: num(2),
      ironcalc: num(2),
    };
    expect(shape(partitionByAgreement(results))).toEqual([
      ["excel", "gsheets"],
      ["hyperformula", "ironcalc"],
    ]);
  });

  it("all-agree ⇒ one class ⇒ not forked; any split ⇒ forked", () => {
    const agree = { excel: num(1), gsheets: num(1), hyperformula: num(1) };
    const split = { excel: num(1), gsheets: num(1), hyperformula: num(9) };
    expect(isForked(partitionByAgreement(agree))).toBe(false);
    expect(partitionByAgreement(agree)).toHaveLength(1);
    expect(isForked(partitionByAgreement(split))).toBe(true);
  });

  it("relative numeric tolerance still groups (ironcalc relaxed to 1e-9)", () => {
    // excel vs ironcalc ~3e-10 off — relaxed pair tolerance keeps them together
    const results = {
      excel: num(1),
      ironcalc: num(1 + 3e-10),
      gsheets: num(2),
    };
    expect(shape(partitionByAgreement(results))).toEqual([["excel", "ironcalc"], ["gsheets"]]);
  });

  // THE executable symmetry guarantee: the partition is invariant under any
  // permutation of the input engines — the structural proof that no engine is the
  // pivot (catches any reintroduction of `first`-style asymmetry).
  it("is invariant under permutation of the engine keys", () => {
    const results = {
      excel: num(1),
      gsheets: num(1),
      hyperformula: num(2),
      ironcalc: num(3),
    };
    const canonical = partitionByAgreement(results);
    for (const order of permutations(Object.keys(results))) {
      expect(partitionByAgreement(reorder(results, order))).toEqual(canonical);
    }
  });

  it("only engines present in `results` appear — no-data is never a silent member", () => {
    // capture ≠ circulation: skipped/unreadable engines are absent upstream, so
    // they never join a value-agreement class.
    const results = { excel: num(1), gsheets: num(1) };
    expect(partitionByAgreement(results).flatMap((c) => c.engines)).toEqual(["excel", "gsheets"]);
  });

  it("representative is the class's alphabetically-first grid — display only, deterministic", () => {
    const results = { gsheets: num(7), excel: num(7) };
    const [cls] = partitionByAgreement(results);
    expect(cls.engines).toEqual(["excel", "gsheets"]);
    expect(cls.representative).toEqual(num(7)); // excel's grid (sorts first); carries no authority
  });
});

describe("partitionByAgreement — union-find under non-transitive tolerance (injected relation)", () => {
  // The documented delta vs the old `first`-pivot boolean. With A≈B and B≈C but
  // A≉C, the old pivot (first = A) flagged a fork because C≠A. Honest cohort
  // grouping is connected components: {A,B,C} is ONE class — not forked. We
  // accept this chaining (spec §5); pin it so the behavior change stays visible.
  it("a near-tolerance chain merges into one class (cohort equality)", () => {
    const results = { A: num(0), B: num(0), C: num(0) };
    const classes = partitionByAgreement(results, edges("A-B", "B-C"));
    expect(shape(classes)).toEqual([["A", "B", "C"]]);
    expect(isForked(classes)).toBe(false);
  });

  it("disjoint agreement yields multiple classes", () => {
    const results = { A: num(0), B: num(0), C: num(0), D: num(0) };
    expect(shape(partitionByAgreement(results, edges("A-B", "C-D")))).toEqual([
      ["A", "B"],
      ["C", "D"],
    ]);
  });

  it("no agreement ⇒ all singletons", () => {
    const results = { A: num(0), B: num(0), C: num(0) };
    expect(shape(partitionByAgreement(results, edges()))).toEqual([["A"], ["B"], ["C"]]);
  });
});

describe("no-verdict schema guard", () => {
  // grep-able invariant made executable: an AgreementClass carries no field that
  // encodes correctness or a reference engine — only the engine set and a
  // display-only representative.
  it("a class exposes exactly { engines, representative } — no correct/reference field", () => {
    const [cls] = partitionByAgreement({ excel: num(1), gsheets: num(2) });
    expect(Object.keys(cls).sort()).toEqual(["engines", "representative"]);
  });
});
