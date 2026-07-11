import { createDriver } from "@cartularium/drivers";

const tasks = [
  { label: "2+2", formula: "=2+2" },
  { label: "1/0", formula: "=1/0" },
  { label: "10/0", formula: "=10/0" },
  { label: "1/(1-1)", formula: "=1/(1-1)" },
  { label: "SQRT(4)", formula: "=SQRT(4)" },
  { label: "SQRT(-1)", formula: "=SQRT(-1)" },
  { label: "LN(-1)", formula: "=LN(-1)" },
  { label: "LN(0)", formula: "=LN(0)" },
  { label: "ISERROR(1/0)", formula: "=ISERROR(1/0)" },
  { label: "IFERROR(1/0,9)", formula: "=IFERROR(1/0, 9)" },
  { label: "IFERROR(SQRT(-1),9)", formula: "=IFERROR(SQRT(-1), 9)" },
  { label: "SUM(1,1/0,3)", formula: "=SUM(1, 1/0, 3)" },
  { label: "ISERR(NA())", formula: "=ISERR(NA())" },
  { label: "ISERROR(NA())", formula: "=ISERROR(NA())" },
];

const d = createDriver("pycel" as any);
await d.init();
const results = await d.evaluateBatch(tasks.map((t) => ({ formula: t.formula })));
console.log("===== pycel =====");
results.forEach((r: any, i: number) => {
  const o = r.outcome ?? r;
  console.log(`  ${tasks[i].label.padEnd(20)} | ${JSON.stringify(o)}`);
});
if (d.dispose) await d.dispose();
