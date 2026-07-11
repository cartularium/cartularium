import { writeFileSync } from "node:fs";
import { createDriver } from "@cartularium/drivers";
const tasks = [
  { formula: "=AND()" },
  { formula: "=SUM()" },
  { formula: "=INDEX(A1:A3*10)", grid: { A1: 1, A2: 2, A3: 3 } as any },
  { formula: "=INDEX({1,2,3}+{10;20;30})" },
  { formula: "=INDEX(A1:A3, 2)", grid: { A1: 1, A2: 2, A3: 3 } as any },
  { formula: "=SUM(5)" },
];
const d = createDriver("excel", { verbose: false, workbookPath: null } as any);
await d.init();
const results = await d.evaluateBatch(tasks as any);
await (d as any).dispose?.();
writeFileSync("scratch/lane-excel-nulls-out.json", JSON.stringify(results, null, 1));
