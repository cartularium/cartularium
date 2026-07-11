import { createDriver } from "@cartularium/drivers";

const fmt = (r: any) => {
  const cell = r.outcome?.grid?.[0]?.[0];
  return cell === null ? "BLANK" : JSON.stringify(cell?.primitive ?? cell);
};

const formulasProbe = [
  { formula: "=LET(x, 1, y, x+1, z, y+1, z)" },       // let-scoping
  { formula: "=LET(x, 5, x+1)" },                       // let-basic (sanity)
  { formula: "=LAMBDA(x, LAMBDA(y, x+y))(1)(2)" },      // lambda-nested double-call
  { formula: "=LAMBDA(x, x+1)(5)" },                    // single IIFE
];

const pycelProbe = [
  { formula: "=SUM(1/2)" },        // operator as sole arg
  { formula: "=ABS(1-2)" },        // operator arg to a present fn
  { formula: "=SUM(1+1, 2)" },     // arithmetic operator arg
  { formula: "=IF(A1>2, 1, 2)", grid: { A1: 5 } }, // operator w/ ref
];

for (const [engine, batch] of [["formulas", formulasProbe], ["pycel", pycelProbe]] as const) {
  const d = createDriver(engine as any);
  await d.init();
  const results = await d.evaluateBatch(batch as any);
  console.log(`\n===== ${engine} =====`);
  results.forEach((r: any, i: number) => console.log((batch as any)[i].formula.padEnd(46), "=>", fmt(r)));
  if (d.dispose) await d.dispose();
}
