#!/usr/bin/env node
// L-4 design input, phase 1b: out-of-bounds REFERENCES on a pristine sheet.
// The first probe (gsheets-grid-dims.mjs) was contaminated by auto-growth:
// the out-of-bounds write and the past-edge spills grew the grid before the
// reference probes were read (50x8 → 554x20). Here: references only, with
// gridProperties observed after every step, then spill/write growth measured
// one event at a time.
//
// Run with: node packages/assay/scripts/probes/gsheets-grid-dims-clean.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN_PATH = join(homedir(), ".assayrc.json");
const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const DEFAULT_SPREADSHEET_ID = "1V0Ix6FCctJJr20WPlxpgyuyD3I8oxJb0lMOF0Fe5LZQ";
const CALC_WAIT_MS = 1200;

const REF_PROBES = [
  { cell: "A1",  formula: "=A51",              label: "point-ref-out-rows" },
  { cell: "A2",  formula: "=I1",               label: "point-ref-out-cols" },
  { cell: "A3",  formula: "=SUM(I:I)",         label: "open-col-out-of-grid" },
  { cell: "A4",  formula: "=SUM(A51:A60)",     label: "range-out-of-rows" },
  { cell: "A5",  formula: "=OFFSET(A1,50,0)",  label: "offset-past-bottom" },
  { cell: "A6",  formula: "=OFFSET(H1,0,1)",   label: "offset-past-right" },
  { cell: "A7",  formula: '=INDIRECT("A51")',  label: "indirect-out-rows" },
  { cell: "A8",  formula: '=INDIRECT("I1")',   label: "indirect-out-cols" },
  { cell: "A9",  formula: "=INDEX(B:B,60)",    label: "index-past-dims" },
  { cell: "A10", formula: "=ROWS(B:B)",        label: "rows-open-col-sanity" },
  { cell: "A11", formula: "=COLUMNS(1:1)",     label: "cols-open-row-sanity" },
  { cell: "A12", formula: "=B45:B54",          label: "range-lit-in-bounds" },
];

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
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const tokens = await res.json();
  writeFileSync(TOKEN_PATH, JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + tokens.expires_in * 1000,
  }, null, 2));
  return tokens.access_token;
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

async function getDims(token, sheetId) {
  const meta = await api(`?fields=${encodeURIComponent("sheets(properties(sheetId,gridProperties))")}`, { method: "GET" }, token);
  const s = meta.sheets.find(s => s.properties.sheetId === sheetId);
  const g = s.properties.gridProperties;
  return `${g.rowCount}x${g.columnCount}`;
}

async function readCells(token, sheetTitle, range, cells) {
  const get = await api(
    `?ranges=${encodeURIComponent(`'${sheetTitle}'!${range}`)}&includeGridData=true&fields=${encodeURIComponent("sheets(data.rowData.values(effectiveValue))")}`,
    { method: "GET" }, token);
  const rows = get.sheets[0].data[0].rowData ?? [];
  const read = (a1) => {
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
  return Object.fromEntries(cells.map(c => [c, read(c)]));
}

async function addSheet(token, title) {
  const res = await api(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title, gridProperties: { rowCount: 50, columnCount: 8 } } } }],
    }),
  }, token);
  return res.replies[0].addSheet.properties.sheetId;
}

