import { createDriver } from "@cartularium/drivers";

// Pin down hyperformula's IF handling + a few function-recognition boundaries.
const hf = createDriver("hyperformula");
await hf.init();
const probes = [
  "=IF(TRUE, 5, 6)",
  "=IF(1>0, 5, 6)",
  '=IF(TRUE, "a", "b")',
  "=SUM(IF(TRUE, 5, 6))",
  "=IFERROR(1, 2)",
  "=IFS(TRUE, 1, TRUE, 2)",
  "=TRUE",
  "=AND(TRUE, TRUE)",
  "=NOT(FALSE)",
  "=CHOOSE(1, 10, 20)",
  "=SWITCH(1, 1, \"a\", \"b\")",
];
const r = await hf.evaluateBatch(probes.map((formula) => ({ formula })));
r.forEach((x, i) => console.log(`${probes[i]}\t=> ${JSON.stringify((x as any).outcome ?? x)}`));
