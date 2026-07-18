// static checks for v2 test files
//   missing-broadcasting-feature — array-literal tests must declare broadcasting intent (schema §4)
//   bare-error-string — expect/override.expect/override.recorded must use {error: "..."} form
//   semantic-domain-policy — tests that need non-value benchmark lanes must declare them
//
// bare-error-string lints the raw YAML because the parser auto-coerces on load —
// bare strings work at runtime but trip up corpus-walking scripts that match {error: ...}

import { readFileSync } from "node:fs";
import * as YAML from "yaml";
import { loadTestSuite } from "./format/parse.js";
import type { TestCase } from "./format/catalogue.js";

export type LintRule =
  | "missing-broadcasting-feature"
  | "bare-error-string"
  | "semantic-domain-policy";

export interface LintIssue {
  file: string;
  testId: string;
  rule: LintRule;
  // e.g. "formula", "expect", "overrides.gsheets.recorded"
  field: string;
  context: string;
  detail: string;
}

export function lintSuites(files: string[]): LintIssue[] {
  const issues: LintIssue[] = [];
  for (const file of files) {
    const suite = loadTestSuite(file);
    for (const test of suite.tests) {
      issues.push(...lintBroadcasting(test, file));
      issues.push(...lintSemanticDomain(test, file));
    }
    // raw YAML — parser auto-coerces bare error-strings on load
    issues.push(...lintBareErrorStringsRaw(file));
  }
  return issues;
}

function lintSemanticDomain(test: TestCase, file: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const domain = test.semanticDomain ?? "formula-value";
  const support = test.supportLevel;

  if (test.features?.includes("external-io") && domain === "formula-value") {
    issues.push(makeSemanticIssue(
      file,
      test,
      "features",
      "features: [external-io]",
      "external-io tests must declare a non-formula-value semanticDomain such as external-effect, display, metadata, or grid-context.",
    ));
  }

  if ((test.category === "volatile" || test.status === "volatile" || isVolatileSubject(test.subject)) && domain !== "volatile") {
    issues.push(makeSemanticIssue(
      file,
      test,
      "semanticDomain",
      `subject/category/status: ${test.subject}/${test.category}/${test.status ?? "verified"}`,
      "volatile tests must declare semanticDomain: volatile so they are excluded from headline formula-value benchmarks.",
    ));
  }

  if (test.category === "format" && domain !== "display") {
    issues.push(makeSemanticIssue(
      file,
      test,
      "semanticDomain",
      "category: format",
      "format tests must declare semanticDomain: display unless they are rewritten as pure formula-value tests.",
    ));
  }

  if (test.category === "interaction" && domain !== "grid-context") {
    issues.push(makeSemanticIssue(
      file,
      test,
      "semanticDomain",
      "category: interaction",
      "interaction tests must declare semanticDomain: grid-context.",
    ));
  }

  if (isMetadataSubject(test.subject) && !["metadata", "display", "grid-context"].includes(domain)) {
    issues.push(makeSemanticIssue(
      file,
      test,
      "semanticDomain",
      `subject: ${test.subject}`,
      "metadata subjects such as CELL, SHEET, and SHEETS must declare semanticDomain: metadata, display, or grid-context.",
    ));
  }

  if (domain === "partial" && !["subset", "unsupported", "design-pending"].includes(support ?? "")) {
    issues.push(makeSemanticIssue(
      file,
      test,
      "supportLevel",
      `semanticDomain: partial`,
      "partial-domain tests must declare supportLevel: subset, unsupported, or design-pending.",
    ));
  }

  return issues;
}

function isVolatileSubject(subject: string | undefined): boolean {
  return subject === "RAND" || subject === "RANDBETWEEN" || subject === "RANDARRAY" || subject === "NOW" || subject === "TODAY";
}

function isMetadataSubject(subject: string | undefined): boolean {
  return subject === "CELL" || subject === "SHEET" || subject === "SHEETS";
}

function makeSemanticIssue(file: string, test: TestCase, field: string, context: string, detail: string): LintIssue {
  return {
    file,
    testId: test.id,
    rule: "semantic-domain-policy",
    field,
    context,
    detail,
  };
}

function lintBroadcasting(test: TestCase, file: string): LintIssue[] {
  const formula = formulaText(test);
  if (!hasArrayLiteral(formula)) return [];
  if (broadcastingExempted(test)) return [];
  return [{
    file,
    testId: test.id,
    rule: "missing-broadcasting-feature",
    field: "formula",
    context: formula,
    detail:
      "uses an array literal but declares no broadcasting intent. " +
      "Add `features: [broadcasting]`, set `subject: feature:*`, or suppress with `tags: [bare-formula]`.",
  }];
}

function formulaText(test: TestCase): string {
  if (typeof test.formula === "string") return test.formula;
  for (const v of Object.values(test.formula)) if (v) return v;
  return "";
}

