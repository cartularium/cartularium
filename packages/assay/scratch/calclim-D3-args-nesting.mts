import { makeDriver, renderOutcome } from "./calclim-lib.mts";

const d = await makeDriver();
async function probe(label: string, formula: string) {
  const t0 = Date.now();
  const [r] = await d.evaluateBatch([{ formula }]);
  const ms = Date.now() - t0;
  const cell = (r.outcome as any).grid?.[0]?.[0];
  const prim = cell?.primitive;
  let shown = renderOutcome(r.outcome);
  if (prim?.kind === "string") shown = `string(len=${prim.value.length})`;
  if (prim?.kind === "number") shown = `num=${prim.value}`;
  console.log(`${label}\t(flen=${formula.length})\t-> ${shown}\t(${ms}ms)`);
}

console.log("=== REPT fine bisection (30000..32767) ===");
for (const n of [31000, 32000, 32766, 32767]) {
  await probe(`rept-${n}`, `=LEN(REPT("a",${n}))`);
}

console.log("=== D3 argument count: =SUM(1,1,...,1) N args (returns N) ===");
for (const n of [255, 256, 1000, 10000, 20000, 24000]) {
  await probe(`args-${n}`, "=SUM(" + Array(n).fill("1").join(",") + ")");
}

console.log("=== D2 nesting depth: =ABS(ABS(...(1)...)) N deep (returns 1) ===");
for (const n of [500, 1000, 2000, 5000, 9000, 9990]) {
  await probe(`nest-${n}`, "=" + "ABS(".repeat(n) + "1" + ")".repeat(n));
}
