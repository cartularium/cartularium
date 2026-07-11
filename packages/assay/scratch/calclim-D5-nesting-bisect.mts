import { makeDriver, renderOutcome } from "./calclim-lib.mts";

const d = await makeDriver();
async function nest(n: number) {
  const t0 = Date.now();
  const [r] = await d.evaluateBatch([
    { formula: "=" + "ABS(".repeat(n) + "1" + ")".repeat(n) },
  ]);
  const ms = Date.now() - t0;
  const cell = (r.outcome as any).grid?.[0]?.[0];
  const shown = cell?.primitive?.kind === "number" ? `num=${cell.primitive.value}` : renderOutcome(r.outcome).split("\n")[0];
  console.log(`nest-${n}\t-> ${shown}\t(${ms}ms)`);
}
for (const n of [260, 270, 280, 290]) await nest(n);
