import { writeFileSync } from "node:fs";
import { createDriver } from "@cartularium/drivers";

// Follow-up probes explicitly requested inside hypotheses + disambiguations.
const tasks: { key: string; formula: string; grid?: any }[] = [
  // INDEX single-arg disambiguation (spill-broadcast-001/002)
  { key: "index-ref-1arg", formula: "=INDEX(A1:A3)", grid: { A1: 1, A2: 2, A3: 3 } },
  { key: "index-literal-1arg", formula: "=INDEX({1;2;3})" },
  { key: "index-ref-arith-1arg", formula: "=INDEX(A1:A3*10)", grid: { A1: 1, A2: 2, A3: 3 } },
  // lookup-001 follow: sheet name needing quotes
  { key: "address-spaced-sheet", formula: '=ADDRESS(1,1,1,TRUE,"My Sheet")' },
  // lookup-005 follow: INDEX zero / negative index
  { key: "index-zero", formula: "=INDEX(A1:A2, 0)", grid: { A1: 1, A2: 2 } },
  { key: "index-neg", formula: "=INDEX(A1:A2, -1)", grid: { A1: 1, A2: 2 } },
  // lookup-006 follow: LOOKUP square array
  { key: "lookup-square", formula: "=LOOKUP(2, {1,2;3,4})" },
  // text-regex-001 follow: return_mode=2 capture groups
  { key: "regex-mode2", formula: '=REGEXEXTRACT("2025-03-01", "(\\d{4})-(\\d{2})-(\\d{2})", 2)' },
  // text-regex-002 follow: *B functions on non-DBCS host
  { key: "midb", formula: '=MIDB("あいう", 3, 2)' },
  { key: "findb", formula: '=FINDB("い", "あいう")' },
  { key: "leftb", formula: '=LEFTB("あいう", 2)' },
  // ACOT recheck (hypo predicted 2.6779; verify branch)
  { key: "acot-neg-half", formula: "=ACOT(-0.5)" },
];

const d = createDriver("excel", { verbose: false, workbookPath: null } as any);
await d.init();
const results = await d.evaluateBatch(tasks.map((t) => (t.grid ? { formula: t.formula, grid: t.grid } : { formula: t.formula })) as any);
await (d as any).dispose?.();
writeFileSync(
  "scratch/lane-excel-followups-out.json",
  JSON.stringify(tasks.map((t, i) => ({ ...t, outcome: results[i].outcome })), null, 1),
);
