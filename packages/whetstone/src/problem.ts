import { readFileSync, writeFileSync } from "node:fs";
import { parse, stringify } from "yaml";
import type { Scalar } from "./rect.js";

export interface ComparePolicy {
  numbers?: { epsilon: number };
  /** "any" canonicalizes row order before comparing (community sheets sort both sides) */
  rowOrder?: "exact" | "any";
}

export interface ProblemCase {
  kind: "sample" | "hidden";
  input: Scalar[][];
  /** filled by the oracle (reference solution run through the judge machinery) */
  expected?: Scalar[][];
}

export interface Problem {
  id: string;
  title: string;
  attribution?: string;
  difficulty: number; // 1–10, community scale
  tags: string[];
  statement: string;
  challenges?: string[]; // informational constraint categories (oner, lambdaless, golfed…)
  template: {
    sheets: Array<{ title: string }>;
    input: string; // e.g. Input!A1:L9 — becomes the INPUT named range
    output: string; // e.g. Answer!A2:D40 — becomes the OUTPUT named range
    answerHeaders?: string[]; // rendered just above OUTPUT
    /** live judge-owned template spreadsheet; written back by cli-template */
    spreadsheetId?: string;
  };
  reference: string; // reference solution formula, placed at OUTPUT's top-left by the oracle
  compare: ComparePolicy;
  lint?: { ban?: string[] };
  cases: ProblemCase[];
}

export function loadProblem(path: string): Problem {
  return parse(readFileSync(path, "utf8")) as Problem;
}

export function saveProblem(path: string, problem: Problem): void {
  writeFileSync(path, stringify(problem, { lineWidth: 100 }));
}
