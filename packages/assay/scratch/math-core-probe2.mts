import { createDriver } from "@cartularium/drivers";
const d = createDriver("pycel");
await d.init();
const tasks = [
  { formula: "=10-3" },
  { formula: "=A1-A2", grid: { A1: 10, A2: 3 } },
  { formula: "=A1*-1", grid: { A1: 5 } },
  { formula: "=SUM(A1:A2)-1", grid: { A1: 10, A2: 3 } },
  { formula: "=10+3" },
  { formula: "=10*3" },
  { formula: "=ABS(A1-A2)", grid: { A1: 3, A2: 10 } },
  { formula: "=3-1-1" },
];
const res = await d.evaluateBatch(tasks);
tasks.forEach((t, i) => console.log(JSON.stringify(t.formula), "=>", JSON.stringify((res[i] as any).outcome?.grid?.[0]?.[0]?.primitive)));
