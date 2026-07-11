import { createDriver } from "@cartularium/drivers";

const pycelProbe = [
  { formula: "=IF(TRUE, 1, 2)" },
  { formula: "=IF(1>2, 1, 2)" },
  { formula: "=IF(1>2, \"a\", \"b\")" },
  { formula: "=IF(2>3, TRUE, FALSE)" },
  { formula: "=IFERROR(1, 2)" },
  { formula: "=IFERROR(1/0, 2)" },
  { formula: "=T(\"x\")" },
  { formula: "=PRODUCT(2, 3, 4)" },
  { formula: "=PRODUCT({2,3,4})" },
  { formula: "=N(1)" },
  { formula: "=SUM(1,2,3)" },
  { formula: "=CHOOSE(2, 10, 20)" },
];

const hfProbe = [
  { formula: "=SORT({3;1;2})" },
  { formula: "=UNIQUE({1;2;1})" },
  { formula: "=SCAN(0,{1;2;3},LAMBDA(a,x,a+x))" },
  { formula: "=BYROW({1,2;3,4},LAMBDA(r,SUM(r)))" },
  { formula: "=FILTER({1;2;3},{1;0;1})" },
  { formula: "=SUM({1,2,3})" },
  { formula: "=SUM({TRUE,FALSE})" },
  { formula: "=PRODUCT(2,3)" },
];

for (const [engine, batch] of [["pycel", pycelProbe], ["hyperformula", hfProbe]] as const) {
  const d = createDriver(engine as any);
  await d.init();
  const results = await d.evaluateBatch(batch as any);
  console.log(`\n===== ${engine} =====`);
  results.forEach((r: any, i: number) => {
    const g = r.outcome?.grid;
    const cell = g?.[0]?.[0];
    const v = cell === null ? "BLANK" : JSON.stringify(cell?.primitive ?? cell);
    console.log((batch as any)[i].formula.padEnd(40), "=>", v);
  });
  if (d.dispose) await d.dispose();
}
