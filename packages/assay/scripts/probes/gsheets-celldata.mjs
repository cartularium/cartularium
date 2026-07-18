#!/usr/bin/env node
// One-shot empirical probes against Google Sheets CellData.
// Answers the 5 open questions in docs/gsheets-celldata-gap.md by writing
// a controlled set of formulas, fetching the cells via spreadsheets.get
// with includeGridData=true, and emitting a structured report.
//
// Run with: node packages/assay/scripts/probes/gsheets-celldata.mjs
// Requires: `assay login` previously run (reads ~/.assayrc.json), and
// ASSAY_SPREADSHEET_ID env var (or falls back to the assay default).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN_PATH = join(homedir(), ".assayrc.json");
const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const DEFAULT_SPREADSHEET_ID = "1QCumjdFqQO8SYnXhKwI2AJevhnb_JsXqjMTLCoPnOmo";
const CALC_WAIT_MS = 600;
const SHEET_PREFIX = "celldata-probe";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = resolve(SCRIPT_DIR, "..", "..", "docs", "gsheets-celldata-probes.md");

// Probe cases. Each entry: {cell, formula | null, label, probe, expect}.
// `formula: null` means leave the cell untouched (used for the blank-cell case).
const PROBES = [
  // Probe 1 — Lambda at cell boundary
  { cell: "A1",  formula: "=LAMBDA(x, x+1)",                  probe: "1",   label: "lambda-at-cell",          expect: "errorValue (some code)" },

  // Probe 2 — Null encoding
  { cell: "A2",  formula: null,                                probe: "2.a", label: "blank-untouched",          expect: "no effectiveValue; rowData entry may be absent" },
  { cell: "A3",  formula: '=""',                               probe: "2.b", label: "empty-string-formula",     expect: "stringValue: \"\"" },
  { cell: "A4",  formula: "=IF(,,)",                           probe: "2.c", label: "null-via-IF",              expect: "either omitted, errorValue NULL_VALUE, or numberValue 0" },
  { cell: "A5",  formula: "=ISBLANK(IF(,,))",                  probe: "2.d", label: "isblank-sanity",           expect: "boolValue TRUE (validates A4's nullness)" },

  // Probe 3 — HYPERLINK and textFormatRuns
  { cell: "A6",  formula: '=HYPERLINK("https://example.com", "click")', probe: "3", label: "hyperlink-formula",     expect: "stringValue \"click\"; cell.hyperlink \"https://example.com\"; possibly textFormatRuns" },

  // Probe 4 — numberFormat inference (cells with no user-applied format)
  { cell: "A7",  formula: "=DATE(2023, 3, 19)",                probe: "4.a", label: "date-formula-no-explicit-format", expect: "numberValue 44999 (serial); effectiveFormat.numberFormat.type DATE?" },
  { cell: "A8",  formula: "=NOW()",                            probe: "4.b", label: "now-formula",              expect: "numberValue (serial); effectiveFormat.numberFormat.type DATE_TIME?" },
  { cell: "A9",  formula: "123",                               probe: "4.c", label: "literal-number",           expect: "numberValue 123; effectiveFormat absent or type NUMBER?" },
  { cell: "A10", formula: "=A7",                               probe: "4.d", label: "date-reference",           expect: "does the inferred type propagate from A7?" },

  // Probe 5 — errorValue.message per ErrorType
  { cell: "A11", formula: "=1/0",                              probe: "5.a", label: "div-by-zero",              expect: "errorValue.type DIVIDE_BY_ZERO" },
  { cell: "A12", formula: "=NA()",                             probe: "5.b", label: "na-explicit",              expect: "errorValue.type N_A" },
  { cell: "A13", formula: "=NotARealFunction()",               probe: "5.c", label: "unknown-function",         expect: "errorValue.type NAME" },
  { cell: "A14", formula: "=A1:Z1 A30:Z30",                    probe: "5.d", label: "non-overlapping-intersect",expect: "errorValue.type REF or NULL_VALUE (last run got parse-error ERROR; trying clearer non-overlap)" },
  { cell: "A15", formula: "=SQRT(-1)",                         probe: "5.e", label: "sqrt-negative",            expect: "errorValue.type NUM" },
  { cell: "A16", formula: '=VLOOKUP("nope", B1:B1, 1, FALSE)', probe: "5.f", label: "vlookup-miss",             expect: "errorValue.type N_A" },
  { cell: "A17", formula: '="a"+1',                            probe: "5.g", label: "string-plus-number",       expect: "errorValue.type VALUE (or coerced numberValue 1?)" },

  // Probe 6 — distinguish Null from "" semantically (the wire format conflates them).
  // References A2 (untouched), A3 (=""), A4 (=IF(,,)). Evaluated in same batch.
  { cell: "A18", formula: "=ISBLANK(A2)",                      probe: "6.a", label: "isblank-of-untouched",     expect: "TRUE (truly blank)" },
  { cell: "A19", formula: "=ISBLANK(A3)",                      probe: "6.b", label: "isblank-of-empty-string",  expect: "the key question: TRUE means \"\" is null-like; FALSE means it's a real empty string" },
  { cell: "A20", formula: "=ISBLANK(A4)",                      probe: "6.c", label: "isblank-of-if-null-via-ref",expect: "TRUE (compare to 2.d which did ISBLANK(IF(,,)) inline)" },
  { cell: "A21", formula: "=ISTEXT(A3)",                       probe: "6.d", label: "istext-of-empty-string",   expect: "TRUE if \"\" is a string-typed cell; FALSE if it's null-like" },
  { cell: "A22", formula: "=ISTEXT(A4)",                       probe: "6.e", label: "istext-of-if-null",        expect: "FALSE expected (null is not text)" },
  { cell: "A23", formula: '="x" & A3',                         probe: "6.f", label: "concat-empty-string",      expect: "\"x\" (empty string concatenates as nothing)" },
  { cell: "A24", formula: '="x" & A4',                         probe: "6.g", label: "concat-if-null",           expect: "\"x\" if null coerces to \"\" in concat" },
  { cell: "A25", formula: '=A3 = ""',                          probe: "6.h", label: "empty-string-eq-empty",    expect: "TRUE (definitional)" },
  { cell: "A26", formula: '=A4 = ""',                          probe: "6.i", label: "null-eq-empty-string",     expect: "TRUE means null == \"\" via coercion; FALSE distinguishes them" },
  { cell: "A27", formula: "=A3 = A4",                          probe: "6.j", label: "empty-string-eq-null",     expect: "the cleanest test: are they semantically interchangeable?" },

  // Probe 7 — multi-link cell via textFormatRuns. Manually constructed rich-text cell
  // with two links on different substrings. Tests whether cell-level `hyperlink`
  // can carry multiple links (it can't — see what the API returns) and whether
  // textFormatRuns survives a read-back. Written via updateCells (not values:batchUpdate).
  { cell: "A28", richCell: {
      userEnteredValue: { stringValue: "alpha bravo charlie" },  // indices: alpha 0-4, " " 5, bravo 6-10, " " 11, charlie 12-18
      textFormatRuns: [
        { startIndex: 0,  format: { link: { uri: "https://example.com/alpha"   } } },
        { startIndex: 5,  format: {} },
        { startIndex: 12, format: { link: { uri: "https://example.com/charlie" } } },
      ],
    }, probe: "7", label: "two-link-rich-text", expect: "cell-level hyperlink absent or one of the two; textFormatRuns preserved with both links" },

  // Probe 8 — LOADING via IMPORTHTML. Fetched with NO calc wait to maximize chance of
  // catching the transient state; a second read after a longer wait reveals the resolved value.
  { cell: "A29", formula: '=IMPORTHTML("https://en.wikipedia.org/wiki/List_of_countries_by_population_(United_Nations)", "table", 1)',
    probe: "8", label: "importhtml-loading-attempt", expect: "errorValue.type LOADING if caught in flight; otherwise a populated cell or different error" },

  // Probe 9 — Spill-recipient with Null result. Three-shape Null question:
  //   (a) truly untouched (probe 2.a confirmed: no rowData entry)
  //   (b) direct =IF(,,) (probe 2.c confirmed: rowData entry with formulaValue, no effectiveValue)
  //   (c) spill recipient where the array value at that position is Null — ??? (this probe)
  // Anchor at B1 spills "a", "", IF(,,) into B1, B2, B3.
  { cell: "B1", formula: '=ARRAYFORMULA({"a"; ""; IF(,,)})', probe: "9.a", label: "spill-anchor",                     expect: "anchor; userEnteredValue.formulaValue set; effectiveValue stringValue 'a'" },
  { cell: "B2", formula: null,                                probe: "9.b", label: "spill-recipient-empty-string",    expect: "no userEnteredValue (only anchor has); effectiveValue stringValue ''" },
  { cell: "B3", formula: null,                                probe: "9.c", label: "spill-recipient-null",            expect: "no userEnteredValue; effectiveValue probably absent (analog of direct-IF(,,) minus the formulaValue)" },
  { cell: "A30", formula: "=ISBLANK(B1)",                     probe: "9.d", label: "isblank-of-spill-anchor",         expect: "FALSE (B1 = 'a')" },
  { cell: "A31", formula: "=ISBLANK(B2)",                     probe: "9.e", label: "isblank-of-spill-empty-string",   expect: "FALSE (B2 = '')" },
  { cell: "A32", formula: "=ISBLANK(B3)",                     probe: "9.f", label: "isblank-of-spill-null",           expect: "TRUE if spilled-Null is ISBLANK like direct-IF(,,) was (probe 2.d)" },
  { cell: "A33", formula: "=ISTEXT(B3)",                      probe: "9.g", label: "istext-of-spill-null",            expect: "FALSE (Null not text — matches probe 6.e)" },
  { cell: "A34", formula: "=TYPE(B3)",                        probe: "9.h", label: "type-of-spill-null",              expect: "gsheets TYPE for Null — 1 (number) if Excel-like, or possibly other" },
  { cell: "A35", formula: '="x" & B3',                        probe: "9.i", label: "concat-spill-null",               expect: "'x' if Null coerces to '' (matches probe 6.g for direct-IF(,,))" },
  { cell: "A36", formula: '=B3 = ""',                         probe: "9.j", label: "spill-null-eq-empty",             expect: "TRUE if Null coerces equal to '' (matches probe 6.i)" },
  { cell: "A37", formula: "=B3 = 0",                          probe: "9.k", label: "spill-null-eq-zero",              expect: "?? — Excel says TRUE; gsheets behavior unknown for Null" },
  { cell: "A38", formula: "=B3 = A4",                         probe: "9.l", label: "spill-null-eq-direct-null",       expect: "are spilled-Null and direct-IF(,,) semantically identical?" },

  // Probe 10 — VLOOKUP returning a blank cell. Excel's F3 finding: blank DECAYS to 0 through VLOOKUP.
  // gsheets walk hypothesis: Null propagates. This probe tests it.
  // Lookup table at D1:E3 with E2 untouched as the blank lookup target.
  { cell: "D1", formula: "1",   probe: "10.setup", label: "lookup-key-1",    expect: "literal 1 — input" },
  { cell: "E1", formula: "100", probe: "10.setup", label: "lookup-value-1",  expect: "literal 100" },
  { cell: "D2", formula: "2",   probe: "10.setup", label: "lookup-key-2",    expect: "literal 2; E2 is the untouched lookup target" },
  // E2 left untouched on purpose — the blank lookup result
  { cell: "D3", formula: "3",   probe: "10.setup", label: "lookup-key-3",    expect: "literal 3" },
  { cell: "E3", formula: "300", probe: "10.setup", label: "lookup-value-3",  expect: "literal 300" },
  { cell: "E2", formula: null,  probe: "10.a", label: "lookup-target-blank",                    expect: "untouched — no rowData entry (matches probe 2.a)" },
  { cell: "A40", formula: "=VLOOKUP(2, D1:E3, 2, FALSE)", probe: "10.b", label: "vlookup-of-blank",               expect: "Excel returns 0 (decay); gsheets might propagate Null" },
  { cell: "A41", formula: "=ISBLANK(A40)",                probe: "10.c", label: "vlookup-result-isblank",         expect: "TRUE if blank propagates (gsheets-like Null); FALSE if decay (Excel-like)" },
  { cell: "A42", formula: "=ISTEXT(A40)",                 probe: "10.d", label: "vlookup-result-istext",          expect: "FALSE either way" },
  { cell: "A43", formula: "=TYPE(A40)",                   probe: "10.e", label: "vlookup-result-type",            expect: "1 if number-coerced; ? if Null propagates" },
  { cell: "A44", formula: '="x" & A40',                   probe: "10.f", label: "vlookup-result-concat",          expect: "'x' if Null/blank propagates; 'x0' if decay to 0" },
  { cell: "A45", formula: '=A40 = ""',                    probe: "10.g", label: "vlookup-result-eq-empty",        expect: "TRUE if Null/blank propagates and coerces to ''; ?? otherwise" },
  { cell: "A46", formula: "=A40 = 0",                     probe: "10.h", label: "vlookup-result-eq-zero",         expect: "TRUE if decay to 0 (Excel) or polymorphic-equal (blank)" },
  { cell: "A47", formula: "=A40 = A2",                    probe: "10.i", label: "vlookup-result-eq-untouched",    expect: "TRUE if VLOOKUP result is semantically identical to truly-untouched" },

  // Probe 11 — Null categorization functions symmetric to Excel's TYPE/CELL/IS* battery.
  // Excel side resolved: TYPE=1, CELL="b" for untouched (not for IF(,,)), ISNUMBER/ISTEXT/ISLOGICAL/ISERROR=FALSE.
  // gsheets question: how does gsheets categorize direct-Null (=IF(,,)) and untouched separately, if at all?
  { cell: "B5",  formula: '=CELL("type", A2)',  probe: "11.a", label: "cell-type-untouched",      expect: "expect 'b' (blank) — matches Excel" },
  { cell: "B6",  formula: '=CELL("type", A4)',  probe: "11.b", label: "cell-type-if-null",        expect: "if 'b', gsheets sees direct-Null as blank; if 'v', it sees as value" },
  { cell: "B7",  formula: '=CELL("type", B3)',  probe: "11.c", label: "cell-type-spill-null",     expect: "spilled-Null categorization" },
  { cell: "B8",  formula: '=CELL("type", A40)', probe: "11.d", label: "cell-type-vlookup-null",   expect: "VLOOKUP-result-Null categorization" },
  { cell: "B9",  formula: "=N(A4)",             probe: "11.e", label: "n-of-if-null",             expect: "0 (numeric coercion of Null)" },
  { cell: "B10", formula: "=T(A4)",             probe: "11.f", label: "t-of-if-null",             expect: "'' (text coercion of Null)" },
  { cell: "B11", formula: "=COUNTBLANK(A2)",    probe: "11.g", label: "countblank-untouched",     expect: "1 (matches Excel)" },
  { cell: "B12", formula: "=COUNTBLANK(A3)",    probe: "11.h", label: "countblank-empty-string",  expect: "1 (matches Excel — '=\"\"' counts as blank in COUNTBLANK)" },
  { cell: "B13", formula: "=COUNTBLANK(A4)",    probe: "11.i", label: "countblank-if-null",       expect: "TRUE schema-divider — Excel says 0 (IF(,,) is number 0); gsheets says 1 if it treats IF(,,) as blank-like" },
  { cell: "B14", formula: "=COUNTBLANK(B3)",    probe: "11.j", label: "countblank-spill-null",    expect: "likely 1 if gsheets is consistent" },
  { cell: "B15", formula: "=COUNTBLANK(A40)",   probe: "11.k", label: "countblank-vlookup-null",  expect: "1 if Null propagates with blank-ness; 0 if it decays" },
  { cell: "B16", formula: "=COUNTA(A2)",        probe: "11.l", label: "counta-untouched",         expect: "0 (matches Excel)" },
  { cell: "B17", formula: "=COUNTA(A3)",        probe: "11.m", label: "counta-empty-string",      expect: "1 (matches Excel — has a formula)" },
  { cell: "B18", formula: "=COUNTA(A4)",        probe: "11.n", label: "counta-if-null",           expect: "1 (matches Excel — has a formula)" },
  { cell: "B19", formula: "=ISNUMBER(A4)",      probe: "11.o", label: "isnumber-of-if-null",      expect: "FALSE (Null is not a number)" },
  { cell: "B20", formula: "=ISLOGICAL(A4)",     probe: "11.p", label: "islogical-of-if-null",     expect: "FALSE" },
  { cell: "B21", formula: "=ISERROR(A4)",       probe: "11.q", label: "iserror-of-if-null",       expect: "FALSE" },
  { cell: "B22", formula: "=A4 = FALSE",        probe: "11.r", label: "if-null-eq-false",         expect: "TRUE if Null polymorphically equals FALSE (Excel blank does)" },
];

