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
  console.log(`${label}\t-> ${shown}\t(${ms}ms)`);
}

console.log("=== REPT output cap bisection (=LEN(REPT(\"a\",N))) ===");
for (const n of [1000, 10000, 20000, 30000, 32767, 32768, 32769, 35000, 40000]) {
  await probe(`rept-${n}`, `=LEN(REPT("a",${n}))`);
}

console.log("=== cell string cap via CONCATENATE (build past REPT cap) ===");
// If REPT caps at C, CONCATENATE(REPT(a,C), REPT(a,C)) makes 2C. Find where the
// STORED/returned string errors (the true cell string cap, independent of REPT).
await probe("concat-2x20000=40000", '=LEN(CONCATENATE(REPT("a",20000),REPT("a",20000)))');
await probe("concat-49000", '=LEN(CONCATENATE(REPT("a",25000),REPT("a",24000)))');
await probe("concat-50000", '=LEN(CONCATENATE(REPT("a",25000),REPT("a",25000)))');
await probe("concat-50001", '=LEN(CONCATENATE(REPT("a",25000),REPT("a",25001)))');
await probe("concat-60000", '=LEN(CONCATENATE(REPT("a",30000),REPT("a",30000)))');
console.log("=== stored string (not LEN-wrapped) at the cap ===");
await probe("stored-49000", '=CONCATENATE(REPT("a",25000),REPT("a",24000))');
await probe("stored-50001", '=CONCATENATE(REPT("a",25000),REPT("a",25001))');
