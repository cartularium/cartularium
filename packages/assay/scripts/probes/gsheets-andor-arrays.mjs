#!/usr/bin/env node
// One-shot probe: AND/OR transparency over array literals and ranges.
// Design input for lattice's AND/OR-over-List ruling (findings-batch
// 2026-06-12): do the engines truth-fold array contents (transparent), and
// how do non-boolean elements (text) read — ignored, erroring, or folded?
//
// Run with: node packages/assay/scripts/probes/gsheets-andor-arrays.mjs
// Requires: `assay login` previously run (reads ~/.assayrc.json).

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const TOKEN_PATH = join(homedir(), ".assayrc.json");
const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const DEFAULT_SPREADSHEET_ID = "1QCumjdFqQO8SYnXhKwI2AJevhnb_JsXqjMTLCoPnOmo";
const CALC_WAIT_MS = 800;
const SHEET_PREFIX = "andor-array-probe";

// Setup literals: B1=0, B2=1, B3="a" (text), B4=TRUE
const SETUP = [
  { cell: "B1", value: "0" },
  { cell: "B2", value: "1" },
  { cell: "B3", value: "a" },
  { cell: "B4", value: "=TRUE" },
];

const PROBES = [
  { cell: "A1",  formula: "=AND({0})",      label: "and-array-single-falsey" },
  { cell: "A2",  formula: "=AND({1,0})",    label: "and-array-mixed" },
  { cell: "A3",  formula: "=AND({1,2})",    label: "and-array-all-truthy" },
  { cell: "A4",  formula: "=OR({0})",       label: "or-array-single-falsey" },
  { cell: "A5",  formula: "=OR({0,0})",     label: "or-array-all-falsey" },
  { cell: "A6",  formula: "=OR({0,1})",     label: "or-array-mixed" },
  { cell: "A7",  formula: "=AND({1,NA()})", label: "and-array-with-error" },
  { cell: "A8",  formula: '=AND({"a"})',    label: "and-array-text-only" },
  { cell: "A9",  formula: '=AND({1,"a"})',  label: "and-array-num-and-text" },
  { cell: "A10", formula: "=AND(0)",        label: "and-scalar-baseline" },
  { cell: "A11", formula: "=AND(B1:B2)",    label: "and-range-0-1" },
  { cell: "A12", formula: "=AND(B2:B4)",    label: "and-range-1-text-true" },
  { cell: "A13", formula: "=AND(B3:B3)",    label: "and-range-text-only" },
  { cell: "A14", formula: "=OR(B1:B1)",     label: "or-range-just-0" },
  { cell: "A15", formula: "=OR(B3:B3)",     label: "or-range-text-only" },
];

function loadToken() {
  if (!existsSync(TOKEN_PATH)) throw new Error(`No token at ${TOKEN_PATH}. Run \`assay login\` first.`);
  const data = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
  if (Date.now() > (data.expiry_date ?? 0) - 60_000) throw new Error("Access token expired. Run `assay login`.");
  return data.access_token;
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

async function main() {
  const token = loadToken();
  const sheetTitle = `${SHEET_PREFIX}-${Date.now()}`;

  const addRes = await api(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title: sheetTitle, gridProperties: { rowCount: 20, columnCount: 4 } } } }],
    }),
  }, token);
  const sheetId = addRes.replies[0].addSheet.properties.sheetId;
  process.stderr.write(`Created sheet ${sheetTitle} (id ${sheetId})\n`);

  try {
    const writes = [...SETUP.map(s => ({ range: `'${sheetTitle}'!${s.cell}`, values: [[s.value]] })),
                    ...PROBES.map(p => ({ range: `'${sheetTitle}'!${p.cell}`, values: [[p.formula]] }))];
    await api(`/values:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: writes }),
    }, token);

    await new Promise(r => setTimeout(r, CALC_WAIT_MS));

    const get = await api(
      `?ranges=${encodeURIComponent(`'${sheetTitle}'!A1:B20`)}&includeGridData=true&fields=${encodeURIComponent("sheets(data.rowData.values(effectiveValue,formattedValue))")}`,
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

    for (const p of PROBES) {
      console.log(`${p.cell.padEnd(4)} ${p.label.padEnd(26)} ${p.formula.padEnd(18)} => ${read(p.cell)}`);
    }
  } finally {
    await api(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: [{ deleteSheet: { sheetId } }] }),
    }, token).catch(e => process.stderr.write(`cleanup failed: ${e.message}\n`));
    process.stderr.write("Probe sheet deleted.\n");
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
