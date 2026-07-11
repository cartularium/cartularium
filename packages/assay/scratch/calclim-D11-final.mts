import { makeDriver, renderOutcome, SPREADSHEET_ID } from "./calclim-lib.mts";
import { getAccessToken } from "../src/auth.js";

const d = await makeDriver();
async function probe(label: string, formula: string) {
  const [r] = await d.evaluateBatch([{ formula }]);
  const p = (r.outcome as any).grid?.[0]?.[0]?.primitive;
  const shown = p?.kind === "number" ? `OK num=${p.value}` : renderOutcome(r.outcome).split("\n")[0];
  console.log(`${label}\t-> ${shown}`);
}

console.log("=== REPT precise bisection ===");
for (const n of [32000, 32100, 32200, 32250, 32300]) {
  await probe(`rept-${n}`, `=LEN(REPT("a",${n}))`);
}

console.log("=== spill vs sheet bounds: read full column + rowCount ===");
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
const title = `calclim-spill2-${Date.now()}`;
const add = await api(":batchUpdate", {
  method: "POST",
  body: JSON.stringify({ requests: [{ addSheet: { properties: { title, gridProperties: { rowCount: 100, columnCount: 2 } } } }] }),
});
const sheetId = add.replies[0].addSheet.properties.sheetId as number;
try {
  for (const [label, formula] of [["fit-100", "=SEQUENCE(100)"], ["over-101", "=SEQUENCE(101)"], ["over-500", "=SEQUENCE(500)"]] as const) {
    await api(`/values/'${title}'!A1?valueInputOption=USER_ENTERED`, { method: "PUT", body: JSON.stringify({ values: [[formula]] }) });
    await new Promise((r) => setTimeout(r, 900));
    // read A1 + how many filled + grid rowCount
    const read = await api(`/values/'${title}'!A1:A600?valueRenderOption=FORMATTED_VALUE`, { method: "GET" });
    const rows = read.values ?? [];
    const meta = await api(`?fields=sheets(properties(title,gridProperties(rowCount)))&ranges='${title}'!A1`, { method: "GET" });
    const rc = meta.sheets?.[0]?.properties?.gridProperties?.rowCount;
    console.log(`${label}\t${formula}\tA1=${JSON.stringify(rows[0]?.[0])}\tfilledCells=${rows.length}\tsheetRowCount=${rc}`);
    await api(`/values/'${title}'!A1:A600?valueInputOption=RAW`, { method: "PUT", body: JSON.stringify({ values: Array(600).fill([""]) }) }).catch(() => {});
  }
} finally {
  await api(":batchUpdate", { method: "POST", body: JSON.stringify({ requests: [{ deleteSheet: { sheetId } }] }) }).catch(() => {});
}
