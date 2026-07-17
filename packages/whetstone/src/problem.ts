import { readFileSync, writeFileSync } from "node:fs";
import { parse, stringify } from "yaml";
import type { Problem } from "./problem-types.js";

export type { ComparePolicy, Problem, ProblemCase } from "./problem-types.js";

export function loadProblem(path: string): Problem {
  return parse(readFileSync(path, "utf8")) as Problem;
}

export function saveProblem(path: string, problem: Problem): void {
  writeFileSync(path, stringify(problem, { lineWidth: 100 }));
}
