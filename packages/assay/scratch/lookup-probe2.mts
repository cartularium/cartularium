import { createDriver } from "@cartularium/drivers";

const engines = ["hyperformula", "ironcalc", "formulas", "pycel"] as const;

const cases: { label: string; formula: string; grid?: Record<string, any> }[] = [
  { label: "ADDRESS-2arg", formula: "=ADDRESS(1,1)" },
  { label: "ADDRESS-4arg", formula: "=ADDRESS(1,1,4)" },
  { label: "ADDRESS-sheet-noquote", formula: '=ADDRESS(1,1,1,TRUE,"Sheet2")' },
  { label: "ADDRESS-sheet-spaces", formula: '=ADDRESS(1,1,1,TRUE,"My Sheet")' },
  // LOOKUP array-form: horizontal 2-row array -> search row 1, return row 2
  { label: "LOOKUP-arr-horiz", formula: '=LOOKUP(2, {1,2,3;"a","b","c"})' },
  // LOOKUP array-form: vertical (more rows than cols) -> search col 1, return last col
  { label: "LOOKUP-arr-vert", formula: '=LOOKUP(2, {1,"a";2,"b";3,"c"})' },
  // LOOKUP vector two-arg on square array
  { label: "LOOKUP-arr-square", formula: '=LOOKUP(2, {1,2;3,4})' },
];

for (const eng of engines) {
  const d = createDriver(eng as any);
  await d.init();
  const results = await d.evaluateBatch(cases.map((c) => ({ formula: c.formula, grid: c.grid })));
  console.log(`\n===== ${eng} =====`);
  results.forEach((r, i) => {
    const o = (r as any).outcome;
    const g = o?.grid;
    let flat = JSON.stringify(g);
    console.log(cases[i].label.padEnd(22), o?.kind, flat);
  });
  if (d.dispose) await d.dispose();
}
