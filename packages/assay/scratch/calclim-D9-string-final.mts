import { makeDriver, renderOutcome } from "./calclim-lib.mts";
const d = await makeDriver();
async function probe(label: string, formula: string) {
  const t0 = Date.now();
  let shown: string;
  try {
    const [r] = await d.evaluateBatch([{ formula }]);
    const p = (r.outcome as any).grid?.[0]?.[0]?.primitive;
    if (p?.kind === "number") shown = `OK num=${p.value}`;
    else if (p?.kind === "string") shown = `OK string(len=${p.value.length})`;
    else shown = renderOutcome(r.outcome).split("\n")[0];
  } catch (e) {
    shown = "THROW " + (e instanceof Error ? e.message.slice(0, 120) : String(e));
  }
  console.log(`${label}\t-> ${shown}\t(${Date.now() - t0}ms)`);
}

console.log("=== literal string value ceiling ===");
await probe("literal-200000", `="` + "a".repeat(200000) + `"`);
await probe("literal-500000", `="` + "a".repeat(500000) + `"`);

console.log("=== REPT exact cutoff (32000 OK .. 32766 fail) ===");
for (const n of [32700, 32760, 32764, 32765]) {
  await probe(`rept-${n}`, `=LEN(REPT("a",${n}))`);
}
