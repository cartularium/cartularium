import { createDriver } from "@cartularium/drivers";
const d = createDriver("pycel" as any);
await d.init();
const cases = [
  "=ACOS(2)",   // domain error, no operator, ACOS impl
  "=ASIN(2)",   // domain error, no operator
  "=SQRT(4)",   // works, control
  "=ACOS(0.9)", // in-domain decimal control
  "=LN(0)",     // domain/singularity, no operator, LN impl?
  "=LOG(0)",    // singularity
  "=ACOT(0)",   // missing function control (no operator)
  "=FACT(5)",   // impl? no operator
];
const results = await d.evaluateBatch(cases.map(f => ({ formula: f })));
results.forEach((r: any, i: number) => {
  const c = r.outcome?.grid?.[0]?.[0]?.primitive ?? r.grid?.[0]?.[0]?.primitive;
  const s = c?.kind === "error" ? "ERR:" + c.sentinel : c?.kind === "number" ? c.value : JSON.stringify(c);
  console.log(cases[i].padEnd(14), "->", s);
});
if (d.dispose) await d.dispose();
