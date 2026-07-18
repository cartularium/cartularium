import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { parse, stringify } from "yaml";
import type { Problem } from "./problem-types.js";

export type { ComparePolicy, Problem, ProblemCase } from "./problem-types.js";

/**
 * Paren balance of a formula, ignoring parens inside double-quoted strings.
 * Returns 0 for balanced; Sheets reports imbalance only at evaluation time
 * as an unhelpful "Formula parse error", so we lint offline.
 */
export function parenImbalance(formula: string): number {
  let depth = 0;
  let inString = false;
  for (const ch of formula) {
    if (ch === '"') inString = !inString;
    else if (!inString && ch === "(") depth++;
    else if (!inString && ch === ")") depth--;
  }
  return depth;
}

/**
 * Fingerprint of the oracle surface — the fields that determine `expected`.
 * Compare policy and prose are deliberately excluded: changing them doesn't
 * stale the oracle run.
 */
export function oracleSurfaceHash(problem: Problem): string {
  const surface = {
    reference: problem.reference,
    input: problem.template.input,
    output: problem.template.output,
    inputs: problem.cases.map((c) => c.input),
  };
  return createHash("sha256").update(JSON.stringify(surface)).digest("hex").slice(0, 16);
}

export function loadProblem(path: string): Problem {
  return parse(readFileSync(path, "utf8")) as Problem;
}

export function saveProblem(path: string, problem: Problem): void {
  writeFileSync(path, stringify(problem, { lineWidth: 100 }));
}
