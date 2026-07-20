// Live differential probe for the disabled named-function materializer.
// Imports real named functions, compares their computed cells with an inlined
// scratch workbook, and deletes every app-owned fixture.
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { deleteSpreadsheet, exportSpreadsheetXlsx, sheetsApi, sleep } from "../src/api.js";
import { getJudgeAccessToken } from "../src/auth.js";
import { extractSnapshot } from "../src/extract.js";
import { inlineSnapshotNamedFunctions } from "../src/named-function-materializer.js";
import { useNodeAuth } from "../src/node-auth.js";
import { rehydrate } from "../src/rehydrate.js";
import type { Snapshot } from "../src/snapshot.js";
import { extractNamedFunctions } from "../src/workbook-features.js";
import { diffSnapshots } from "./diff.js";

useNodeAuth();

const definitions = [
  { name: "DOUBLE", definition: "LAMBDA(x,x*2)" },
  { name: "ADD_ONE", definition: "LAMBDA(x,x+1)" },
  { name: "TWICE_PLUS_ONE", definition: "LAMBDA(x,ADD_ONE(x)*2)" },
  { name: "MAKE_GRID", definition: "LAMBDA(x,{x,x+1;x+2,x+3})" },
  { name: "SAFE_DIV", definition: "LAMBDA(x,IF(x=0,NA(),1/x))" },
  {
    name: "TEXT_CASE",
    definition: 'LAMBDA(x,IF(x="DOUBLE(99)","literal, ); {}","escaped ""DOUBLE(98)"""))',
  },
  { name: "SHADOW", definition: "LAMBDA(x,LET(DOUBLE,LAMBDA(y,y+10),DOUBLE(x)))" },
  { name: "LAZY_BRANCH", definition: "LAMBDA(x,IF(FALSE,x+x,7))" },
  { name: "PACK", definition: 'LAMBDA(x,{x,"DOUBLE(77)";IF(x>0,x+1,0),NA()})' },
  { name: "RECURSE", definition: "LAMBDA(x,RECURSE(x))" },
];

const values = [
  { range: "Cases!A1:B4", values: [["input", "anchor"], [1, 10], [2, 20], [3, 30]] },
  { range: "Cases!D1", values: [["=DOUBLE(21)"]] },
  { range: "Cases!D2", values: [["=TWICE_PLUS_ONE(5)"]] },
  { range: "Cases!D4", values: [["=MAP(A2:A4,DOUBLE)"]] },
  { range: "Cases!F1", values: [["=DOUBLE($B$2)+DOUBLE(B$3)+DOUBLE($B3)+DOUBLE(B$2)"]] },
  { range: "Cases!H1", values: [["=MAKE_GRID(3)"]] },
  { range: "Cases!H4", values: [["=SAFE_DIV(0)"]] },
  { range: "Cases!H5", values: [["=SAFE_DIV(4)"]] },
  { range: "Cases!J1", values: [['=TEXT_CASE("DOUBLE(99)")']] },
  { range: "Cases!J2", values: [['=TEXT_CASE("other")']] },
  { range: "Cases!J4", values: [["=SHADOW(5)"]] },
  { range: "Cases!J5", values: [["=LAZY_BRANCH(1/0)"]] },
  { range: "Cases!L1", values: [["=PACK(4)"]] },
  { range: "Cases!N1", values: [['=IF("DOUBLE(1)"="DOUBLE(1)",DOUBLE(2),0)']] },
  { range: "Cases!N2", values: [["=DOUBLE(SUM((1+2),3))"]] },
];

const expectedCells: Array<{ a1: string; value?: number | string; error?: string }> = [
  { a1: "D1", value: 42 },
  { a1: "D2", value: 12 },
  { a1: "D4", value: 2 },
  { a1: "D5", value: 4 },
  { a1: "D6", value: 6 },
  { a1: "F1", value: 120 },
  { a1: "H1", value: 3 },
  { a1: "I1", value: 4 },
  { a1: "H2", value: 5 },
  { a1: "I2", value: 6 },
  { a1: "H4", error: "N_A" },
  { a1: "H5", value: 0.25 },
  { a1: "J1", value: "literal, ); {}" },
  { a1: "J2", value: 'escaped "DOUBLE(98)"' },
  { a1: "J4", value: 15 },
  { a1: "J5", value: 7 },
  { a1: "L1", value: 4 },
  { a1: "M1", value: "DOUBLE(77)" },
  { a1: "L2", value: 5 },
  { a1: "M2", error: "N_A" },
  { a1: "N1", value: 4 },
  { a1: "N2", value: 12 },
];

