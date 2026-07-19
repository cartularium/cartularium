import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { semanticHashForCase } from "../identity/index.js";
import { loadTestSuite } from "./parse.js";

describe("feature registry", () => {
  it("rejects a case declaring an unknown feature name", () => {
    const dir = mkdtempSync(join(tmpdir(), "assay-feature-registry-"));
    const path = join(dir, "typo.yaml");
    writeFileSync(
      path,
      [
        "schemaVersion: 3",
        "name: Typo",
        "tests:",
        "  - subject: SEQUENCE",
        "    name: typo-feature",
        "    formula: '=SEQUENCE(3)'",
        "    expect:",
        "      - [1]",
        "      - [2]",
        "      - [3]",
        "    features: [broadcasing]",
        "",
      ].join("\n"),
    );

    expect(() => loadTestSuite(path)).toThrow(/unknown feature\(s\) "broadcasing"/);
  });
});

describe("schemaVersion 3", () => {
  it("derives id, subjectRef, category, and semanticHash", () => {
    const dir = mkdtempSync(join(tmpdir(), "assay-v3-parse-"));
    const path = join(dir, "array-longtail.yaml");
    writeFileSync(
      path,
      [
        "schemaVersion: 3",
        "name: Array longtail",
        "tests:",
        "  - subject: EXPAND",
        "    name: pad-value",
        "    formula: '=EXPAND({1,2}, 2, 3, 0)'",
        "    expect:",
        "      - [1, 2, 0]",
        "      - [0, 0, 0]",
        "    features: [dynamic-arrays]",
        "",
      ].join("\n"),
    );

    const suite = loadTestSuite(path);
    expect(suite.schemaVersion).toBe(3);
    expect(suite.tests[0]).toMatchObject({
      id: "EXPAND/pad-value",
      subject: "EXPAND",
      subjectRef: "EXPAND",
      name: "pad-value",
      category: "value",
    });
    expect(suite.tests[0].semanticHash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("expands definitions before hashing", () => {
    const dir = mkdtempSync(join(tmpdir(), "assay-v3-defs-"));
    const path = join(dir, "math.yaml");
    writeFileSync(
      path,
      [
        "schemaVersion: 3",
        "definitions:",
        "  ONE: '1'",
        "tests:",
        "  - subject: SUM",
        "    name: one-plus-one",
        "    formula: '=SUM(${ONE},1)'",
        "    expect: 2",
        "",
      ].join("\n"),
    );

    const suite = loadTestSuite(path);
    expect(suite.tests[0].formula).toBe("=SUM(1,1)");
    expect(suite.tests[0].semanticHash).toBe(
      semanticHashForCase({
        subject: "SUM",
        formula: "=SUM(1,1)",
        expect: 2,
      }),
    );
    expect(suite.tests[0].semanticHash).not.toBe(
      semanticHashForCase({
        subject: "SUM",
        formula: "=SUM(${ONE},1)",
        expect: 2,
      }),
    );
  });

  it("derives error categories from normalized expectations", () => {
    const dir = mkdtempSync(join(tmpdir(), "assay-v3-error-category-"));
    const path = join(dir, "errors.yaml");
    writeFileSync(
      path,
      [
        "schemaVersion: 3",
        "tests:",
        "  - subject: IFERROR",
        "    name: na-error",
        "    formula: '=NA()'",
        "    expect: '#N/A'",
        "",
      ].join("\n"),
    );

    const suite = loadTestSuite(path);
    expect(suite.tests[0].category).toBe("error-code");
    expect(suite.tests[0].expect).toEqual({ error: "#N/A" });
  });

  it("requires v3 formula fields", () => {
    const dir = mkdtempSync(join(tmpdir(), "assay-v3-missing-formula-"));
    const path = join(dir, "broken.yaml");
    writeFileSync(
      path,
      [
        "schemaVersion: 3",
        "tests:",
        "  - subject: SUM",
        "    name: missing-formula",
        "    expect: 2",
        "",
      ].join("\n"),
    );

    expect(() => loadTestSuite(path)).toThrow(/missing required `formula`/);
  });

  it("hashes overrides without materializing absent optional fields", () => {
    const dir = mkdtempSync(join(tmpdir(), "assay-v3-override-hash-"));
    const path = join(dir, "overrides.yaml");
    writeFileSync(
      path,
      [
        "schemaVersion: 3",
        "tests:",
        "  - subject: SUM",
        "    name: override-without-recorded",
        "    formula: '=SUM(1,2)'",
        "    expect: 3",
        "    overrides:",
        "      pycel:",
        "        cause: TODO",
        "",
      ].join("\n"),
    );

    const suite = loadTestSuite(path);
    expect(suite.tests[0].semanticHash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});
