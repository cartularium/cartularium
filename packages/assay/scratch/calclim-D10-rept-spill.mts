import { makeDriver, renderOutcome, SPREADSHEET_ID } from "./calclim-lib.mts";
import { getAccessToken } from "../src/auth.js";

const d = await makeDriver();
async function probe(label: string, formula: string) {
  const t0 = Date.now();
  const [r] = await d.evaluateBatch([{ formula }]);
  const p = (r.outcome as any).grid?.[0]?.[0]?.primitive;
  const shown = p?.kind === "number" ? `OK num=${p.value}` : renderOutcome(r.outcome).split("\n")[0];
  console.log(`${label}\t-> ${shown}\t(${Date.now() - t0}ms)`);
}

console.log("=== REPT cutoff narrow (32000 OK .. 32700 fail) ===");
for (const n of [32300, 32500, 32690, 32695, 32697] ) {
  await probe(`rept-${n}`, `=LEN(REPT("a",${n}))`);
}

// === D5 spill-vs-sheet-bounds via raw API: fixed 100-row sheet ===
console.log("=== spill vs sheet bounds (custom 100-row sheet) ===");
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
// create a sheet with exactly 100 rows, 2 cols
const stamp = Date.now();
const title = `calclim-spill-${stamp}`;
const add = await api(":batchUpdate", {
  method: "POST",
  body: JSON.stringify({ requests: [{ addSheet: { properties: { title, gridProperties: { rowCount: 100, columnCount: 2 } } } }] }),
});
const sheetId = add.replies[0].addSheet.properties.sheetId as number;
try {
  async function spillProbe(label: string, formula: string) {
    await api(`/values/'${title}'!A1?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      body: JSON.stringify({ values: [[formula]] }),
    });
    await new Promise((r) => setTimeout(r, 800));
    const read = await api(`/values/'${title}'!A1?valueRenderOption=FORMATTED_VALUE`, { method: "GET" });
    const v = read.values?.[0]?.[0];
    console.log(`${label}\t${formula}\t-> A1=${JSON.stringify(v)}`);
    // clear
    await api(`/values/'${title}'!A1?valueInputOption=RAW`, { method: "PUT", body: JSON.stringify({ values: [[""]] }) });
  }
  await spillProbe("spill-fit-100", "=SEQUENCE(100)"); // fills rows 1..100 exactly
  await spillProbe("spill-over-101", "=SEQUENCE(101)"); // needs row 101 -> beyond grid
  await spillProbe("spill-over-200", "=SEQUENCE(200)");
} finally {
  await api(":batchUpdate", { method: "POST", body: JSON.stringify({ requests: [{ deleteSheet: { sheetId } }] }) }).catch(() => {});
}
