import { createDriver } from "@cartularium/drivers";

// Hypothesis: pycel driver returns #NAME? for ANY formula containing a binary/unary
// operator (+ - * / ^ & > >= < = <>), but evaluates pure function-call formulas.
const tasks = [
  { label: "1+1 (op +)", formula: "=1+1" },
  { label: "2*3 (op *)", formula: "=2*3" },
  { label: "5>3 (op >)", formula: "=5>3" },
  { label: "5=5 (op =)", formula: "=5=5" },
  { label: 'SUM(1,2,3) noop', formula: "=SUM(1,2,3)" },
  { label: "ABS(-5) unary", formula: "=ABS(-5)" },
  { label: "ISNUMBER(5) noop", formula: "=ISNUMBER(5)" },
  { label: "ISNUMBER(RAND())", formula: "=ISNUMBER(RAND())" },
  { label: "RAND() noop", formula: "=RAND()" },
  { label: "NOW() noop", formula: "=NOW()" },
  { label: "TODAY() noop", formula: "=TODAY()" },
  { label: "RANDBETWEEN(5,5)", formula: "=RANDBETWEEN(5,5)" },
  { label: "SUM(ABS(-5),1)", formula: "=SUM(ABS(-5),1)" },
  { label: "CONCATENATE ab", formula: '=CONCATENATE("a","b")' },
];

const d = createDriver("pycel" as any);
await d.init();
const res: any = await d.evaluateBatch(tasks.map((t) => ({ formula: t.formula })));
console.log("===== pycel operator hypothesis =====");
res.forEach((r: any, i: number) => {
  const o = r.outcome ?? r;
  const g = o.grid?.[0]?.[0]?.primitive ?? o;
  console.log(`  ${tasks[i].label.padEnd(20)} | ${JSON.stringify(g)}`);
});
if (d.dispose) await d.dispose();
