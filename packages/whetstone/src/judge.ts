// The judge pipeline: extract → lint → rehydrate → run hidden cases → verdict.
import { sleep } from "./api.js";
import { parseRange } from "./a1.js";
import { compareGrids, type GridComparison } from "./compare.js";
import { extractSnapshot } from "./extract.js";
import type { Problem } from "./problem.js";
import { rehydrate } from "./rehydrate.js";
import { loadSheetIds, readRect, writeRect } from "./rect.js";
import type { Snapshot } from "./snapshot.js";

export type Verdict =
  | "accepted"
  | "wrong-answer"
  | "lint-reject"
  | "sheet-inaccessible"
  | "template-damaged";

export interface CaseResult {
  kind: "sample" | "hidden";
  comparison: GridComparison;
}

export interface JudgeResult {
  verdict: Verdict;
  lintErrors: string[];
  cases: CaseResult[];
  scratchId?: string;
}

const BAN_PATTERNS: Record<string, RegExp> = {
  volatile: /\b(NOW|TODAY|RAND|RANDBETWEEN|RANDARRAY)\s*\(/i,
  import: /\bIMPORT(RANGE|DATA|XML|HTML|FEED)\s*\(/i,
  // external fetch: exfiltration channel, and errors anyway in API-created
  // scratch sheets that have never been opened in a browser (observed: IMAGE
  // returns #REF! "use a desktop web browser to allow access")
  external: /\b(IMAGE|GOOGLEFINANCE|GOOGLETRANSLATE|DETECTLANGUAGE)\s*\(/i,
};

export async function judge(problem: Problem, userSpreadsheetId: string): Promise<JudgeResult> {
  let program: Snapshot;
  try {
    program = await extractSnapshot(userSpreadsheetId);
  } catch (err) {
    return {
      verdict: "sheet-inaccessible",
      lintErrors: [String(err instanceof Error ? err.message : err)],
      cases: [],
    };
  }

  const structural = checkStructure(problem, program);
  if (structural.length > 0) {
    return { verdict: "template-damaged", lintErrors: structural, cases: [] };
  }

  const lintErrors = lint(problem, program);
  if (lintErrors.length > 0) {
    return { verdict: "lint-reject", lintErrors, cases: [] };
  }

  // rehydrate the user's program into a judge-owned scratch sheet
  const scratchId = await rehydrate(program, `whetstone-judge-${problem.id}`);
  const ids = await loadSheetIds(scratchId);

  const cases: CaseResult[] = [];
  for (const c of problem.cases) {
    if (!c.expected) throw new Error(`case has no expected output — run the oracle first`);
    await writeRect(scratchId, ids, problem.template.input, c.input);
    await sleep(800);
    let out = await readRect(scratchId, problem.template.output);
    if (out.length === 0) {
      await sleep(1500);
      out = await readRect(scratchId, problem.template.output);
    }
    cases.push({ kind: c.kind, comparison: compareGrids(c.expected, out, problem.compare) });
  }

  return {
    verdict: cases.every((c) => c.comparison.pass) ? "accepted" : "wrong-answer",
    lintErrors: [],
    cases,
    scratchId,
  };
}

// the INPUT/OUTPUT named ranges must still exist and match the problem definition
function checkStructure(problem: Problem, program: Snapshot): string[] {
  const errors: string[] = [];
  for (const [name, ref] of [
    ["INPUT", problem.template.input],
    ["OUTPUT", problem.template.output],
  ] as const) {
    const want = parseRange(ref);
    const sheet = program.sheets.find((s) => s.title === want.sheet);
    if (!sheet) {
      errors.push(`sheet "${want.sheet}" is missing — did you rename or delete a tab?`);
      continue;
    }
    const nr = program.namedRanges.find((r) => r.name === name);
    if (!nr) {
      errors.push(`named range ${name} is missing — did you delete it?`);
      continue;
    }
    const r = nr.range;
    const matches =
      r.sheetId === sheet.sheetId &&
      r.startRowIndex === want.startRow &&
      (r.endRowIndex ?? 0) === want.endRow + 1 &&
      r.startColumnIndex === want.startCol &&
      (r.endColumnIndex ?? 0) === want.endCol + 1;
    if (!matches) errors.push(`named range ${name} was moved — expected ${ref}`);
  }
  return errors;
}

function lint(problem: Problem, program: Snapshot): string[] {
  const errors: string[] = [];
  const banned = (problem.lint?.ban ?? []).map((name) => {
    const pattern = BAN_PATTERNS[name];
    if (!pattern) throw new Error(`unknown lint ban class "${name}"`);
    return { name, pattern };
  });
  const input = parseRange(problem.template.input);

  for (const sheet of program.sheets) {
    sheet.cells.forEach((row, r) =>
      row.forEach((cell, c) => {
        const formula = cell?.ue?.formulaValue;
        if (!formula) return;
        for (const ban of banned) {
          if (ban.pattern.test(formula)) {
            errors.push(`${sheet.title}!R${r + 1}C${c + 1}: banned function class "${ban.name}" in ${formula.slice(0, 40)}`);
          }
        }
        const inInput =
          sheet.title === input.sheet &&
          r >= input.startRow &&
          r <= input.endRow &&
          c >= input.startCol &&
          c <= input.endCol;
        if (inInput) {
          errors.push(`${sheet.title}!R${r + 1}C${c + 1}: formula inside INPUT — INPUT is overwritten by the grader`);
        }
      }),
    );
  }
  return errors;
}