const owned = new Set<string>();
try {
  const created = (await sheetsApi("", {
    method: "POST",
    body: JSON.stringify({
      properties: { title: "ludus-named-function-differential-source" },
      sheets: [{ properties: { title: "Cases" } }],
    }),
  })) as { spreadsheetId: string };
  owned.add(created.spreadsheetId);

  const xlsx = injectNamedFunctions(await exportSpreadsheetXlsx(created.spreadsheetId));
  const importedId = await importSpreadsheet(xlsx, "ludus-named-function-differential-original");
  owned.add(importedId);
  await sheetsApi(`/${importedId}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ valueInputOption: "USER_ENTERED", data: values }),
  });
  await sleep(2_000);

  const original = await extractSnapshot(importedId);
  original.namedFunctions = await extractNamedFunctions(importedId);
  const executable = inlineSnapshotNamedFunctions(original);
  const inlinedId = await rehydrate(executable, "ludus-named-function-differential-inlined");
  owned.add(inlinedId);
  await sleep(2_000);
  const inlined = await extractSnapshot(inlinedId);
  const report = diffSnapshots(original, inlined);
  const importedNames = original.namedFunctions.map((fn) => fn.name).sort();
  const expectedNames = definitions.map((fn) => fn.name).sort();
  const namesMatch = JSON.stringify(importedNames) === JSON.stringify(expectedNames);
  const expectationFailures = expectedCells.filter((expected) => !matchesExpected(original, expected));

  let recursiveRejected = false;
  try {
    inlineSnapshotNamedFunctions({
      ...original,
      sheets: original.sheets.map((sheet, index) =>
        index === 0
          ? {
              ...sheet,
              cells: [[{ ue: { formulaValue: "=RECURSE(1)" } }]],
            }
          : sheet,
      ),
    });
  } catch (error) {
    recursiveRejected = error instanceof Error && /recursive named functions/.test(error.message);
  }

  console.log(`named functions: ${importedNames.join(", ")}`);
  console.log(`definition import: ${namesMatch ? "pass" : "FAIL"}`);
  console.log(`expected cells: ${expectedCells.length - expectationFailures.length}/${expectedCells.length}`);
  console.log(`cells compared: ${report.cellsCompared}`);
  for (const [verdict, count] of Object.entries(report.counts)) {
    if (count > 0) console.log(`${verdict}: ${count}`);
  }
  console.log(`recursive rejection: ${recursiveRejected ? "pass" : "FAIL"}`);
  if (
    !namesMatch ||
    expectationFailures.length > 0 ||
    report.missingSheets.length > 0 ||
    report.diffs.length > 0 ||
    !recursiveRejected
  ) {
    console.error(
      JSON.stringify(
        {
          expectedNames,
          importedNames,
          expectationFailures,
          missingSheets: report.missingSheets,
          diffs: report.diffs,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  }
} finally {
  for (const spreadsheetId of [...owned].reverse()) {
    console.log(`deleted ${spreadsheetId}: ${(await deleteSpreadsheet(spreadsheetId)) ? "yes" : "NO"}`);
  }
}

function injectNamedFunctions(xlsx: Uint8Array): Uint8Array {
  const files = unzipSync(xlsx);
  const path = "xl/workbook.xml";
  const source = strFromU8(files[path]);
  const entries = definitions
    .map(
      ({ name, definition }) =>
        `<definedName name="${escapeXml(name)}">_xlfn.${escapeXml(definition)}</definedName>`,
    )
    .join("");
  const block = `<definedNames>${entries}</definedNames>`;
  const workbook = source.includes("<definedNames>")
    ? source.replace("</definedNames>", `${entries}</definedNames>`)
    : source.replace("</workbook>", `${block}</workbook>`);
  files[path] = strToU8(workbook);
  return zipSync(files);
}

async function importSpreadsheet(xlsx: Uint8Array, name: string): Promise<string> {
  const accessToken = await getJudgeAccessToken();
  if (!accessToken) throw new Error("judge OAuth is unavailable");
  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify({ name, mimeType: "application/vnd.google-apps.spreadsheet" })], {
      type: "application/json",
    }),
  );
  form.append(
    "file",
    new Blob([xlsx], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "named-functions.xlsx",
  );
  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  if (!response.ok) throw new Error(`Drive import failed: ${response.status} ${await response.text()}`);
  return ((await response.json()) as { id: string }).id;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function matchesExpected(
  snapshot: Snapshot,
  expected: { a1: string; value?: number | string; error?: string },
): boolean {
  const match = expected.a1.match(/^([A-Z]+)(\d+)$/);
  if (!match) throw new Error(`invalid test address: ${expected.a1}`);
  const column = [...match[1]].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
  const row = Number(match[2]) - 1;
  const effective = snapshot.sheets.find((sheet) => sheet.title === "Cases")?.cells[row]?.[column]?.ev;
  if (expected.error !== undefined) return effective?.errorValue?.type === expected.error;
  const value = effective?.numberValue ?? effective?.stringValue ?? effective?.boolValue;
  return value === expected.value;
}
