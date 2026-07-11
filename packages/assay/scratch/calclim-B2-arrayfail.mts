import { makeDriver, renderOutcome } from "./calclim-lib.mts";

// What is the failure mode just above the 10M array limit? N+1 returned 1, not #ERROR!.
const d = await makeDriver();
const formulas = [
  "=rows(sequence(10000000))",
  "=rows(sequence(10000001))",
  "=rows(sequence(20000000))",
  "=rows(map(sequence(10000001),lambda(x,x)))", // nonzero body, over array limit
  "=counta(sequence(10000001))",
  "=sequence(10000001)", // raw, will spill or error — read extent
  "=rows(sequence(10000001,1))",
  "=rows(sequence(1,10000001))", // wide instead of tall
];
for (const f of formulas) {
  const t0 = Date.now();
  const [r] = await d.evaluateBatch([{ formula: f }]);
  const ms = Date.now() - t0;
  console.log(`${f}\n   -> ${renderOutcome(r.outcome)}  (${ms}ms)`);
  // dump raw first cell for the ambiguous ones
  const cell = (r.outcome as any).grid?.[0]?.[0];
  if (cell) console.log(`      primitive=${JSON.stringify(cell.primitive)} formatted=${JSON.stringify(cell.formatted)}`);
}
