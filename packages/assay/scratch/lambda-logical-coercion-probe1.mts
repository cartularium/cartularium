import { createDriver } from "@cartularium/drivers";

const formulas = [
  // lambda family — confirm missing-function vs partial
  { formula: "=LAMBDA(x, x+1)(5)" },
  { formula: "=LET(x, 5, x+1)" },
  { formula: "=MAP({1;2;3}, LAMBDA(x, x*2))" },
  { formula: "=REDUCE(0, {1;2;3}, LAMBDA(a,x,a+x))" },
  { formula: "=SORT({3;1;2})" },
  { formula: "=SORT({3;1;2}, 1, -1)" },
  { formula: "=SORTBY({10;20;30}, {3;1;2})" },
  { formula: "=UNIQUE({1;2;1;3})" },
  { formula: "=FILTER({1;2;3;4;5}, {1;0;1;0;1})" },
  { formula: "=BYCOL({1,2,3;4,5,6}, LAMBDA(col, SUM(col)))" },
  { formula: "=MAKEARRAY(2,2,LAMBDA(r,c,r*c))" },
  // logical
  { formula: "=AND()" },
  { formula: "=AND(1,1,0)" },
  { formula: "=CHOOSE(5, \"a\", \"b\", \"c\")" },
  { formula: "=IF(1>2, \"a\", IF(3>2, \"b\", \"c\"))" },
  { formula: "=IF(2>3, TRUE)" },
  { formula: "=IFERROR(1/0, \"error\")" },
  { formula: "=IFERROR(IFERROR(1/0, 1/0), \"both failed\")" },
  { formula: "=OR(0,0,1)" },
  // type-coercion
  { formula: "=N(\"hello\")" },
  { formula: "=PRODUCT({\"2\",\"3\",\"4\"})" },
  { formula: "=SUM({TRUE,FALSE,TRUE})" },
  { formula: "=SUM({1,\"2\",TRUE})" },
  { formula: "=SUM(A1:A3)", grid: { A1: "1", A2: "2", A3: "3" } },
  { formula: "=T(TRUE)" },
  { formula: "=T(\"hello\")" },
  { formula: "=VALUE(\"123.45\")" },
  { formula: "=VALUE(\"TRUE\")" },
];

for (const engine of ["hyperformula", "ironcalc", "formulas", "pycel"] as const) {
  const d = createDriver(engine);
  await d.init();
  const results = await d.evaluateBatch(formulas);
  console.log(`\n===== ${engine} =====`);
  results.forEach((r, i) => {
    console.log(formulas[i].formula.padEnd(52), "=>", JSON.stringify(r));
  });
  if (d.dispose) await d.dispose();
}
