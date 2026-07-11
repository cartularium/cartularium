import { createDriver } from "@cartularium/drivers";
import { getAccessToken } from "../src/auth.js";
import { writeFileSync } from "node:fs";

const token = await getAccessToken();
if (!token) throw new Error("no access token — run assay login first");

const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ properties: { title: "assay-calc-limits-2026-07-11" } }),
});
const { spreadsheetId } = (await res.json()) as { spreadsheetId: string };
console.log("SPREADSHEET_ID:", spreadsheetId);
writeFileSync(
  "/Users/jaegun/personal/cartularium/.claude/worktrees/wiki-deep-dive/deep-dive-2026-07-11/calc-limits/spreadsheet-id.txt",
  spreadsheetId + "\n",
);

const d = createDriver("gsheets", { spreadsheetId, accessToken: token });
await d.init();

const probes = [
  { id: "cal-1", formula: "=1+1" },
  { id: "cal-2", formula: "=ROWS(MAP(SEQUENCE(1000),LAMBDA(x,x+x)))" },
  { id: "cal-3", formula: "=ROWS(MAP(SEQUENCE(666664),LAMBDA(x,x+x)))" },
];

for (const p of probes) {
  const t0 = Date.now();
  const [r] = await d.evaluateBatch([{ formula: p.formula }]);
  const ms = Date.now() - t0;
  console.log(`${p.id}  ${p.formula}  ->  ${JSON.stringify(r.outcome)}  (${ms}ms)`);
}
