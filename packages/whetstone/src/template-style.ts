// The case design language, as batchUpdate requests. The rule of the palette:
// colored wash = machine territory (INPUT gets overwritten), gray wash =
// reference material (expected sample), unfilled = the solver's canvas.
// Hues are provisional pending the family design pass; the *language* is not.
import { parseRange, type RangeRef } from "./a1.js";
import type { Problem } from "./problem-types.js";

interface Rgb {
  red: number;
  green: number;
  blue: number;
}

const INPUT_WASH: Rgb = { red: 0.996, green: 0.953, blue: 0.878 }; // warm amber
const INPUT_EDGE: Rgb = { red: 0.85, green: 0.6, blue: 0.13 };
const OUTPUT_EDGE: Rgb = { red: 0.26, green: 0.52, blue: 0.96 }; // clear blue
const EXPECTED_WASH: Rgb = { red: 0.94, green: 0.94, blue: 0.94 };
const MUTED_TEXT: Rgb = { red: 0.42, green: 0.42, blue: 0.42 };
const NEUTRAL_TAB: Rgb = { red: 0.62, green: 0.62, blue: 0.62 };

export function buildStyleRequests(problem: Problem, sheetIds: Map<string, number>): unknown[] {
  const input = parseRange(problem.template.input);
  const output = parseRange(problem.template.output);
  const aboutId = sheetIds.get(problem.template.sheets[0].title)!;
  const inputId = sheetIds.get(input.sheet)!;
  const outputId = sheetIds.get(output.sheet)!;
  const requests: unknown[] = [];

  // tabs carry the territory colors
  requests.push(tabColor(aboutId, NEUTRAL_TAB), tabColor(inputId, INPUT_EDGE), tabColor(outputId, OUTPUT_EDGE));

  // INPUT: wash + border + warning-protection; freeze its header row when it has one
  const inputRect = gridRange(inputId, input);
  requests.push(
    {
      repeatCell: {
        range: inputRect,
        cell: { userEnteredFormat: { backgroundColorStyle: { rgbColor: INPUT_WASH } } },
        fields: "userEnteredFormat.backgroundColorStyle",
      },
    },
    borders(inputRect, INPUT_EDGE),
    {
      addProtectedRange: {
        protectedRange: {
          range: inputRect,
          warningOnly: true,
          description:
            "INPUT — the grader replaces this region with other datasets. Don't put your own work here.",
        },
      },
    },
  );
  if (input.startRow === 0) requests.push(freezeRows(inputId, 1));

  // OUTPUT: border only (it's the solver's canvas), bold frozen headers above
  const outputRect = gridRange(outputId, output);
  requests.push(borders(outputRect, OUTPUT_EDGE));
  if (problem.template.answerHeaders && output.startRow > 0) {
    requests.push(
      {
        repeatCell: {
          range: {
            sheetId: outputId,
            startRowIndex: output.startRow - 1,
            endRowIndex: output.startRow,
            startColumnIndex: output.startCol,
            endColumnIndex: output.startCol + problem.template.answerHeaders.length,
          },
          cell: { userEnteredFormat: { textFormat: { bold: true } } },
          fields: "userEnteredFormat.textFormat.bold",
        },
      },
      freezeRows(outputId, output.startRow),
    );
  }

  // expected-sample block: gray wash + muted italic label
  const sample = problem.cases.find((c) => c.kind === "sample");
  if (sample?.expected) {
    const gapCol = output.endCol + 2;
    const rows = sample.expected.length;
    const cols = Math.max(1, ...sample.expected.map((r) => r.length));
    requests.push({
      repeatCell: {
        range: {
          sheetId: outputId,
          startRowIndex: output.startRow,
          endRowIndex: output.startRow + rows,
          startColumnIndex: gapCol,
          endColumnIndex: gapCol + cols,
        },
        cell: { userEnteredFormat: { backgroundColorStyle: { rgbColor: EXPECTED_WASH } } },
        fields: "userEnteredFormat.backgroundColorStyle",
      },
    });
    if (output.startRow > 0) {
      requests.push({
        repeatCell: {
          range: {
            sheetId: outputId,
            startRowIndex: output.startRow - 1,
            endRowIndex: output.startRow,
            startColumnIndex: gapCol,
            endColumnIndex: gapCol + Math.max(cols, 6),
          },
          cell: {
            userEnteredFormat: {
              textFormat: { italic: true, foregroundColorStyle: { rgbColor: MUTED_TEXT } },
            },
          },
          fields: "userEnteredFormat.textFormat",
        },
      });
    }
  }

  // About typography: display title, mono meter/provenance, everything else default
  requests.push(
    styleCell(aboutId, 1, 1, { bold: true, fontSize: 18 }),
    styleCell(aboutId, 2, 1, { fontFamily: "IBM Plex Mono", fontSize: 9 }),
  );

  return requests;
}

function tabColor(sheetId: number, rgb: Rgb): unknown {
  return {
    updateSheetProperties: {
      properties: { sheetId, tabColorStyle: { rgbColor: rgb } },
      fields: "tabColorStyle",
    },
  };
}

function freezeRows(sheetId: number, count: number): unknown {
  return {
    updateSheetProperties: {
      properties: { sheetId, gridProperties: { frozenRowCount: count } },
      fields: "gridProperties.frozenRowCount",
    },
  };
}

function borders(range: unknown, rgb: Rgb): unknown {
  const side = { style: "SOLID_MEDIUM", colorStyle: { rgbColor: rgb } };
  return { updateBorders: { range, top: side, bottom: side, left: side, right: side } };
}

function styleCell(
  sheetId: number,
  row: number,
  col: number,
  textFormat: Record<string, unknown>,
): unknown {
  return {
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: row,
        endRowIndex: row + 1,
        startColumnIndex: col,
        endColumnIndex: col + 1,
      },
      cell: { userEnteredFormat: { textFormat } },
      fields: "userEnteredFormat.textFormat",
    },
  };
}

function gridRange(sheetId: number, r: RangeRef) {
  return {
    sheetId,
    startRowIndex: r.startRow,
    endRowIndex: r.endRow + 1,
    startColumnIndex: r.startCol,
    endColumnIndex: r.endCol + 1,
  };
}
