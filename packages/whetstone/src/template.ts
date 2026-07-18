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

export function buildTemplateSnapshot(problem: Problem, opts: TemplateOptions): Snapshot {
  const input = parseRange(problem.template.input);
  const output = parseRange(problem.template.output);
  const grids = new Map<string, Array<Array<CellSnap | null>>>();
  for (const sheet of problem.template.sheets) grids.set(sheet.title, []);

  // About sheet: statement + the one rule
  const about = grids.get(problem.template.sheets[0].title)!;
  put(about, 1, 1, { ue: { stringValue: problem.title } });
  put(about, 2, 1, {
    ue: {
      stringValue: `${problem.difficulty} › ${"█".repeat(problem.difficulty)}${"░".repeat(10 - problem.difficulty)}   ${problem.tags.join(" · ")}`,
    },
  });
  problem.statement
    .trimEnd()
    .split("\n")
    .forEach((line, i) => put(about, 4 + i, 1, { ue: { stringValue: line } }));
  let row = 5 + problem.statement.trimEnd().split("\n").length;
  put(about, row++, 1, {
    ue: {
      stringValue:
        `Inputs are in ${problem.template.input} (named range INPUT); your answer goes in ` +
        `${problem.template.output} (named range OUTPUT).`,
    },
  });
  put(about, row++, 1, {
    ue: {
      stringValue:
        "The grader swaps INPUT for other datasets — everything must still work. " +
        "Never put your own content inside INPUT.",
    },
  });
  if (problem.challenges?.length) {
    put(about, ++row, 1, { ue: { stringValue: `Optional challenges: ${problem.challenges.join(", ")}` } });
  }
  if (problem.attribution) {
    put(about, row + 2, 1, { ue: { stringValue: problem.attribution } });
  }
  // provenance + link back to the problem page
  put(about, row + 4, 1, {
    ue: {
      formulaValue: `=HYPERLINK("https://whetstone.sheets.wiki/problems/${problem.id}/", "${problem.id} — problem page, template v1")`,
    },
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
  return {
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
}

export async function createFromTemplate(
  problem: Problem,
  title: string,
  opts: TemplateOptions,
): Promise<string> {
  const id = await rehydrate(buildTemplateSnapshot(problem, opts), title);
  if (opts.styled) {
    const ids = await loadSheetIds(id);
    const requests = buildStyleRequests(problem, ids.byTitle);
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
