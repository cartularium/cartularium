import { createDriver } from "@cartularium/drivers";

async function run(engine: string, tasks: any[]) {
  const d = createDriver(engine as any);
  await d.init();
  const res = await d.evaluateBatch(tasks);
  console.log(`\n===== ${engine} =====`);
  tasks.forEach((t, i) => {
    console.log(JSON.stringify(t.formula), "=>", JSON.stringify(res[i]));
  });
  if ((d as any).dispose) await (d as any).dispose?.();
}

// PYCEL: characterize the negative-literal mechanism
const pycelTasks = [
  { formula: "=ABS(-3.4)" },
  { formula: "=ABS(3)" },
  { formula: "=-3.4" },
  { formula: "=0-3.4" },
  { formula: "=ABS(0-3.4)" },
  { formula: "=ABS(A1)", grid: { A1: -3.4 } },
  { formula: "=SUM(-1,-2)" },
  { formula: "=1+-2" },
  { formula: "=POWER(2,-3)" },
  { formula: "=ROUND(1234,-2)" },
  { formula: "=SIGN(-10)" },
  { formula: "=CEILING(-2.5,2)" },
  { formula: "=-5+10" },
  { formula: "=ABS(-3.4)+1" },
];

// missing-function confirmations
const opTasks = [
  { formula: '=ADD("abc",1)' },
  { formula: "=GT(TRUE,0)" },
  { formula: "=GTE(TRUE,1)" },
  { formula: "=LTE(FALSE,0)" },
  { formula: "=UNIQUE(A1:A3)", grid: { A1: 1, A2: 1, A3: 2 } },
  { formula: '=CONVERT(1,"m","ft")' },
  { formula: '=CONVERT(1,"ft","kg")' },
];

await run("pycel", pycelTasks);
await run("hyperformula", opTasks);
await run("ironcalc", opTasks);
await run("formulas", opTasks);
