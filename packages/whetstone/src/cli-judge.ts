import { useNodeAuth } from "./node-auth.js";
useNodeAuth();
import { parseSpreadsheetId } from "./api.js";
import { judge } from "./judge.js";
import { loadProblem } from "./problem.js";

const [path, sheet] = process.argv.slice(2);
if (!path || !sheet) {
  console.error("usage: pnpm --filter @cartularium/whetstone judge <problem.yaml> <sheet-id-or-url>");
  process.exit(1);
}
const problem = loadProblem(path);
console.log(`judging ${parseSpreadsheetId(sheet)} against ${problem.id} — ${problem.title} ...`);
const result = await judge(problem, parseSpreadsheetId(sheet));

console.log(`\nverdict: ${result.verdict.toUpperCase()}`);
for (const err of result.lintErrors) console.log(`  ${err}`);
result.cases.forEach((c, i) => {
  const status = c.comparison.pass ? "pass" : c.comparison.category;
  console.log(`  case ${i + 1} (${c.kind}): ${status}`);
  // disclosure rule: full detail for the sample case only
  if (!c.comparison.pass && c.kind === "sample") {
    for (const m of c.comparison.mismatches.slice(0, 10)) {
      console.log(
        `      ${m.note}` +
          (m.row !== undefined ? ` @ row ${m.row + 1}: expected ${JSON.stringify(m.expected)}, got ${JSON.stringify(m.actual)}` : ""),
      );
    }
  }
});
if (result.scratchId) {
  console.log(`\njudge scratch: https://docs.google.com/spreadsheets/d/${result.scratchId}`);
}
process.exit(result.verdict === "accepted" ? 0 : 2);
