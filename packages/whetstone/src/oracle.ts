// Oracle-by-execution: run the reference solution through the judge machinery
// against every case, and write the computed outputs back into the problem file
// as `expected`. The corpus never hand-computes an answer.
import { sleep } from "./api.js";
import type { Problem } from "./problem-types.js";
import { loadSheetIds, readRect, writeRect, type Scalar } from "./rect.js";
import { createFromTemplate } from "./template.js";

export async function runOracle(problem: Problem): Promise<{ scratchId: string }> {
  const scratchId = await createFromTemplate(problem, `whetstone-oracle-${problem.id}`, {
    sampleInput: false,
    referenceFormula: problem.reference.trim(),
  });
  const ids = await loadSheetIds(scratchId);

  for (const [i, c] of problem.cases.entries()) {
    await writeRect(scratchId, ids, problem.template.input, c.input);
    await sleep(800);
    let out = await readRect(scratchId, problem.template.output);
    if (out.length === 0) {
      await sleep(1500);
      out = await readRect(scratchId, problem.template.output);
    }
    const errors = out.flat().filter((v) => typeof v === "string" && v.startsWith("#"));
    if (errors.length > 0 || out.length === 0) {
      throw new Error(
        `oracle: reference solution failed on case ${i} (${c.kind}): ` +
          (errors[0] ?? "empty output") +
          ` — scratch sheet: https://docs.google.com/spreadsheets/d/${scratchId}`,
      );
    }
    c.expected = out.map((row) => row.map(normalize));
  }
  return { scratchId };
}

function normalize(v: Scalar): Scalar {
  return v === "" ? null : v;
}
