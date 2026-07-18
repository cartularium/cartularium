// Problem definition → template spreadsheet (the sheet users copy).
// The same builder, minus sample data plus reference formula, feeds the oracle.
import { sheetsApi } from "./api.js";
import { parseRange, rangeCols, rangeRows } from "./a1.js";
import type { Problem } from "./problem-types.js";
import { rehydrate } from "./rehydrate.js";
import { loadSheetIds, scalarToExtended, type Scalar } from "./rect.js";
import type { CellSnap, Snapshot } from "./snapshot.js";
import { buildStyleRequests } from "./template-style.js";

export interface TemplateOptions {
  /** sample-case data in INPUT (user template) vs empty INPUT (oracle/judge scratch) */
  sampleInput: boolean;
  /** reference formula at OUTPUT's top-left (oracle only) */
  referenceFormula?: string;
  /** apply the case design language (tab colors, washes, borders, protection) */
  styled?: boolean;
}

export type AboutKind = "title" | "meta" | "section" | "body" | "muted" | "link";

interface AboutLine {
  kind: AboutKind | "spacer";
  text?: string;
  formula?: string;
}

// banded display of the open-ended grade: blocks cap at ten, overflow marks
export function difficultyMeter(d: number): string {
  const blocks = Math.min(d, 10);
  return `${d} › ${"█".repeat(blocks)}${"░".repeat(10 - blocks)}${d > 10 ? "⁺" : ""}`;
}

const CHALLENGE_NOTES: Record<string, string> = {
  oner: "Oner — solve it with a single formula in the output's top-left cell.",
  lambdaless: "LAMBDAless — no LAMBDA and no lambda helper functions.",
  generalized: "Generalized — handle any amount of data, not just this dataset's shape.",
  golfed: "Golfed — minimize total formula length.",
};

function aboutLines(problem: Problem): AboutLine[] {
  const lines: AboutLine[] = [{ kind: "spacer" }];
  lines.push({ kind: "title", text: problem.title });
  const meterParts = [difficultyMeter(problem.difficulty), problem.tags.join(" · ")];
  if (problem.requires?.length) meterParts.push(`requires: ${problem.requires.join(", ")}`);
  lines.push({ kind: "meta", text: meterParts.join("   ") });
  lines.push({ kind: "spacer" });
  for (const paragraph of problem.statement.trim().split(/\n\s*\n/)) {
    for (const line of paragraph.split("\n")) lines.push({ kind: "body", text: line.trim() });
    lines.push({ kind: "spacer" });
  }
  lines.push({ kind: "section", text: "How this works" });
  lines.push({ kind: "body", text: "1.  This is your private copy — work however you like, on any tab." });
  lines.push({ kind: "body", text: "2.  The Input tab (amber) holds the dataset. The grader replaces it with other datasets — never put your own work there." });
  lines.push({ kind: "body", text: "3.  Build your solution so the result lands in the outlined region of the Answer tab (blue). Helper columns and extra tabs are fair game." });
  lines.push({ kind: "body", text: "4.  Check yourself against the gray expected block beside the answer region." });
  lines.push({ kind: "body", text: "5.  When it matches, share this sheet (anyone with the link, Viewer) and submit the link on the problem page." });
  lines.push({ kind: "spacer" });
  if (problem.challenges?.length) {
    lines.push({ kind: "section", text: "Optional challenges" });
    for (const c of problem.challenges) {
      lines.push({ kind: "muted", text: CHALLENGE_NOTES[c] ?? c });
    }
    lines.push({ kind: "spacer" });
  }
  if (problem.attribution) lines.push({ kind: "muted", text: problem.attribution });
  lines.push({
    kind: "link",
    formula: `=HYPERLINK("https://whetstone.sheets.wiki/problems/${problem.id}/", "${problem.id} — problem page")`,
  });
  return lines;
}