function loadToken() {
  if (!existsSync(TOKEN_PATH)) {
    throw new Error(`No token at ${TOKEN_PATH}. Run \`assay login\` first.`);
  }
  const data = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
  if (Date.now() > (data.expiry_date ?? 0) - 60_000) {
    throw new Error("Access token expired. Run `assay login` to refresh.");
  }
  return data.access_token;
}

async function api(path, init, token) {
  const url = `${API_BASE}/${SPREADSHEET_ID}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${init.method ?? "GET"} ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

const SPREADSHEET_ID = process.env.ASSAY_SPREADSHEET_ID ?? DEFAULT_SPREADSHEET_ID;

async function main() {
  const token = loadToken();
  const sheetTitle = `${SHEET_PREFIX}-${Date.now()}`;

  // 1. Create probe sheet — bumped to 60 rows × 5 cols to accommodate probes 9/10
  const addRes = await api(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title: sheetTitle, gridProperties: { rowCount: 60, columnCount: 5 } } } }],
    }),
  }, token);
  const sheetId = addRes.replies[0].addSheet.properties.sheetId;
  process.stderr.write(`Created sheet ${sheetTitle} (id ${sheetId})\n`);

  // Helper: parse "A28" → 0-based row index, 0-based column index
  function parseA1(a1) {
    const m = a1.match(/^([A-Z]+)(\d+)$/);
    const col = m[1].split("").reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0) - 1;
    const row = parseInt(m[2], 10) - 1;
    return { row, col };
  }

  const fields = [
    "sheets(properties(title),data.rowData.values(",
      "userEnteredValue,effectiveValue,formattedValue,",
      "hyperlink,note,textFormatRuns,chipRuns,",
      "effectiveFormat(numberFormat,textFormat,hyperlinkDisplayType),",
      "userEnteredFormat(numberFormat,textFormat)",
    "))"
  ].join("");

  try {
    // 2a. Simple formula writes via values:batchUpdate
    const data = PROBES
      .filter(p => p.formula !== undefined && p.formula !== null)
      .map(p => ({ range: `'${sheetTitle}'!${p.cell}`, values: [[p.formula]] }));

    await api("/values:batchUpdate", {
      method: "POST",
      body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
    }, token);
    process.stderr.write(`Wrote ${data.length} formulas via values:batchUpdate\n`);

    // 2b. Rich-cell writes via spreadsheets.batchUpdate + updateCells
    const richRequests = PROBES
      .filter(p => p.richCell)
      .map(p => {
        const { row, col } = parseA1(p.cell);
        return {
          updateCells: {
            range: { sheetId, startRowIndex: row, endRowIndex: row + 1, startColumnIndex: col, endColumnIndex: col + 1 },
            rows: [{ values: [p.richCell] }],
            fields: "userEnteredValue,textFormatRuns",
          },
        };
      });
    if (richRequests.length > 0) {
      await api(":batchUpdate", {
        method: "POST",
        body: JSON.stringify({ requests: richRequests }),
      }, token);
      process.stderr.write(`Wrote ${richRequests.length} rich cells via updateCells\n`);
    }

    // 3a. Immediate read of LOADING-attempt cell (before calc wait)
    const loadingProbe = PROBES.find(p => p.label?.includes("loading-attempt"));
    let loadingImmediate = null;
    if (loadingProbe) {
      const immediateRange = `'${sheetTitle}'!${loadingProbe.cell}`;
      const immRes = await api(
        `?ranges=${encodeURIComponent(immediateRange)}&includeGridData=true&fields=${encodeURIComponent(fields)}`,
        { method: "GET" },
        token,
      );
      loadingImmediate = immRes.sheets?.[0]?.data?.[0]?.rowData?.[0]?.values?.[0] ?? null;
      process.stderr.write(`Immediate read of ${loadingProbe.cell} (no calc wait): ${loadingImmediate?.effectiveValue?.errorValue?.type ?? loadingImmediate?.effectiveValue ? "data" : "empty"}\n`);
    }

    process.stderr.write(`Sleeping ${CALC_WAIT_MS}ms for recalc\n`);
    await new Promise(r => setTimeout(r, CALC_WAIT_MS));

    // 3b. Full read of all cells (after calc wait). Range extends to E50 to
    // cover Probe 9's spill at B1:B3 and Probe 10's lookup table at D1:E3 plus
    // the secondary probes at A30-A47.
    const range = `'${sheetTitle}'!A1:E50`;
    const getRes = await api(
      `?ranges=${encodeURIComponent(range)}&includeGridData=true&fields=${encodeURIComponent(fields)}`,
      { method: "GET" },
      token,
    );

    // 4. Extract rowData per cell into a {ref: cellData} map. Multi-column
    // version (was A-only); handles refs like "B3", "E2".
    const rows = getRes.sheets?.[0]?.data?.[0]?.rowData ?? [];
    const cellByRow = {};
    rows.forEach((row, rowIdx) => {
      (row.values || []).forEach((cell, colIdx) => {
        const colLetter = String.fromCharCode(65 + colIdx);  // 0→A, 1→B, ...
        cellByRow[`${colLetter}${rowIdx + 1}`] = cell ?? null;
      });
    });
    if (loadingProbe) cellByRow[`${loadingProbe.cell}_immediate`] = loadingImmediate;

    // 5. Emit report
    const lines = [];
    lines.push("# gsheets CellData probe results");
    lines.push("");
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Spreadsheet: \`${SPREADSHEET_ID}\``);
    lines.push(`Probe sheet (deleted after run): \`${sheetTitle}\``);
    lines.push("");
    lines.push("Companion to [`gsheets-celldata-gap.md`](./gsheets-celldata-gap.md) — answers its 5 open questions empirically.");
    lines.push("Re-run with: `node packages/assay/scripts/probes/gsheets-celldata.mjs`");
    lines.push("");
    lines.push("---");
    lines.push("");

    let currentSection = "";
    for (const p of PROBES) {
      // "10.setup" has section "10"; "9.a" has section "9"
      const section = p.probe.split(".")[0];
      if (section !== currentSection) {
        const headings = {
          "1": "## Probe 1 — Lambda at cell boundary",
          "2": "## Probe 2 — Null encoding",
          "3": "## Probe 3 — HYPERLINK + textFormatRuns",
          "4": "## Probe 4 — numberFormat inference (no explicit format applied)",
          "5": "## Probe 5 — errorValue per ErrorType",
          "6": "## Probe 6 — Null vs \"\" semantic distinction (the API wire format conflates them)",
          "7": "## Probe 7 — Multi-link cell via textFormatRuns",
          "8": "## Probe 8 — LOADING via IMPORTHTML (immediate + after-wait reads)",
          "9": "## Probe 9 — Spilled array formula with Null result (three-shape Null question)",
          "10": "## Probe 10 — VLOOKUP returning a blank cell (does Null propagate?)",
          "11": "## Probe 11 — Null categorization (CELL, N, T, COUNTBLANK, COUNTA, IS* symmetric to Excel)",
        };
        lines.push("");
        lines.push(headings[section] ?? `## Probe ${section}`);
        lines.push("");
        currentSection = section;
      }

      const raw = cellByRow[p.cell];
      lines.push(`### ${p.probe} — \`${p.label}\``);
      lines.push("");
      lines.push(`**Cell:** \`${p.cell}\``);
      if (p.richCell) {
        lines.push(`**Input (rich-cell via updateCells):**`);
        lines.push("");
        lines.push("```json");
        lines.push(JSON.stringify(p.richCell, null, 2));
        lines.push("```");
      } else {
        lines.push(`**Formula:** ${p.formula === null ? "_(untouched)_" : `\`${p.formula}\``}`);
      }
      lines.push(`**Expectation:** ${p.expect}`);
      lines.push("");
      // For the LOADING probe, render the immediate read first
      if (p.label?.includes("loading-attempt") && cellByRow[`${p.cell}_immediate`] !== undefined) {
        lines.push("**Immediate read (no calc wait — looking for LOADING):**");
        lines.push("");
        lines.push("```json");
        lines.push(JSON.stringify(cellByRow[`${p.cell}_immediate`], null, 2));
        lines.push("```");
        lines.push("");
        lines.push(`**After ${CALC_WAIT_MS}ms wait:**`);
        lines.push("");
      } else {
        lines.push("**Raw CellData:**");
        lines.push("");
      }
      lines.push("```json");
      lines.push(JSON.stringify(raw, null, 2));
      lines.push("```");
      lines.push("");
    }

    writeFileSync(REPORT_PATH, lines.join("\n"));
    process.stderr.write(`Wrote report to ${REPORT_PATH}\n`);

  } finally {
    // 6. Delete probe sheet
    await api(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: [{ deleteSheet: { sheetId } }] }),
    }, token).catch(e => {
      process.stderr.write(`(warning) failed to delete probe sheet: ${e.message}\n`);
    });
    process.stderr.write(`Deleted probe sheet ${sheetTitle}\n`);
  }
}

main().catch(e => {
  process.stderr.write(`Probe failed: ${e.message}\n`);
  process.exit(1);
});
