import { useNodeAuth } from "../src/node-auth.js";
useNodeAuth();
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSpreadsheetId, sleep } from "../src/api.js";
import { extractSnapshot } from "../src/extract.js";
import { rehydrate } from "../src/rehydrate.js";
import { diffSnapshots } from "./diff.js";
import type { Snapshot } from "../src/snapshot.js";

const input = process.argv[2];
if (!input) {
  console.error("usage: pnpm --filter @cartularium/whetstone roundtrip <spreadsheet-id-or-url>");
  process.exit(1);
}

const originalId = parseSpreadsheetId(input);

console.log(`extracting ${originalId} ...`);
const original = await extractSnapshot(originalId);
const cellCount = original.sheets.reduce(
  (n, s) => n + s.cells.reduce((m, row) => m + row.filter(Boolean).length, 0),
  0,
);
console.log(
  `  "${original.title}" — ${original.sheets.length} sheet(s), ${cellCount} occupied cells, ` +
    `locale=${original.locale} tz=${original.timeZone}`,
);

console.log("rehydrating into a fresh spreadsheet ...");
const rehydratedId = await rehydrate(original, `whetstone-spike-${originalId.slice(0, 8)}`);
console.log(`  https://docs.google.com/spreadsheets/d/${rehydratedId}`);

// one settle read; retry if formulas haven't computed yet
console.log("reading back computed values ...");
let rehydrated: Snapshot = await extractSnapshot(rehydratedId);
for (let attempt = 0; attempt < 3 && looksUncomputed(rehydrated); attempt++) {
  await sleep(2000);
  rehydrated = await extractSnapshot(rehydratedId);
}

const report = diffSnapshots(original, rehydrated);

console.log(`\n=== round-trip fidelity: ${original.title} ===`);
console.log(`cells compared: ${report.cellsCompared}`);
for (const [verdict, count] of Object.entries(report.counts)) {
  if (count > 0) console.log(`  ${verdict}: ${count}`);
}
if (report.missingSheets.length > 0) {
  console.log(`  MISSING SHEETS: ${report.missingSheets.join(", ")}`);
}
const shown = report.diffs.slice(0, 40);
if (shown.length > 0) {
  console.log("\nworst diffs:");
  for (const d of shown) {
    const f = d.formula ? `  =${d.formula.replace(/^=/, "")}` : "";
    console.log(
      `  [${d.verdict}] ${d.sheet}!${d.a1}${f}\n` +
        `      original:   ${render(d.original)}\n` +
        `      rehydrated: ${render(d.rehydrated)}`,
    );
  }
  if (report.diffs.length > shown.length) {
    console.log(`  ... ${report.diffs.length - shown.length} more in the JSON report`);
  }
}

const resultsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "results");
mkdirSync(resultsDir, { recursive: true });
const outPath = join(resultsDir, `${originalId.slice(0, 12)}-${Date.now()}.json`);
writeFileSync(
  outPath,
  JSON.stringify({ originalId, rehydratedId, title: original.title, report }, null, 2),
);
console.log(`\nfull report: ${outPath}`);

function looksUncomputed(snap: Snapshot): boolean {
  let formulas = 0;
  let uncomputed = 0;
  for (const sheet of snap.sheets) {
    for (const row of sheet.cells) {
      for (const cell of row) {
        if (cell?.ue?.formulaValue) {
          formulas++;
          if (!cell.ev && cell.fv === undefined) uncomputed++;
        }
      }
    }
  }
  return formulas > 0 && uncomputed / formulas > 0.5;
}

function render(side: { ev?: unknown; fv?: string }): string {
  return `ev=${JSON.stringify(side.ev)} fv=${JSON.stringify(side.fv)}`;
}
