import { sheetsApi } from "./api.js";
import type { CellSnap, ExtendedValue, NumberFormat, Snapshot } from "./snapshot.js";

const FIELDS = [
  "properties(title,locale,timeZone),",
  "namedRanges(name,range),",
  "sheets(",
  "properties(sheetId,title,gridProperties(rowCount,columnCount)),",
  "data(rowData(values(",
  "userEnteredValue,userEnteredFormat(numberFormat),effectiveValue,formattedValue",
  "))))",
].join("");

interface ApiCell {
  userEnteredValue?: ExtendedValue;
  userEnteredFormat?: { numberFormat?: NumberFormat };
  effectiveValue?: ExtendedValue;
  formattedValue?: string;
}

export async function extractSnapshot(spreadsheetId: string): Promise<Snapshot> {
  const doc = (await sheetsApi(
    `/${spreadsheetId}?includeGridData=true&fields=${encodeURIComponent(FIELDS)}`,
  )) as {
    properties?: { title?: string; locale?: string; timeZone?: string };
    namedRanges?: Snapshot["namedRanges"];
    sheets?: Array<{
      properties: { sheetId: number; title: string; gridProperties?: { rowCount?: number; columnCount?: number } };
      data?: Array<{ rowData?: Array<{ values?: ApiCell[] }> }>;
    }>;
  };

  return {
    spreadsheetId,
    title: doc.properties?.title ?? "(untitled)",
    locale: doc.properties?.locale,
    timeZone: doc.properties?.timeZone,
    namedRanges: doc.namedRanges ?? [],
    namedFunctions: [],
    sheets: (doc.sheets ?? []).map((sheet) => {
      const rowData = sheet.data?.[0]?.rowData ?? [];
      const cells = trim(rowData.map((row) => (row.values ?? []).map(toCellSnap)));
      return {
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        rowCount: sheet.properties.gridProperties?.rowCount ?? 1000,
        columnCount: sheet.properties.gridProperties?.columnCount ?? 26,
        cells,
      };
    }),
  };
}

function toCellSnap(cell: ApiCell): CellSnap | null {
  const snap: CellSnap = {};
  if (cell.userEnteredValue) snap.ue = cell.userEnteredValue;
  if (cell.userEnteredFormat?.numberFormat) snap.fmt = cell.userEnteredFormat.numberFormat;
  if (cell.effectiveValue) snap.ev = cell.effectiveValue;
  if (cell.formattedValue !== undefined) snap.fv = cell.formattedValue;
  return Object.keys(snap).length > 0 ? snap : null;
}

// drop trailing empty rows/columns so snapshots stay proportional to content
function trim(cells: Array<Array<CellSnap | null>>): Array<Array<CellSnap | null>> {
  let lastRow = -1;
  let lastCol = -1;
  cells.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) {
        lastRow = Math.max(lastRow, r);
        lastCol = Math.max(lastCol, c);
      }
    });
  });
  return cells.slice(0, lastRow + 1).map((row) => row.slice(0, lastCol + 1));
}
