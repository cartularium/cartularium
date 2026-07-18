#!/usr/bin/env node
// One-shot probe: sheet-dimension semantics (L-4 design input, 2026-06-12).
// gsheets sheets carry explicit gridProperties (rowCount × columnCount).
// What do dimensions mean to the formula language?
//   - shape reads of open ranges (ROWS(B:B), COLUMNS(1:1)) — dims-clamped?
//   - out-of-bounds references (point, range, INDIRECT, OFFSET, INDEX)
//   - spill past the edge (rows and columns)
//   - live resize (appendDimension) — do shape reads / blocked spills recalc?
//   - default dims of a fresh sheet
//
// Run with: node packages/assay/scripts/probes/gsheets-grid-dims.mjs
// Requires: ~/.assayrc.json with a refresh_token (refreshes inline) and
// credentials.json at the assay package root.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN_PATH = join(homedir(), ".assayrc.json");
const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const DEFAULT_SPREADSHEET_ID = "1V0Ix6FCctJJr20WPlxpgyuyD3I8oxJb0lMOF0Fe5LZQ";
const CALC_WAIT_MS = 1200;
const SHEET_PREFIX = "grid-dims-probe";

// Probe sheet is created 50 rows × 8 columns (last cell H50).
const ROWS0 = 50, COLS0 = 8;

const SETUP = [
  { cell: "B1", value: "10" },
  { cell: "B2", value: "20" },
  { cell: "H50", value: "99" }, // write at the exact last cell
];

const PROBES = [
  { cell: "A1",  formula: "=ROWS(B:B)",          label: "rows-open-col" },          // dims-clamped → 50?
  { cell: "A2",  formula: "=COLUMNS(1:1)",       label: "cols-open-row" },          // → 8?
  { cell: "A3",  formula: "=ROWS(A1:A)",         label: "rows-open-rect" },
  { cell: "A4",  formula: "=COLUMNS(C2:9)",      label: "cols-open-rect" },         // C..H → 6?
  { cell: "A5",  formula: "=I1",                 label: "point-ref-out-cols" },     // col 9 of 8
  { cell: "A6",  formula: "=A51",                label: "point-ref-out-rows" },     // row 51 of 50
  { cell: "A7",  formula: "=SUM(I:I)",           label: "open-col-out-of-grid" },
  { cell: "A8",  formula: "=SUM(A51:A60)",       label: "range-out-of-rows" },
  { cell: "A9",  formula: "=OFFSET(A1,-1,0)",    label: "offset-above-top" },
  { cell: "A10", formula: "=OFFSET(A1,50,0)",    label: "offset-past-bottom" },     // → A51
  { cell: "A11", formula: "=OFFSET(H1,0,1)",     label: "offset-past-right" },      // → I1
  { cell: "A12", formula: '=INDIRECT("A51")',    label: "indirect-out-rows" },
  { cell: "A13", formula: '=INDIRECT("I1")',     label: "indirect-out-cols" },
  { cell: "A14", formula: '=ROWS(INDIRECT("B:B"))', label: "rows-indirect-open" },
  { cell: "A15", formula: "=INDEX(B:B,30)",      label: "index-in-dims-empty" },    // row 30 empty → 0?
  { cell: "A16", formula: "=INDEX(B:B,60)",      label: "index-past-dims" },        // row 60 of 50
  { cell: "A17", formula: "=ROWS(B1:B2)",        label: "rows-concrete-sanity" },
  { cell: "A18", formula: "=SUM(B1:B)",          label: "sum-open-rect" },          // 30 regardless
  // spill probes
  { cell: "D45", formula: "=SEQUENCE(10)",       label: "spill-past-bottom" },      // D45:D54 > 50 rows
  { cell: "F1",  formula: "=SEQUENCE(1,5)",      label: "spill-past-right" },       // F1:J1 > 8 cols
];

// Cells re-read after each resize to see what recalculated.
const RECHECK = ["A1", "A2", "A3", "A5", "A6", "A10", "A11", "A16", "D45", "F1"];

function loadCredentials() {
  const candidates = [
    join(dirname(fileURLToPath(import.meta.url)), "..", "..", "credentials.json"),
    join(process.cwd(), "credentials.json"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      const raw = JSON.parse(readFileSync(p, "utf8"));
      const c = raw.installed ?? raw.web ?? raw;
      return { clientId: c.client_id, clientSecret: c.client_secret };
    }
  }
  throw new Error("credentials.json not found at assay package root.");
}

async function loadToken() {
  const data = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
  if (Date.now() < (data.expiry_date ?? 0) - 60_000) return data.access_token;
  if (!data.refresh_token) throw new Error("Token expired and no refresh_token. Run `assay login`.");
  const creds = loadCredentials();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: data.refresh_token,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  const tokens = await res.json();
  const next = {
    access_token: tokens.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + tokens.expires_in * 1000,
  };
  writeFileSync(TOKEN_PATH, JSON.stringify(next, null, 2));
  process.stderr.write("Access token refreshed.\n");
  return next.access_token;
}

const SPREADSHEET_ID = process.env.ASSAY_SPREADSHEET_ID ?? DEFAULT_SPREADSHEET_ID;

