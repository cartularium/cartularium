import { makeDriver, renderOutcome } from "./calclim-lib.mts";

const d = await makeDriver();

async function probe(label: string, formula: string) {
  const t0 = Date.now();
  const [r] = await d.evaluateBatch([{ formula }]);
  const ms = Date.now() - t0;
  const cell = (r.outcome as any).grid?.[0]?.[0];
  const prim = cell?.primitive;
  // for strings, show length instead of the whole value
  let shown = renderOutcome(r.outcome);
  if (prim?.kind === "string") shown = `string(len=${prim.value.length})`;
  console.log(`${label}\t${formula.length <= 40 ? formula : formula.slice(0, 37) + "..."}\t-> ${shown}\t(${ms}ms)`);
}

console.log("=== D6 numeric overflow (#NUM! vs Infinity) ===");
await probe("ovf-1E308x10", "=1E308*10");
await probe("ovf-POW10-308", "=POWER(10,308)");
await probe("ovf-POW10-309", "=POWER(10,309)");
await probe("ovf-10^308", "=10^308");
await probe("ovf-10^309", "=10^309");
await probe("ovf-2^1023", "=2^1023");
await probe("ovf-2^1024", "=2^1024");
await probe("ovf-maxdbl", "=1.7976931348623157E308");
await probe("ovf-maxdblx2", "=1.7976931348623157E308*2");
await probe("ovf-neg", "=-1E308*10");

console.log("=== D4 cell string cap (REPT stored value) ===");
for (const n of [40000, 49999, 50000, 50001, 60000, 100000]) {
  await probe(`str-stored-${n}`, `=REPT("a",${n})`);
}
console.log("=== D4 string cap on INTERMEDIATE value (LEN wraps, not stored) ===");
for (const n of [50000, 50001, 100000, 1000000]) {
  await probe(`str-intermediate-${n}`, `=LEN(REPT("a",${n}))`);
}
console.log("=== D4 TEXTJOIN/CONCAT output cap ===");
await probe("str-concat-50001", '=LEN(CONCATENATE(REPT("a",50000),"b"))');
await probe("str-textjoin-100k", '=LEN(TEXTJOIN(",",TRUE,REPT("a",50000),REPT("b",50000)))');