async function main() {
  const token = await loadToken();
  const stamp = Date.now();
  const cleanup = [];

  try {
    // --- Sheet 1: references only, no out-of-bounds writes, no spills ---
    const t1 = `dims-clean-${stamp}`;
    const id1 = await addSheet(token, t1);
    cleanup.push({ deleteSheet: { sheetId: id1 } });
    await api(`/values:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: [
          { range: `'${t1}'!B1`, values: [["10"]] },
          { range: `'${t1}'!B2`, values: [["20"]] },
          ...REF_PROBES.map(p => ({ range: `'${t1}'!${p.cell}`, values: [[p.formula]] })),
        ],
      }),
    }, token);
    await new Promise(r => setTimeout(r, CALC_WAIT_MS));
    console.log(`=== references on pristine 50x8 (dims after: ${await getDims(token, id1)}) ===`);
    const vals = await readCells(token, t1, "A1:A12", REF_PROBES.map(p => p.cell));
    for (const p of REF_PROBES) {
      console.log(`${p.cell.padEnd(4)} ${p.label.padEnd(24)} ${p.formula.padEnd(20)} => ${vals[p.cell]}`);
    }

    // --- Sheet 2: one spill past the bottom; measure growth ---
    const t2 = `dims-spillrow-${stamp}`;
    const id2 = await addSheet(token, t2);
    cleanup.push({ deleteSheet: { sheetId: id2 } });
    console.log(`\n=== spill growth, rows (before: ${await getDims(token, id2)}) ===`);
    await api(`/values/${encodeURIComponent(`'${t2}'!D45`)}?valueInputOption=USER_ENTERED`, {
      method: "PUT", body: JSON.stringify({ values: [["=SEQUENCE(10)"]] }),
    }, token);
    await new Promise(r => setTimeout(r, CALC_WAIT_MS));
    const spillVals = await readCells(token, t2, "D45:D54", ["D45", "D54"]);
    console.log(`after =SEQUENCE(10) at D45: dims ${await getDims(token, id2)}; D45=${spillVals.D45} D54=${spillVals.D54}`);

    // --- Sheet 3: one spill past the right edge; measure growth ---
    const t3 = `dims-spillcol-${stamp}`;
    const id3 = await addSheet(token, t3);
    cleanup.push({ deleteSheet: { sheetId: id3 } });
    console.log(`\n=== spill growth, columns (before: ${await getDims(token, id3)}) ===`);
    await api(`/values/${encodeURIComponent(`'${t3}'!F1`)}?valueInputOption=USER_ENTERED`, {
      method: "PUT", body: JSON.stringify({ values: [["=SEQUENCE(1,5)"]] }),
    }, token);
    await new Promise(r => setTimeout(r, CALC_WAIT_MS));
    const spillCols = await readCells(token, t3, "F1:J1", ["F1", "J1"]);
    console.log(`after =SEQUENCE(1,5) at F1: dims ${await getDims(token, id3)}; F1=${spillCols.F1} J1=${spillCols.J1}`);

    // --- Sheet 4: one out-of-bounds WRITE; measure growth ---
    const t4 = `dims-write-${stamp}`;
    const id4 = await addSheet(token, t4);
    cleanup.push({ deleteSheet: { sheetId: id4 } });
    console.log(`\n=== out-of-bounds write growth (before: ${await getDims(token, id4)}) ===`);
    await api(`/values/${encodeURIComponent(`'${t4}'!A51`)}?valueInputOption=USER_ENTERED`, {
      method: "PUT", body: JSON.stringify({ values: [["7"]] }),
    }, token);
    await new Promise(r => setTimeout(r, CALC_WAIT_MS));
    console.log(`after PUT A51=7: dims ${await getDims(token, id4)}`);
    // and far out-of-bounds:
    await api(`/values/${encodeURIComponent(`'${t4}'!C5000`)}?valueInputOption=USER_ENTERED`, {
      method: "PUT", body: JSON.stringify({ values: [["8"]] }),
    }, token).then(
      () => getDims(token, id4).then(d => console.log(`after PUT C5000=8: dims ${d}`)),
      e => console.log(`PUT C5000 REJECTED — ${e.message.slice(0, 160)}`),
    );
  } finally {
    if (cleanup.length) {
      await api(":batchUpdate", {
        method: "POST", body: JSON.stringify({ requests: cleanup }),
      }, token).catch(e => process.stderr.write(`cleanup failed: ${e.message}\n`));
      process.stderr.write("Probe sheets deleted.\n");
    }
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
