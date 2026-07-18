#!/usr/bin/env node
// Micro-probe: where does the gsheets COLUMN ADDRESS SPACE end?
// Documented grid limit is 18,278 columns (= ZZZ). Does a 4-letter address
// fail to parse (like lattice's #NAME?) or error some other way?
//
// Run with: node packages/assay/scripts/probes/gsheets-colspace.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN_PATH = join(homedir(), ".assayrc.json");
const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const DEFAULT_SPREADSHEET_ID = "1V0Ix6FCctJJr20WPlxpgyuyD3I8oxJb0lMOF0Fe5LZQ";
const CALC_WAIT_MS = 1200;

const PROBES = [
  { cell: "A1", formula: "=ZZZ1",                 label: "ref-at-zzz" },
  { cell: "A2", formula: "=AAAA1",                label: "ref-past-zzz" },
  { cell: "A3", formula: '=INDIRECT("ZZZ1")',     label: "indirect-zzz" },
  { cell: "A4", formula: '=INDIRECT("AAAA1")',    label: "indirect-past-zzz" },
  { cell: "A5", formula: "=COLUMNS(A1:ZZZ1)",     label: "cols-to-zzz" },
  { cell: "A6", formula: "=SUM(ZZZ1:ZZZ5)",       label: "range-at-zzz" },
  { cell: "A7", formula: "=A1000001",             label: "row-past-1m" },
  { cell: "A8", formula: '=INDIRECT("A10000000")', label: "indirect-row-10m" },
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

async function main() {
  const token = await loadToken();
  const title = `colspace-${Date.now()}`;
  const addRes = await api(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title, gridProperties: { rowCount: 20, columnCount: 4 } } } }],
    }),
  }, token);
  const sheetId = addRes.replies[0].addSheet.properties.sheetId;

  try {
    // Write one probe at a time: a formula gsheets refuses to PARSE makes the
    // whole batch fail, so batch writes would mask which one is rejected.
    for (const p of PROBES) {
      try {
        await api(`/values/${encodeURIComponent(`'${title}'!${p.cell}`)}?valueInputOption=USER_ENTERED`, {
          method: "PUT", body: JSON.stringify({ values: [[p.formula]] }),
        }, token);
      } catch (e) {
        console.log(`${p.cell.padEnd(4)} ${p.label.padEnd(20)} ${p.formula.padEnd(24)} => WRITE REJECTED: ${e.message.slice(0, 120)}`);
      }
    }
    await new Promise(r => setTimeout(r, CALC_WAIT_MS));
    const get = await api(
      `?ranges=${encodeURIComponent(`'${title}'!A1:A10`)}&includeGridData=true&fields=${encodeURIComponent("sheets(data.rowData.values(effectiveValue,formattedValue))")}`,
      { method: "GET" }, token);
    const rows = get.sheets[0].data[0].rowData ?? [];
    for (const p of PROBES) {
      const row = parseInt(p.cell.slice(1), 10) - 1;
      const cell = rows[row]?.values?.[0];
      let out = "(empty)";
      if (cell?.effectiveValue) {
        const ev = cell.effectiveValue;
        out = ev.errorValue ? `${ev.errorValue.type}: ${ev.errorValue.message ?? ""}`.trim()
          : "numberValue" in ev ? String(ev.numberValue)
          : "stringValue" in ev ? JSON.stringify(ev.stringValue)
          : JSON.stringify(ev);
      } else if (cell?.formattedValue) {
        out = `formatted: ${cell.formattedValue}`;
      }
      console.log(`${p.cell.padEnd(4)} ${p.label.padEnd(20)} ${p.formula.padEnd(24)} => ${out}`);
    }
  } finally {
    await api(":batchUpdate", {
      method: "POST", body: JSON.stringify({ requests: [{ deleteSheet: { sheetId } }] }),
    }, token).catch(() => {});
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