export function buildTemplate(
  problem: Problem,
  opts: TemplateOptions,
): { snapshot: Snapshot; aboutKinds: Map<number, AboutKind> } {
  const input = parseRange(problem.template.input);
  const output = parseRange(problem.template.output);
  const grids = new Map<string, Array<Array<CellSnap | null>>>();
  for (const sheet of problem.template.sheets) grids.set(sheet.title, []);

  // About: a cover page, not a grid — prose in column B, margin in column A
  const about = grids.get(problem.template.sheets[0].title)!;
  const aboutKinds = new Map<number, AboutKind>();
  aboutLines(problem).forEach((line, i) => {
    if (line.kind === "spacer") return;
    put(about, i, 1, { ue: line.formula ? { formulaValue: line.formula } : { stringValue: line.text! } });
    aboutKinds.set(i, line.kind);
  });

  if (opts.sampleInput) {
    const sample = problem.cases.find((c) => c.kind === "sample");
    if (!sample) throw new Error(`${problem.id}: no sample case`);
    const inputGrid = grids.get(input.sheet);
    if (!inputGrid) throw new Error(`${problem.id}: input range sheet "${input.sheet}" not in template.sheets`);
    placeScalars(inputGrid, input.startRow, input.startCol, sample.input);

    // expected-sample block: right of OUTPUT, rows aligned, so solvers can
    // eyeball their answer against it (the judge never looks here)
    if (sample.expected) {
      const answerGridForSample = grids.get(output.sheet)!;
      const gapCol = output.endCol + 2;
      if (output.startRow > 0) {
        put(answerGridForSample, output.startRow - 1, gapCol, {
          ue: { stringValue: "Expected output for the sample input — check yourself:" },
        });
      }
      placeScalars(answerGridForSample, output.startRow, gapCol, sample.expected);
    }
  }

  const answerGrid = grids.get(output.sheet);
  if (!answerGrid) throw new Error(`${problem.id}: output range sheet "${output.sheet}" not in template.sheets`);
  if (problem.template.answerHeaders && output.startRow > 0) {
    problem.template.answerHeaders.forEach((h, i) =>
      put(answerGrid, output.startRow - 1, output.startCol + i, { ue: { stringValue: h } }),
    );
  }
  if (opts.referenceFormula) {
    put(answerGrid, output.startRow, output.startCol, {
      ue: { formulaValue: opts.referenceFormula },
    });
  }

  const sheetIndex = new Map(problem.template.sheets.map((s, i) => [s.title, i]));
  const snapshot: Snapshot = {
    spreadsheetId: "",
    title: `whetstone-${problem.id}`,
    locale: "en_US",
    timeZone: "America/Los_Angeles",
    namedRanges: [
      { name: "INPUT", range: toGridRange(sheetIndex.get(input.sheet)!, input) },
      { name: "OUTPUT", range: toGridRange(sheetIndex.get(output.sheet)!, output) },
    ],
    sheets: problem.template.sheets.map((sheet, i) => {
      const cells = grids.get(sheet.title)!;
      return {
        sheetId: i,
        title: sheet.title,
        rowCount: Math.max(cells.length + 20, 100),
        columnCount: 26,
        cells,
      };
    }),
  };
  return { snapshot, aboutKinds };
}

export function buildTemplateSnapshot(problem: Problem, opts: TemplateOptions): Snapshot {
  return buildTemplate(problem, opts).snapshot;
}

export async function createFromTemplate(
  problem: Problem,
  title: string,
  opts: TemplateOptions,
): Promise<string> {
  const { snapshot, aboutKinds } = buildTemplate(problem, opts);
  const id = await rehydrate(snapshot, title);
  if (opts.styled) {
    const ids = await loadSheetIds(id);
    const requests = buildStyleRequests(problem, ids.byTitle, aboutKinds);
    for (let i = 0; i < requests.length; i += 10) {
      await sheetsApi(`/${id}:batchUpdate`, {
        method: "POST",
        body: JSON.stringify({ requests: requests.slice(i, i + 10) }),
      });
    }
  }
  return id;
}

function toGridRange(sheetId: number, r: ReturnType<typeof parseRange>) {
  return {
    sheetId,
    startRowIndex: r.startRow,
    endRowIndex: r.endRow + 1,
    startColumnIndex: r.startCol,
    endColumnIndex: r.endCol + 1,
  };
}

function put(grid: Array<Array<CellSnap | null>>, row: number, col: number, cell: CellSnap): void {
  grid[row] ??= [];
  grid[row][col] = cell;
}

function placeScalars(
  grid: Array<Array<CellSnap | null>>,
  startRow: number,
  startCol: number,
  rows: Scalar[][],
): void {
  rows.forEach((r, i) =>
    r.forEach((v, j) => {
      if (v !== null) put(grid, startRow + i, startCol + j, { ue: scalarToExtended(v) });
    }),
  );
}

export function rectSize(ref: string): { rows: number; cols: number } {
  const r = parseRange(ref);
  return { rows: rangeRows(r), cols: rangeCols(r) };
}
