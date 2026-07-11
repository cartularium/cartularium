import { SPREADSHEET_ID } from "./calclim-lib.mts";
import { getAccessToken } from "../src/auth.js";

const token = (await getAccessToken())!;
const base = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
async function api(path: string, init: RequestInit) {
  const res = await fetch(base + path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

// A FRESH sheet per probe so no prior write contaminates the spill target.
async function cleanSpill(rows: number, seq: number) {
  const title = `calclim-cs-${Date.now()}-${seq}`;
  const add = await api(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title, gridProperties: { rowCount: rows, columnCount: 2 } } } }] }),
  });
  const sheetId = add.replies[0].addSheet.properties.sheetId as number;
  try {
    await api(`/values/'${title}'!A1?valueInputOption=USER_ENTERED`, { method: "PUT", body: JSON.stringify({ values: [["=SEQUENCE(" + seq + ")"]] }) });
    await new Promise((r) => setTimeout(r, 900));
    const read = await api(`/values/'${title}'!A1:A${seq + 5}?valueRenderOption=FORMATTED_VALUE`, { method: "GET" });
    const vals = read.values ?? [];
    const meta = await api(`?fields=sheets(properties(gridProperties(rowCount)))&ranges='${title}'!A1`, { method: "GET" });
    const rc = meta.sheets?.[0]?.properties?.gridProperties?.rowCount;
    console.log(`sheetRows=${rows} SEQUENCE(${seq})\tA1=${JSON.stringify(vals[0]?.[0])}\tfilled=${vals.length}\trowCountAfter=${rc}`);
  } finally {
    await api(":batchUpdate", { method: "POST", body: JSON.stringify({ requests: [{ deleteSheet: { sheetId } }] }) }).catch(() => {});
  }
}
await cleanSpill(50, 50);  // exact fit
await cleanSpill(50, 51);  // one over
await cleanSpill(50, 200); // far over
