import { createDriver } from "@cartularium/drivers";
const d = createDriver("pycel" as any);
await d.init();
const cases = [
  "=SIN(1)",       // impl, pos literal -> works?
  "=SIN(-1)",      // impl, neg literal
  "=SIN(0-1)",     // impl, arithmetic -> negative via binop
  "=SIN(1-2)",     // impl, binop negative
  "=SIN(2*1)",     // impl, binop nested
  "=SIN(PI())",    // impl, nested call single
  "=SIN(PI()/2)",  // impl, nested call + binop
  "=SIN(-PI())",   // impl, unary minus on call
  "=ABS(-1)",      // impl abs, neg literal
  "=ABS(0-1)",     // impl abs, binop
  "=SQRT(1+1)",    // impl sqrt, binop
  "=SQRT(2)",      // impl sqrt, literal
  "=ACOS(0.5)",    // impl, positive decimal
  "=ACOS(-0.5)",   // impl, negative decimal
  "=1+1",          // bare arithmetic
  "=-1",           // bare unary minus literal
  "=0-1",          // bare binop negative
  "=SUM(-1,2)",    // neg literal as arg among many
  "=SIN(ABS(-1))", // nested call arg
  "=POWER(2,-1)",  // neg literal in 2nd position
];
const results = await d.evaluateBatch(cases.map(f => ({ formula: f })));
results.forEach((r: any, i: number) => {
  const c = r.outcome?.grid?.[0]?.[0]?.primitive ?? r.grid?.[0]?.[0]?.primitive;
  const s = c?.kind === "error" ? "ERR:" + c.sentinel : c?.kind === "number" ? c.value : JSON.stringify(c);
  console.log(cases[i].padEnd(18), "->", s);
});
if (d.dispose) await d.dispose();
