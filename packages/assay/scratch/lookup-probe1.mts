import { createDriver } from "@cartularium/drivers";

const engines = ["hyperformula", "ironcalc", "formulas", "pycel"] as const;

const cases: { label: string; formula: string; grid?: Record<string, any> }[] = [
  { label: "CHOOSECOLS", formula: "=CHOOSECOLS({1,2,3;4,5,6}, 1, 3)" },
  { label: "CHOOSEROWS", formula: "=CHOOSEROWS({1,2;3,4;5,6}, 1, 3)" },
  { label: "XMATCH-notfound", formula: "=XMATCH(99, {1,2,3})" },
  { label: "XMATCH-found", formula: "=XMATCH(20, A1:A3)", grid: { A1: 10, A2: 20, A3: 30 } },
  { label: "LOOKUP-arrayform", formula: '=LOOKUP(2, {1,2,3;"a","b","c"})' },
  { label: "INDEX-oob", formula: "=INDEX(A1:A2, 5)", grid: { A1: 1, A2: 2 } },
  { label: "INDEX-rowcol", formula: "=INDEX(A1:B2, 2, 1)", grid: { A1: 1, B1: 2, A2: 3, B2: 4 } },
  { label: "MATCH-notfound", formula: "=MATCH(99, {1,2,3}, 0)" },
  { label: "COLUMN-range", formula: "=COLUMN(D2:F4)" },
  { label: "ROW-range", formula: "=ROW(B7:D9)" },
  { label: "COLUMN-noarg", formula: "=COLUMN()" },
  { label: "ROW-noarg", formula: "=ROW()" },
  { label: "COLUMN-a1", formula: "=COLUMN(A1)" },
  { label: "ADDRESS-sheet", formula: '=ADDRESS(1,1,1,TRUE,"Sheet2")' },
  { label: "SHEET-name", formula: '=SHEET("Sheet1")' },
  { label: "SHEET-noarg", formula: "=SHEET()" },
  { label: "SHEET-ref", formula: "=SHEET(A1)", grid: { A1: 1 } },
  { label: "SHEET-invalid", formula: '=SHEET("NoSuchSheet")' },
  { label: "GETPIVOTDATA", formula: '=GETPIVOTDATA("Sales", A1)' },
  { label: "FORMULATEXT-str", formula: "=FORMULATEXT(A1)", grid: { A1: "=1+2" } },
];

for (const eng of engines) {
  const d = createDriver(eng as any);
  await d.init();
  const results = await d.evaluateBatch(cases.map((c) => ({ formula: c.formula, grid: c.grid })));
  console.log(`\n===== ${eng} =====`);
  results.forEach((r, i) => {
    console.log(cases[i].label.padEnd(20), JSON.stringify(r));
  });
  if (d.dispose) await d.dispose();
}
