import type { Snapshot } from "./snapshot.js";

export interface SolutionMetrics {
  formulaCharacters: number;
  formulaCells: number;
  functions: string[];
}

export interface Distribution {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
}

export interface FunctionCensusEntry {
  name: string;
  solutions: number;
  percent: number;
}

export interface PostSolveStats {
  sampleSize: number;
  minimumSampleSize: number;
  current: SolutionMetrics;
  cohort: null | {
    formulaCharacters: Distribution;
    formulaCells: Distribution;
    functions: FunctionCensusEntry[];
  };
}

export const MIN_STATS_SAMPLE = 3;

// The generated About link is template furniture, not solver-written code.
const TEMPLATE_FORMULA = /^=HYPERLINK\("https:\/\/ludus\.sheets\.wiki\/problems\//i;

export function measureSolution(snapshot: Pick<Snapshot, "sheets">): SolutionMetrics {
  const formulas = snapshot.sheets.flatMap((sheet) =>
    sheet.cells.flatMap((row) =>
      row.flatMap((cell) => {
        const formula = cell?.ue?.formulaValue;
        return formula && !TEMPLATE_FORMULA.test(formula) ? [formula] : [];
      }),
    ),
  );
  const functions = new Set<string>();
  for (const formula of formulas) {
    for (const name of functionNames(formula)) functions.add(name);
  }
  return {
    formulaCharacters: formulas.reduce((sum, formula) => sum + formula.length, 0),
    formulaCells: formulas.length,
    functions: [...functions].sort(),
  };
}

export function buildPostSolveStats(
  current: SolutionMetrics,
  accepted: SolutionMetrics[],
  minimumSampleSize = MIN_STATS_SAMPLE,
): PostSolveStats {
  const valid = accepted.filter(isSolutionMetrics);
  if (valid.length < minimumSampleSize) {
    return { sampleSize: valid.length, minimumSampleSize, current, cohort: null };
  }

  const uses = new Map<string, number>();
  for (const solution of valid) {
    for (const name of new Set(solution.functions)) uses.set(name, (uses.get(name) ?? 0) + 1);
  }
  const functions = [...uses].map(([name, solutions]) => ({
    name,
    solutions,
    percent: Math.round((solutions / valid.length) * 100),
  }));
  functions.sort((a, b) => b.solutions - a.solutions || a.name.localeCompare(b.name));

  return {
    sampleSize: valid.length,
    minimumSampleSize,
    current,
    cohort: {
      formulaCharacters: distribution(valid.map((solution) => solution.formulaCharacters)),
      formulaCells: distribution(valid.map((solution) => solution.formulaCells)),
      functions,
    },
  };
}

export function isSolutionMetrics(value: unknown): value is SolutionMetrics {
  if (!value || typeof value !== "object") return false;
  const metrics = value as Partial<SolutionMetrics>;
  return (
    Number.isInteger(metrics.formulaCharacters) &&
    metrics.formulaCharacters! >= 0 &&
    Number.isInteger(metrics.formulaCells) &&
    metrics.formulaCells! >= 0 &&
    Array.isArray(metrics.functions) &&
    metrics.functions.every((name) => typeof name === "string")
  );
}

function distribution(values: number[]): Distribution {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0],
    p25: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    p75: quantile(sorted, 0.75),
    max: sorted.at(-1)!,
  };
}

function quantile(sorted: number[], q: number): number {
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const value = sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  return Number.isInteger(value) ? value : Number(value.toFixed(1));
}

function functionNames(formula: string): string[] {
  const withoutStrings = formula.replace(/"(?:[^"]|"")*"/g, "");
  return [...withoutStrings.matchAll(/(?:^|[^A-Z0-9_.])((?:_xlfn\.)?[A-Z][A-Z0-9_.]*)\s*\(/gi)].map(
    (match) => match[1].replace(/^_xlfn\./i, "").toUpperCase(),
  );
}
