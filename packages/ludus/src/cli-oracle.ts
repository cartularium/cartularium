import { useNodeAuth } from "./node-auth.js";
useNodeAuth();
import { loadProblem, saveProblem } from "./problem.js";
import { runOracle } from "./oracle.js";

const path = process.argv[2];
if (!path) {
  console.error("usage: pnpm --filter @cartularium/ludus oracle <problem.yaml>");
  process.exit(1);
}
const problem = loadProblem(path);
console.log(`oracle: running reference solution for ${problem.id} over ${problem.cases.length} case(s) ...`);
const { scratchId } = await runOracle(problem);
saveProblem(path, problem);
for (const c of problem.cases) {
  console.log(`  ${c.kind}: expected ${c.expected!.length}x${c.expected![0]?.length ?? 0}`);
}
console.log(`expected outputs written back to ${path}`);
console.log(`oracle scratch: https://docs.google.com/spreadsheets/d/${scratchId}`);
