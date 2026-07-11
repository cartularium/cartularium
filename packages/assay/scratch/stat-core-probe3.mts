import { createDriver } from "@cartularium/drivers";
const d = createDriver("hyperformula");
await d.init();
const res = await d.evaluateBatch([
  { formula: "=AVERAGEA(C1:C5)", grid: { C1: 1, C2: "text", C3: true, C4: false, C5: 2 } },
  { formula: "=STDEVPA(C1:C5)", grid: { C1: 1, C2: "text", C3: true, C4: false, C5: 2 } },
  { formula: "=AVERAGEA(1, 2, 3)" },
  { formula: "=SUM(1, 2, TRUE)" },
]);
res.forEach((r:any,i)=>console.log(i, JSON.stringify(r.outcome?.grid?.[0]?.[0]?.primitive)));
if (d.dispose) await d.dispose();
