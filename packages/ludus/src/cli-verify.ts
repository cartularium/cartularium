// Identity health check: the judge can create, write, read, and delete a fresh
// workbook. Pass a link-shared sheet as argv to verify foreign-sheet access.
import { getJudgeAccessToken } from "./auth.js";
import { parseSpreadsheetId } from "./api.js";

const judge = await getJudgeAccessToken();
console.log(`judge token: ${judge ? "present" : "MISSING"}`);
if (!judge) process.exit(1);

const create = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
  method: "POST",
  headers: { Authorization: `Bearer ${judge}`, "Content-Type": "application/json" },
  body: JSON.stringify({ properties: { title: "ludus-identity-probe" } }),
});
const created = (await create.json()) as { spreadsheetId?: string };
console.log(`judge creates a sheet: ${create.status} ${created.spreadsheetId ?? ""}`);
if (!create.ok || !created.spreadsheetId) process.exit(1);

let failed = false;
try {
  const range = encodeURIComponent("Sheet1!A1:B2");
  const write = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${created.spreadsheetId}/values/${range}?valueInputOption=RAW`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${judge}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [["ludus", "canary"], [17, true]] }),
    },
  );
  console.log(`judge writes its sheet: ${write.status}`);
  failed ||= !write.ok;

  const read = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${created.spreadsheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${judge}` } },
  );
  const body = (await read.json()) as { values?: unknown[][] };
  const expected = [["ludus", "canary"], ["17", "TRUE"]];
  const matches = JSON.stringify(body.values) === JSON.stringify(expected);
  console.log(`judge reads its sheet: ${read.status} ${matches ? "(values match)" : "(VALUE MISMATCH)"}`);
  failed ||= !read.ok || !matches;
} finally {
  const del = await fetch(`https://www.googleapis.com/drive/v3/files/${created.spreadsheetId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${judge}` },
  });
  console.log(
    `judge deletes its probe sheet: ${del.status} ${del.ok ? "(drive.file scope live — scratch cleanup works)" : "(delete unavailable — re-login for drive.file?)"}`,
  );
  failed ||= !del.ok;
}

const foreign = process.argv[2];
if (foreign) {
  const id = parseSpreadsheetId(foreign);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=properties.title`,
    { headers: { Authorization: `Bearer ${judge}` } },
  );
  const body = (await res.json()) as { properties?: { title?: string } };
  console.log(`judge reads foreign link-shared sheet: ${res.status} "${body.properties?.title ?? ""}"`);
  failed ||= !res.ok;
}

if (failed) process.exit(1);
