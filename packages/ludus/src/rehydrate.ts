import { sheetsApi, sleep } from "./api.js";
import type { CellSnap, Snapshot } from "./snapshot.js";

const CELLS_PER_REQUEST = 4000;

// Rebuild a snapshot's program in a fresh judge-owned spreadsheet:
// structure via create, content via batchUpdate/updateCells (the same write
// path a pooled scratch sheet would use). Returns the new spreadsheet id.
export async function rehydrate(snapshot: Snapshot, title: string): Promise<string> {
  if (snapshot.namedFunctions.length > 0) {
    throw new Error("rehydration cannot preserve named functions");
  }
  const created = (await sheetsApi("", {
    method: "POST",
    body: JSON.stringify({
      properties: { title, locale: snapshot.locale, timeZone: snapshot.timeZone },
      sheets: snapshot.sheets.map((s) => ({
        properties: {
          title: s.title,
          gridProperties: { rowCount: s.rowCount, columnCount: s.columnCount },
        },
      })),
    }),
  })) as { spreadsheetId: string; sheets: Array<{ properties: { sheetId: number } }> };

  const newId = created.spreadsheetId;
  // map original sheetIds to the new ones (create preserves order)
  const sheetIdMap = new Map<number, number>();
  snapshot.sheets.forEach((s, i) => sheetIdMap.set(s.sheetId, created.sheets[i].properties.sheetId));

  const requests: unknown[] = [];
  for (const nr of snapshot.namedRanges) {
    const sheetId = nr.range.sheetId === undefined ? undefined : sheetIdMap.get(nr.range.sheetId);
    requests.push({
      addNamedRange: { namedRange: { name: nr.name, range: { ...nr.range, sheetId } } },
    });
  }
  for (const sheet of snapshot.sheets) {
    const sheetId = sheetIdMap.get(sheet.sheetId)!;
    requests.push(...updateCellsRequests(sheetId, sheet.cells));
  }

  // sequential, modestly sized batches — pooled-judge write cadence, not a firehose
  for (let i = 0; i < requests.length; i += 10) {
    await sheetsApi(`/${newId}:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ requests: requests.slice(i, i + 10) }),
    });
    if (i + 10 < requests.length) await sleep(200);
  }

  return newId;
}

// chunk a sheet's trimmed grid into updateCells requests by row bands.
// NB: builder grids may be SPARSE (spacer rows are holes) — sparse .map
// skips holes and Math.max over spread holes yields NaN, which silently
// emitted zero requests. Every access must tolerate holes.
function updateCellsRequests(sheetId: number, cells: Array<Array<CellSnap | null>>): unknown[] {
  const requests: unknown[] = [];
  if (cells.length === 0) return requests;
  const cols = Math.max(1, ...Array.from(cells, (row) => row?.length ?? 0));
  const rowsPerChunk = Math.max(1, Math.floor(CELLS_PER_REQUEST / cols));

  for (let start = 0; start < cells.length; start += rowsPerChunk) {
    const band = cells.slice(start, start + rowsPerChunk);
    requests.push({
      updateCells: {
        start: { sheetId, rowIndex: start, columnIndex: 0 },
        rows: Array.from(band, (row) => ({
          values: Array.from({ length: cols }, (_, c) => toApiCell(row?.[c] ?? null)),
        })),
        fields: "userEnteredValue,userEnteredFormat.numberFormat",
      },
    });
  }
  return requests;
}

function toApiCell(snap: CellSnap | null): Record<string, unknown> {
  if (!snap) return {};
  const cell: Record<string, unknown> = {};
  if (snap.ue) cell.userEnteredValue = snap.ue;
  if (snap.fmt) cell.userEnteredFormat = { numberFormat: snap.fmt };
  return cell;
}
