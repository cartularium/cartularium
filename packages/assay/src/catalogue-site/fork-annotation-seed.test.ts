import { describe, expect, it } from "vitest";
import { dvsToSeedRows, buildSeedSql } from "./fork-annotation-seed.js";
import type { DvEntry } from "./load.js";

const NOW = "2026-06-26T00:00:00.000Z";

function dv(over: Partial<DvEntry>): DvEntry {
  return {
    id: "DV-0001",
    summary: "a summary",
    cause: "precision",
    category: "value",
    engines: ["excel"],
    behavior: { signature: '"x"' },
    testCount: 1,
    subjects: ["SUM"],
    tests: ["SUM/basic"],
    seeded: "2026-01-01",
    lastConfirmed: "2026-01-01",
    ...over,
  };
}

describe("dvsToSeedRows", () => {
  it("maps a DV to one published, auto-seeded row per §5", () => {
    const { rows, warnings } = dvsToSeedRows([dv({ id: "DV-0247", summary: "s", cause: "arg-semantics", tests: ["NOW/a", "NOW/b"] })], NOW);
    expect(warnings).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id: "DV-0247",
      author_id: "auto-seeded (provisional)",
      content: "s",
      cause: "arg-semantics",
      scope_json: JSON.stringify([{ kind: "ref-set", refs: ["NOW/a", "NOW/b"] }]),
      status: "published",
      verified_by: null,
      verified_at: null,
      created_at: NOW,
      updated_at: NOW,
    });
  });

  it("prefers an authored `scope` over the tests ref-set fallback (3f reclassify)", () => {
    const scope = [
      { kind: "predicate" as const, query: { tags: ["complex-number"], subjectIn: ["IMSUM"] } },
      { kind: "ref-set" as const, refs: ["IMDIV/imdiv-basic"] },
    ];
    const { rows } = dvsToSeedRows([dv({ scope, tests: ["IMSUM/a"] })], NOW);
    expect(rows[0].scope_json).toBe(JSON.stringify(scope)); // authored scope wins verbatim
  });

  it("normalises the legacy `feature-absent` cause to missing-function with a warning", () => {
    const { rows, warnings } = dvsToSeedRows([dv({ id: "DV-0255", cause: "feature-absent" })], NOW);
    expect(rows[0].cause).toBe("missing-function");
    expect(warnings).toEqual(['DV-0255: normalised legacy cause "feature-absent" -> "missing-function"']);
  });

  it("drops an unknown cause to null with a warning (cause is optional, never identity)", () => {
    const { rows, warnings } = dvsToSeedRows([dv({ cause: "not-a-real-cause" })], NOW);
    expect(rows[0].cause).toBeNull();
    expect(warnings[0]).toMatch(/dropped unknown cause/);
  });

  it("treats an empty cause as null without a warning", () => {
    const { rows, warnings } = dvsToSeedRows([dv({ cause: "" })], NOW);
    expect(rows[0].cause).toBeNull();
    expect(warnings).toEqual([]);
  });
});

describe("buildSeedSql", () => {
  it("emits an idempotent UPSERT that preserves author_id, status, and created_at on conflict", () => {
    const { rows } = dvsToSeedRows([dv({})], NOW);
    const sql = buildSeedSql(rows);
    expect(sql).toContain("INSERT INTO assay_fork_annotations");
    expect(sql).toContain("ON CONFLICT(id) DO UPDATE SET");
    // refreshed
    expect(sql).toContain("content = excluded.content");
    expect(sql).toContain("cause = excluded.cause");
    expect(sql).toContain("scope_json = excluded.scope_json");
    expect(sql).toContain("updated_at = excluded.updated_at");
    // preserved — never in the SET clause
    const setClause = sql.slice(sql.indexOf("DO UPDATE SET"));
    expect(setClause).not.toContain("author_id =");
    expect(setClause).not.toContain("status =");
    expect(setClause).not.toContain("created_at =");
    // verification is content-bound: inserted NULL, and on conflict preserved only when the claim
    // is unchanged (the snapshot invariant) — cleared otherwise.
    expect(sql).toContain("verified_by, verified_at, created_at");
    expect(setClause).toContain("verified_by = CASE WHEN content = excluded.content");
    expect(setClause).toContain("THEN verified_by ELSE NULL END");
  });

  it("escapes single quotes in content (SQLite literal doubling)", () => {
    const { rows } = dvsToSeedRows([dv({ summary: "it's a 'quoted' summary" })], NOW);
    const sql = buildSeedSql(rows);
    expect(sql).toContain("'it''s a ''quoted'' summary'");
  });

  it("emits NULL (unquoted) for a dropped cause", () => {
    const { rows } = dvsToSeedRows([dv({ cause: "nope" })], NOW);
    const sql = buildSeedSql(rows);
    // the cause column slot is a bare NULL, not the string 'NULL'
    expect(sql).toMatch(/, NULL, /);
    expect(sql).not.toContain("'NULL'");
  });

  it("emits one statement per row", () => {
    const { rows } = dvsToSeedRows([dv({ id: "DV-0001" }), dv({ id: "DV-0002" }), dv({ id: "DV-0003" })], NOW);
    const sql = buildSeedSql(rows);
    expect(sql.match(/INSERT INTO assay_fork_annotations/g)).toHaveLength(3);
  });
});