async function api(path, init, token) {
  const res = await fetch(`${API_BASE}/${SPREADSHEET_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) throw new Error(`API ${init.method ?? "GET"} ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function parseA1(a1) {
  const m = a1.match(/^([A-Z]+)(\d+)$/);
  const col = m[1].split("").reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
  return { row: parseInt(m[2], 10) - 1, col };
}

async function readGrid(token, sheetTitle, range) {
  const get = await api(
    `?ranges=${encodeURIComponent(`'${sheetTitle}'!${range}`)}&includeGridData=true&fields=${encodeURIComponent("sheets(data.rowData.values(effectiveValue,formattedValue))")}`,
    { method: "GET" }, token);
  const rows = get.sheets[0].data[0].rowData ?? [];
  return (a1) => {
    const { row, col } = parseA1(a1);
    const cell = rows[row]?.values?.[col];
    if (!cell || !cell.effectiveValue) return "(empty)";
    const ev = cell.effectiveValue;
    if (ev.errorValue) return `${ev.errorValue.type}: ${ev.errorValue.message ?? ""}`.trim();
    if ("boolValue" in ev) return ev.boolValue ? "TRUE" : "FALSE";
    if ("numberValue" in ev) return String(ev.numberValue);
    if ("stringValue" in ev) return JSON.stringify(ev.stringValue);
    return JSON.stringify(ev);
  };
}

async function main() {
  const token = await loadToken();
  const sheetTitle = `${SHEET_PREFIX}-${Date.now()}`;

  const addRes = await api(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title: sheetTitle, gridProperties: { rowCount: ROWS0, columnCount: COLS0 } } } }],
    }),
  }, token);
  const sheetId = addRes.replies[0].addSheet.properties.sheetId;
  process.stderr.write(`Created sheet ${sheetTitle} (id ${sheetId}, ${ROWS0}x${COLS0})\n`);
  const cleanup = [{ deleteSheet: { sheetId } }];

  try {
    const writes = [...SETUP.map(s => ({ range: `'${sheetTitle}'!${s.cell}`, values: [[s.value]] })),
                    ...PROBES.map(p => ({ range: `'${sheetTitle}'!${p.cell}`, values: [[p.formula]] }))];
    await api(`/values:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: writes }),
    }, token);

    // Out-of-bounds WRITE attempt (values API, row 51 of 50) — capture the error.
    console.log("=== phase 0: out-of-bounds write (A51 on a 50-row sheet) ===");
    try {
      await api(`/values/${encodeURIComponent(`'${sheetTitle}'!A51`)}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        body: JSON.stringify({ values: [["7"]] }),
      }, token);
      console.log("A51 write: ACCEPTED (grid auto-grew?)");
    } catch (e) {
      console.log(`A51 write: REJECTED — ${e.message.slice(0, 200)}`);
    }

    await new Promise(r => setTimeout(r, CALC_WAIT_MS));
    console.log(`\n=== phase 1: probes on the ${ROWS0}x${COLS0} sheet ===`);
    let read = await readGrid(token, sheetTitle, "A1:H50");
    for (const p of PROBES) {
      console.log(`${p.cell.padEnd(4)} ${p.label.padEnd(24)} ${p.formula.padEnd(24)} => ${read(p.cell)}`);
    }

    // Resize phase A: +25 rows (50 → 75). Do blocked spills / shape reads recalc?
    await api(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: [{ appendDimension: { sheetId, dimension: "ROWS", length: 25 } }] }),
    }, token);
    await new Promise(r => setTimeout(r, CALC_WAIT_MS));
    console.log(`\n=== phase 2: after appendDimension ROWS +25 (now 75x${COLS0}) ===`);
    read = await readGrid(token, sheetTitle, "A1:H75");
    for (const c of RECHECK) {
      const p = PROBES.find(p => p.cell === c);
      console.log(`${c.padEnd(4)} ${p.label.padEnd(24)} ${p.formula.padEnd(24)} => ${read(c)}`);
    }
    console.log(`D46  spill-second-cell        (below D45)            => ${read("D46")}`);

    // Resize phase B: +4 columns (8 → 12).
    await api(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: [{ appendDimension: { sheetId, dimension: "COLUMNS", length: 4 } }] }),
    }, token);
    await new Promise(r => setTimeout(r, CALC_WAIT_MS));
    console.log(`\n=== phase 3: after appendDimension COLUMNS +4 (now 75x12) ===`);
    read = await readGrid(token, sheetTitle, "A1:L75");
    for (const c of RECHECK) {
      const p = PROBES.find(p => p.cell === c);
      console.log(`${c.padEnd(4)} ${p.label.padEnd(24)} ${p.formula.padEnd(24)} => ${read(c)}`);
    }
    console.log(`G1   spill-second-cell        (right of F1)          => ${read("G1")}`);

    // Default-dims control: a fresh sheet with no gridProperties given.
    const defRes = await api(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: `${sheetTitle}-default` } } }] }),
    }, token);
    const defProps = defRes.replies[0].addSheet.properties;
    cleanup.push({ deleteSheet: { sheetId: defProps.sheetId } });
    console.log(`\n=== phase 4: default fresh sheet dims ===`);
    console.log(`gridProperties: ${JSON.stringify(defProps.gridProperties)}`);
    await api(`/values/${encodeURIComponent(`'${sheetTitle}-default'!A1`)}?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      body: JSON.stringify({ values: [["=ROWS(B:B)&\"x\"&COLUMNS(1:1)"]] }),
    }, token);
    await new Promise(r => setTimeout(r, CALC_WAIT_MS));
    const readDef = await readGrid(token, `${sheetTitle}-default`, "A1:B2");
    console.log(`A1   rows-x-cols-default      =ROWS(B:B)&x&COLUMNS(1:1) => ${readDef("A1")}`);
  } finally {
    await api(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: cleanup }),
    }, token).catch(e => process.stderr.write(`cleanup failed: ${e.message}\n`));
    process.stderr.write("Probe sheets deleted.\n");
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
