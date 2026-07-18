// Pure types for problem definitions — no node imports, safe to reach from
// the Worker bundle. Node-side YAML IO lives in problem.ts.
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
  /**
   * Public identity: `ld-NNNN`, monotonic, allocated when a problem is accepted
   * into the corpus, never reused. Everything durable keys on it (submissions,
   * stored programs, the future attempt log). Content-hash identity was
   * rejected: problems are mutable documents (re-oracles rewrite `expected`,
   * statements get reworded) and identity must survive edits.
   */
  id: string;
  /** URL path segment (site renders /problems/<slug>/); human-readable, from the title */
  slug: string;
  title: string;
  attribution?: string;
  /**
   * Open-ended hand grade (no cap — climbing-grade model). This is the PRIOR:
   * once solver identities exist, a Rasch fit over the attempt log becomes the
   * display's source and this demotes to the cold-start value for new problems.
   * Display is always banded (blocks cap at 10 with overflow marker).
   */
  difficulty: number;
  /** prerequisite knowledge tiers (community ladder: arrays, query, lambda, recursion, algorithmic) */
  requires?: string[];
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
  /**
   * Drift-discipline stamp, written by the oracle: `hash` fingerprints the
   * oracle surface (reference + template ranges + case inputs — what determines
   * `expected`), `asOf` is the date the oracle last ran against live Sheets.
   * A stored hash differing from the recomputed one means `expected` is stale.
   */
  verified?: { asOf: string; hash: string };
  compare: ComparePolicy;
  lint?: { ban?: string[] };
  cases: ProblemCase[];
}
