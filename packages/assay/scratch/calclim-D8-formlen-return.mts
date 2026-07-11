import { makeDriver, renderOutcome } from "./calclim-lib.mts";

const d = await makeDriver();
async function probe(label: string, formula: string, showLen = false) {
  const t0 = Date.now();
  let shown: string;
  try {
    const [r] = await d.evaluateBatch([{ formula }]);
    const cell = (r.outcome as any).grid?.[0]?.[0];
    const p = cell?.primitive;
    if (p?.kind === "number") shown = `OK num=${p.value}`;
    else if (p?.kind === "string") shown = `OK string(len=${p.value.length})`;
    else shown = renderOutcome(r.outcome).split("\n")[0];
  } catch (e) {
    shown = "THROW " + (e instanceof Error ? e.message.slice(0, 160) : String(e));
  }
  console.log(`${label}\t-> ${shown}\t(${Date.now() - t0}ms)`);
}

console.log("=== formula length ceiling (LEN of literal) ===");
await probe("flen-1M", `=LEN("` + "x".repeat(1_000_000 - 8) + `")`);
await probe("flen-2M", `=LEN("` + "x".repeat(2_000_000 - 8) + `")`);

console.log("=== returned literal vs 50k string cap ===");
await probe("return-literal-40000", `="` + "a".repeat(40000) + `"`);
await probe("return-literal-50000", `="` + "a".repeat(50000) + `"`);
await probe("return-literal-50001", `="` + "a".repeat(50001) + `"`);
await probe("return-literal-60000", `="` + "a".repeat(60000) + `"`);
