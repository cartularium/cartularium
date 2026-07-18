// Problem acceptance checks (docs/authoring.md, loop step 4):
//   alt   — the stored alternative-technique solution (selftest.alt) must be
//           ACCEPTED, proving the problem is solvable off the reference path
//   cheat — the sample expected output hardcoded into OUTPUT must pass the
//           sample and FAIL at least one hidden case
// Failing sheets are kept for inspection; passing ones are deleted.
import { useNodeAuth } from "./node-auth.js";
useNodeAuth();
import { deleteSpreadsheet } from "./api.js";
import { judge } from "./judge.js";
import { loadProblem } from "./problem.js";
import { loadSheetIds, writeRect } from "./rect.js";
import { createFromTemplate } from "./template.js";

const args = process.argv.slice(2);
const mode = args[0] === "alt" || args[0] === "cheat" ? (args.shift() as "alt" | "cheat") : "both";
if (args.length === 0) {
  console.error("usage: pnpm --filter @cartularium/ludus selftest [alt|cheat] <problem.yaml> ...");
  process.exit(1);
}

let failed = false;

async function run(problem: ReturnType<typeof loadProblem>, kind: "alt" | "cheat"): Promise<void> {
  if (kind === "alt" && !problem.selftest?.alt) {
    failed = true;
    console.log(`${problem.id} alt: MISSING selftest.alt — store an alternative-technique solution`);
    return;
  }
  const sheetId = await createFromTemplate(problem, `ludus-selftest-${kind}-${problem.id}`, {
    sampleInput: true,
    ...(kind === "alt" ? { referenceFormula: problem.selftest!.alt.trim() } : {}),
  });
  if (kind === "cheat") {
    const sample = problem.cases.find((c) => c.kind === "sample");
    if (!sample?.expected) throw new Error(`${problem.id}: no sample expected — run the oracle first`);
    const ids = await loadSheetIds(sheetId);
    await writeRect(sheetId, ids, problem.template.output, sample.expected);
  }
  const result = await judge(problem, sheetId);
  const cases = result.cases.map((c) => `${c.kind}:${c.comparison.pass ? "pass" : c.comparison.category}`);
  console.log(`${problem.id} ${kind}: verdict=${result.verdict} [${cases.join(" ")}]`);
  for (const e of result.lintErrors) console.log(`    lint: ${e}`);

  let ok: boolean;
  if (kind === "alt") {
    ok = result.verdict === "accepted";
    if (!ok) {
      console.log(`    FAIL: alt-technique solve must be accepted`);
      for (const c of result.cases.filter((c) => !c.comparison.pass)) {
        for (const m of c.comparison.mismatches.slice(0, 5)) {
          console.log(
            `    ${c.kind}: ${m.note}` +
              (m.row !== undefined
                ? ` @ row ${m.row + 1}: expected ${JSON.stringify(m.expected)}, got ${JSON.stringify(m.actual)}`
                : ""),
          );
        }
      }
    }
  } else {
    const samplePass = result.cases.filter((c) => c.kind === "sample").every((c) => c.comparison.pass);
    const hiddenAllPass = result.cases.filter((c) => c.kind === "hidden").every((c) => c.comparison.pass);
    ok = samplePass && !hiddenAllPass;
    if (!ok) console.log(`    FAIL: cheat must pass the sample and fail at least one hidden case`);
  }

  if (ok) {
    await deleteSpreadsheet(sheetId);
  } else {
    failed = true;
    console.log(`    sheet kept: https://docs.google.com/spreadsheets/d/${sheetId}`);
  }
  if (result.scratchId) await deleteSpreadsheet(result.scratchId);
}

for (const path of args) {
  const problem = loadProblem(path);
  if (mode === "alt" || mode === "both") await run(problem, "alt");
  if (mode === "cheat" || mode === "both") await run(problem, "cheat");
}
process.exit(failed ? 1 : 0);