function broadcastingExempted(test: TestCase): boolean {
  if (test.features?.includes("broadcasting")) return true;
  if (test.subject?.startsWith("feature:")) return true;
  if (test.tags?.includes("bare-formula")) return true;
  return false;
}

// detects a `{...}` block containing `,` or `;` outside any quoted string
export function hasArrayLiteral(formula: string): boolean {
  let depth = 0;
  let blockHasSep = false;
  let inString = false;
  for (let i = 0; i < formula.length; i++) {
    const ch = formula[i];
    if (ch === '"') {
      if (inString && formula[i + 1] === '"') { i++; continue; }
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") {
      if (depth === 0) blockHasSep = false;
      depth++;
    } else if (ch === "}") {
      if (depth === 1 && blockHasSep) return true;
      depth = Math.max(depth - 1, 0);
    } else if (depth > 0 && (ch === "," || ch === ";")) {
      blockHasSep = true;
    }
  }
  return false;
}

// exact-match bare error-strings only — narrative strings like
// "got #NAME? from foo" don't trigger
// trailing sigil varies: `?` (#NAME?), `!` (#DIV/0!, #VALUE!), or none (#N/A)
const ERROR_STRING_RE =
  /^#(NULL|DIV\/0|VALUE|REF|NAME|NUM|N\/A|ERROR|GETTING_DATA|SPILL|CALC|UNKNOWN|FIELD|BLOCKED)[!?]?$/;

function isBareErrorString(v: unknown): v is string {
  return typeof v === "string" && ERROR_STRING_RE.test(v);
}

function lintBareErrorStringsRaw(file: string): LintIssue[] {
  const issues: LintIssue[] = [];
  let doc: { tests?: Array<Record<string, unknown>> } | undefined;
  try {
    doc = YAML.parse(readFileSync(file, "utf8"));
  } catch {
    return issues;
  }
  for (const t of (doc?.tests ?? [])) {
    const id = typeof t.id === "string" ? t.id : "<unknown>";
    if (isBareErrorString(t.expect)) {
      issues.push(makeBareErrorIssue(file, id, "expect", t.expect));
    }
    if (t.overrides && typeof t.overrides === "object") {
      for (const [engine, ov] of Object.entries(t.overrides as Record<string, unknown>)) {
        if (!ov || typeof ov !== "object") continue;
        const o = ov as Record<string, unknown>;
        if (isBareErrorString(o.expect)) {
          issues.push(makeBareErrorIssue(file, id, `overrides.${engine}.expect`, o.expect));
        }
        if (isBareErrorString(o.recorded)) {
          issues.push(makeBareErrorIssue(file, id, `overrides.${engine}.recorded`, o.recorded));
        }
      }
    }
  }
  return issues;
}

function makeBareErrorIssue(file: string, testId: string, field: string, value: string): LintIssue {
  return {
    file,
    testId,
    rule: "bare-error-string",
    field,
    context: `${field}: "${value}"`,
    detail:
      `is a bare error-string. Use the matcher form: ${field}: { error: "${value}" }. ` +
      "Bare strings are interpreted as literal-string assertions, not error matchers — " +
      "engines returning the error fail the comparison silently.",
  };
}

export function printLintReport(issues: LintIssue[]): void {
  if (issues.length === 0) {
    console.log("Lint: clean.");
    return;
  }

  const byRule = new Map<LintRule, number>();
  for (const i of issues) byRule.set(i.rule, (byRule.get(i.rule) ?? 0) + 1);
  const ruleSummary = [...byRule.entries()].map(([r, n]) => `${r}: ${n}`).join(", ");
  console.log(`Lint: ${issues.length} issue(s) found  (${ruleSummary}).\n`);

  const byFile = new Map<string, LintIssue[]>();
  for (const i of issues) {
    const arr = byFile.get(i.file) ?? [];
    arr.push(i);
    byFile.set(i.file, arr);
  }
  for (const [file, fileIssues] of byFile) {
    console.log(`  ${file}  (${fileIssues.length})`);
    for (const i of fileIssues) {
      console.log(`    [${i.rule}] ${i.testId}  ${i.context}`);
    }
    console.log("");
  }

  if (byRule.has("missing-broadcasting-feature")) {
    console.log(
      "Fix [missing-broadcasting-feature]:\n" +
      "  add `features: [broadcasting]`, set `subject: feature:*`,\n" +
      "  or suppress with `tags: [bare-formula]` per schema §4.",
    );
  }
  if (byRule.has("bare-error-string")) {
    console.log(
      "Fix [bare-error-string]:\n" +
      "  replace `expect: \"#NAME?\"` with `expect: { error: \"#NAME?\" }`\n" +
      "  per schema §6 (matcher form). Same for override.expect / override.recorded.",
    );
  }
  if (byRule.has("semantic-domain-policy")) {
    console.log(
      "Fix [semantic-domain-policy]:\n" +
      "  add semanticDomain/supportLevel metadata so non-formula-value tests\n" +
      "  are excluded from headline benchmark scoring.",
    );
  }
}
