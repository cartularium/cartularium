#!/usr/bin/env node
// L-4 design input, phase 1c: materialization SHAPE of open ranges.
// When an open range is forced into an array (ARRAYFORMULA(B:B+0)), is the
// result dims-height (50) or used-extent-height (2)? gsheets on a 50x8 sheet
// with B1=10, B2=20.
//
// Run with: node packages/assay/scripts/probes/gsheets-grid-dims-mat.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN_PATH = join(homedir(), ".assayrc.json");
const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const DEFAULT_SPREADSHEET_ID = "1V0Ix6FCctJJr20WPlxpgyuyD3I8oxJb0lMOF0Fe5LZQ";
const CALC_WAIT_MS = 1500;

const PROBES = [
  { cell: "A1", formula: "=ROWS(ARRAYFORMULA(B:B+0))",        label: "mat-shape-open-col" },
  { cell: "A2", formula: "=ROWS(ARRAYFORMULA(B1:B+0))",       label: "mat-shape-open-rect" },
  { cell: "A3", formula: "=COUNTA(ARRAYFORMULA(B:B&\"x\"))",  label: "mat-count-open-col" },
  { cell: "A4", formula: "=ROWS(SORT(B:B))",                  label: "sort-shape-open-col" },
  { cell: "A5", formula: "=ROWS(B:B+0)",                      label: "mat-shape-no-af" },
  { cell: "A6", formula: "=SUMPRODUCT(B:B+1)",                label: "sumproduct-open-col" }, // 50 empties+1 each → 30+50?
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
  throw new Error("credentials.json not found.");
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

async function main() {
  const token = await loadToken();
  const title = `dims-mat-${Date.now()}`;
  const addRes = await api(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title, gridProperties: { rowCount: 50, columnCount: 8 } } } }],
    }),
  }, token);
  const sheetId = addRes.replies[0].addSheet.properties.sheetId;

  try {
    await api(`/values:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data: [
          { range: `'${title}'!B1`, values: [["10"]] },
          { range: `'${title}'!B2`, values: [["20"]] },
          ...PROBES.map(p => ({ range: `'${title}'!${p.cell}`, values: [[p.formula]] })),
        ],
      }),
    }, token);
    await new Promise(r => setTimeout(r, CALC_WAIT_MS));
    const get = await api(
      `?ranges=${encodeURIComponent(`'${title}'!A1:A10`)}&includeGridData=true&fields=${encodeURIComponent("sheets(data.rowData.values(effectiveValue))")}`,
      { method: "GET" }, token);
    const rows = get.sheets[0].data[0].rowData ?? [];
    for (const p of PROBES) {
      const { row, col } = parseA1(p.cell);
      const cell = rows[row]?.values?.[col];
      let out = "(empty)";
      if (cell?.effectiveValue) {
        const ev = cell.effectiveValue;
        out = ev.errorValue ? `${ev.errorValue.type}: ${ev.errorValue.message ?? ""}`.trim()
          : "numberValue" in ev ? String(ev.numberValue)
          : "stringValue" in ev ? JSON.stringify(ev.stringValue)
          : JSON.stringify(ev);
      }
      console.log(`${p.cell.padEnd(4)} ${p.label.padEnd(22)} ${p.formula.padEnd(34)} => ${out}`);
    }
  } finally {
    await api(":batchUpdate", {
      method: "POST", body: JSON.stringify({ requests: [{ deleteSheet: { sheetId } }] }),
    }, token).catch(() => {});
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
