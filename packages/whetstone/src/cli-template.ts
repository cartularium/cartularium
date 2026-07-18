import { useNodeAuth } from "./node-auth.js";
useNodeAuth();
import { loadProblem, saveProblem } from "./problem.js";
import { createFromTemplate } from "./template.js";

const path = process.argv[2];
if (!path) {
  console.error("usage: pnpm --filter @cartularium/whetstone template <problem.yaml>");
  process.exit(1);
}
const problem = loadProblem(path);
const id = await createFromTemplate(problem, `whetstone-template-${problem.id}`, {
  sampleInput: true,
  styled: true,
});
problem.template.spreadsheetId = id;
saveProblem(path, problem);
console.log(`template for ${problem.id} — ${problem.title} (id saved to ${path})`);
console.log(`  url:  https://docs.google.com/spreadsheets/d/${id}`);
console.log(`  copy: https://docs.google.com/spreadsheets/d/${id}/copy`);
