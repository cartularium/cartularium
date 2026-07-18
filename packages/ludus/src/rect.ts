// Rectangular read/write against a live spreadsheet — the judge's two verbs:
// pour a case into INPUT, read the computed OUTPUT back.
import { sheetsApi } from "./api.js";
import { parseRange, rangeCols, rangeRows } from "./a1.js";
import type { ExtendedValue } from "./snapshot.js";

/** scalar cell value in problem definitions; errors read back as "#…!" strings */
export type Scalar = string | number | boolean | null;

export interface SheetIdMap {
  byTitle: Map<string, number>;
}

export async function loadSheetIds(spreadsheetId: string): Promise<SheetIdMap> {
  const doc = (await sheetsApi(
    `/${spreadsheetId}?fields=${encodeURIComponent("sheets(properties(sheetId,title))")}`,
  )) as { sheets?: Array<{ properties: { sheetId: number; title: string } }> };
  return {
    byTitle: new Map((doc.sheets ?? []).map((s) => [s.properties.title, s.properties.sheetId])),
  };
}

// overwrite the entire rect: given rows are padded with clears to the rect size
export async function writeRect(
  spreadsheetId: string,
  ids: SheetIdMap,
  ref: string,
  rows: Scalar[][],
): Promise<void> {
  const range = parseRange(ref);
  const sheetId = ids.byTitle.get(range.sheet);
  if (sheetId === undefined) throw new Error(`No sheet titled "${range.sheet}" in ${spreadsheetId}`);
  const height = rangeRows(range);
  const width = rangeCols(range);
  if (rows.length > height || Math.max(0, ...rows.map((r) => r.length)) > width) {
    throw new Error(`Data (${rows.length} rows) overflows rect ${ref}`);
  }
  await sheetsApi(`/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          updateCells: {
            start: { sheetId, rowIndex: range.startRow, columnIndex: range.startCol },
            rows: Array.from({ length: height }, (_, r) => ({
              values: Array.from({ length: width }, (_, c) => {
                const v = rows[r]?.[c] ?? null;
                return v === null ? {} : { userEnteredValue: scalarToExtended(v) };
              }),
            })),
            fields: "userEnteredValue",
          },
        },
      ],
    }),
  });
}

// computed values; Sheets renders formula errors as "#…!" strings here
export async function readRect(spreadsheetId: string, ref: string): Promise<Scalar[][]> {
  const res = (await sheetsApi(
    `/${spreadsheetId}/values/${encodeURIComponent(ref)}?valueRenderOption=UNFORMATTED_VALUE`,
  )) as { values?: Scalar[][] };
  return res.values ?? [];
}

export function scalarToExtended(v: Exclude<Scalar, null>): ExtendedValue {
  if (typeof v === "number") return { numberValue: v };
  if (typeof v === "boolean") return { boolValue: v };
  if (v.startsWith("=")) return { formulaValue: v };
  return { stringValue: v };
}
