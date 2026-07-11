import { makeDriver, renderOutcome } from "./calclim-lib.mts";

const d = await makeDriver();
async function probe(label: string, formula: string) {
  const t0 = Date.now();
  const [r] = await d.evaluateBatch([{ formula }]);
  const ms = Date.now() - t0;
  const cell = (r.outcome as any).grid?.[0]?.[0];
  const prim = cell?.primitive;
  let shown = renderOutcome(r.outcome);
  if (prim?.kind === "number") shown = `num=${prim.value}`;
  console.log(`${label}\t-> ${shown}\t(${ms}ms)`);
}

console.log("=== host health check ===");
await probe("health-1", "=1+1");
await probe("health-2", "=REPT(\"a\",100)");

console.log("=== nesting depth, shallow ladder, one at a time ===");
for (const n of [10, 50, 100, 150, 200, 250, 300, 400]) {
  await probe(`nest-${n}`, "=" + "ABS(".repeat(n) + "1" + ")".repeat(n));
}
