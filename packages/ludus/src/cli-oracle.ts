import { useNodeAuth } from "./node-auth.js";
useNodeAuth();
import { loadProblem, oracleSurfaceHash, saveProblem } from "./problem.js";
import { runOracle } from "./oracle.js";

const args = process.argv.slice(2);
const checkOnly = args[0] === "--check";
const paths = checkOnly ? args.slice(1) : args;
if (paths.length === 0) {
  console.error("usage: pnpm --filter @cartularium/ludus oracle [--check] <problem.yaml> ...");
  process.exit(1);
}

if (checkOnly) {
  // staleness sweep: no API calls, just recompute the oracle-surface hash
  let stale = 0;
  for (const path of paths) {
    const problem = loadProblem(path);
    const hash = oracleSurfaceHash(problem);
    if (!problem.verified) {
      console.log(`${problem.id}: NEVER VERIFIED`);
      stale++;
    } else if (problem.verified.hash !== hash) {
      console.log(`${problem.id}: STALE — surface changed since ${problem.verified.asOf} (re-run the oracle)`);
      stale++;
    } else {
      console.log(`${problem.id}: verified ${problem.verified.asOf}`);
    }
  }
  process.exit(stale > 0 ? 1 : 0);
}

for (const path of paths) {
  const problem = loadProblem(path);
  console.log(`oracle: running reference solution for ${problem.id} over ${problem.cases.length} case(s) ...`);
  const { scratchId } = await runOracle(problem);
  problem.verified = {
    asOf: new Date().toISOString().slice(0, 10),
    hash: oracleSurfaceHash(problem),
  };
  saveProblem(path, problem);
  for (const c of problem.cases) {
    console.log(`  ${c.kind}: expected ${c.expected!.length}x${c.expected![0]?.length ?? 0}`);
  }
  console.log(`expected outputs + verified stamp written back to ${path}`);
  console.log(`oracle scratch: https://docs.google.com/spreadsheets/d/${scratchId}`);
}
