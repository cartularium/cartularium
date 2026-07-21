// The judge pipeline: extract → inspect → lint → rehydrate → hidden cases → verdict.
import { sleep, UnsupportedWorkbookError } from "./api.js";
import { parseRange } from "./a1.js";
import { compareGrids, type GridComparison } from "./compare.js";
import { extractSnapshot } from "./extract.js";
import {
  UnsupportedMaterializationError,
  type UnsupportedMaterializationDetail,
} from "./materialization.js";
import type { Problem } from "./problem-types.js";
import { rehydrate } from "./rehydrate.js";
import { loadSheetIds, readRect, writeRect } from "./rect.js";
import type { Snapshot } from "./snapshot.js";
import { extractNamedFunctions } from "./workbook-features.js";

export type Verdict =
  | "accepted"
  | "wrong-answer"
  | "lint-reject"
  | "unsupported-feature"
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
  unsupportedFeature?: UnsupportedMaterializationDetail;
  scratchId?: string;
  /** the extracted program (absent only when the sheet was inaccessible) */
  program?: Snapshot;
}

interface JudgeDependencies {
  extractSnapshot: typeof extractSnapshot;
  extractNamedFunctions: typeof extractNamedFunctions;
  prepareNamedFunctions: (snapshot: Snapshot) => Snapshot | Promise<Snapshot>;
  rehydrate: typeof rehydrate;
}

const BAN_PATTERNS: Record<string, RegExp> = {
  volatile: /\b(NOW|TODAY|RAND|RANDBETWEEN|RANDARRAY)\s*\(/i,
  import: /\bIMPORT(RANGE|DATA|XML|HTML|FEED)\s*\(/i,
  // external fetch: exfiltration channel, and errors anyway in API-created
  // scratch sheets that have never been opened in a browser (observed: IMAGE
  // returns #REF! "use a desktop web browser to allow access")
  external: /\b(IMAGE|GOOGLEFINANCE|GOOGLETRANSLATE|DETECTLANGUAGE)\s*\(/i,
};

export async function judge(
  problem: Problem,
  userSpreadsheetId: string,
  dependencies: Partial<JudgeDependencies> = {},
): Promise<JudgeResult> {
  const extract = dependencies.extractSnapshot ?? extractSnapshot;
  const inspectNamedFunctions = dependencies.extractNamedFunctions ?? extractNamedFunctions;
  const materialize = dependencies.rehydrate ?? rehydrate;
  let program: Snapshot;
  try {
    program = await extract(userSpreadsheetId);
  } catch (err) {
    return {
      verdict: "sheet-inaccessible",
      lintErrors: [String(err instanceof Error ? err.message : err)],
      cases: [],
    };
  }

  const structural = checkStructure(problem, program);
  if (structural.length > 0) {
    return { verdict: "template-damaged", lintErrors: structural, cases: [], program };
  }

  try {
    program.namedFunctions = await inspectNamedFunctions(userSpreadsheetId);
  } catch (err) {
    if (!(err instanceof UnsupportedWorkbookError)) throw err;
    return { verdict: "unsupported-feature", lintErrors: [err.message], cases: [], program };
  }
  let executable = program;
  const prepareNamedFunctions = dependencies.prepareNamedFunctions;
  if (program.namedFunctions.length > 0 && !prepareNamedFunctions) {
    const allNames = program.namedFunctions.map((fn) => fn.name).sort();
    const names = allNames.slice(0, 20).join(", ") + (allNames.length > 20 ? `, and ${allNames.length - 20} more` : "");
    return {
      verdict: "unsupported-feature",
      lintErrors: [`named functions are not supported yet: ${names}`],
      cases: [],
      unsupportedFeature: { feature: "named-functions", code: "materializer-unavailable" },
      program,
    };
  }

  if (program.namedFunctions.length > 0 && prepareNamedFunctions) {
    try {
      executable = await prepareNamedFunctions(program);
    } catch (err) {
      if (!(err instanceof UnsupportedMaterializationError)) throw err;
      return {
        verdict: "unsupported-feature",
        lintErrors: [err.message],
        cases: [],
        unsupportedFeature: err.detail,
        program,
      };
    }
  }

  const lintErrors = lint(problem, executable);
  if (lintErrors.length > 0) {
    return { verdict: "lint-reject", lintErrors, cases: [], program };
  }

  // rehydrate the user's program into a judge-owned scratch sheet
  const scratchId = await materialize(executable, `ludus-judge-${problem.id}`);
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
    program,
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

// a window of the formula around the offending match — a blind prefix slice
// once hid the banned call entirely when it sat past the cut
function excerptAround(formula: string, at: number, matchLen: number): string {
  const start = Math.max(0, at - 20);
  const end = Math.min(formula.length, at + matchLen + 30);
  return (start > 0 ? "…" : "") + formula.slice(start, end) + (end < formula.length ? "…" : "");
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
          const hit = formula.match(ban.pattern);
          if (hit) {
            errors.push(
              `${sheet.title}!R${r + 1}C${c + 1}: banned function class "${ban.name}" — ${excerptAround(formula, hit.index ?? 0, hit[0].length)}`,
            );
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
