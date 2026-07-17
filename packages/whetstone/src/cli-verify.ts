// Identity health check: judge token present, distinct from the personal assay
// token, able to create sheets, isolated from the personal account, and able to
// read a link-shared sheet it doesn't own (pass one as argv to test that step).
import { getAccessToken } from "assay";
import { getJudgeAccessToken } from "./auth.js";
import { parseSpreadsheetId } from "./api.js";

const judge = await getJudgeAccessToken();
const personal = await getAccessToken();
console.log(`judge token:    ${judge ? "present" : "MISSING"}`);
console.log(`personal token: ${personal ? "present (fallback available)" : "absent"}`);
console.log(`distinct:       ${judge && personal ? judge !== personal : "n/a"}`);
if (!judge) process.exit(1);

const create = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
  method: "POST",
  headers: { Authorization: `Bearer ${judge}`, "Content-Type": "application/json" },
  body: JSON.stringify({ properties: { title: "whetstone-identity-probe" } }),
});
const created = (await create.json()) as { spreadsheetId?: string };
console.log(`judge creates a sheet: ${create.status} ${created.spreadsheetId ?? ""}`);

if (personal && created.spreadsheetId) {
  const cross = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${created.spreadsheetId}?fields=properties.title`,
    { headers: { Authorization: `Bearer ${personal}` } },
  );
  console.log(`personal reads judge's private sheet: ${cross.status} (want 403/404 — isolated)`);
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
}
