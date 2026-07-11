import { createDriver } from "@cartularium/drivers";

const engines = ["hyperformula", "ironcalc", "formulas", "pycel"] as const;

const tasks: { label: string; formula: string; grid?: Record<string, unknown> }[] = [
  // TIME rollover
  { label: "TIME(9,30,0)", formula: "=TIME(9,30,0)" },
  { label: "TIME(25,0,0)", formula: "=TIME(25,0,0)" },
  { label: "TIME(48,0,0)", formula: "=TIME(48,0,0)" },
  { label: "TIME(0,90,0)", formula: "=TIME(0,90,0)" },
  // WEEKNUM types
  { label: "WEEKNUM iso21", formula: '=WEEKNUM("2023-01-01", 21)' },
  { label: "WEEKNUM t1", formula: '=WEEKNUM("2023-01-01", 1)' },
  { label: "WEEKNUM t2", formula: '=WEEKNUM("2023-01-01", 2)' },
  { label: "WEEKNUM default", formula: '=WEEKNUM("2023-01-01")' },
  { label: "ISOWEEKNUM", formula: '=ISOWEEKNUM("2023-01-01")' },
  // YEARFRAC
  { label: "YEARFRAC str b2", formula: '=YEARFRAC("2025-01-01","2026-01-01",2)' },
  { label: "YEARFRAC DATE b2", formula: "=YEARFRAC(DATE(2025,1,1),DATE(2026,1,1),2)" },
  { label: "YEARFRAC str b0", formula: '=YEARFRAC("2025-01-01","2026-01-01",0)' },
  { label: "YEARFRAC str b1", formula: '=YEARFRAC("2025-01-01","2026-01-01",1)' },
  { label: "YEARFRAC str b3", formula: '=YEARFRAC("2025-01-01","2026-01-01",3)' },
  // DATEVALUE
  { label: "DATEVALUE invalid", formula: '=DATEVALUE("not a date")' },
  // pycel error-literal parsing / missing fns
  { label: "COUNTA err-lits", formula: "=COUNTA(1, #N/A, 3, #DIV/0!)" },
  { label: "COUNT err-lits", formula: "=COUNT(1, #N/A, 3, #DIV/0!)" },
  { label: "ISERR(1/0)", formula: "=ISERR(1/0)" },
  { label: "ISERR(#N/A)", formula: "=ISERR(#N/A)" },
  { label: "ISNA(1/0)", formula: "=ISNA(1/0)" },
  { label: "IFERROR(1/0)", formula: '=IFERROR(1/0, "err")' },
  { label: "IFERROR(#N/A)", formula: '=IFERROR(#N/A, "fb")' },
  { label: "IFNA(#N/A)", formula: '=IFNA(#N/A, "caught")' },
  { label: "IFNA(1/0)", formula: '=IFNA(1/0, "caught")' },
  { label: "SUM(1,#N/A,3)", formula: "=SUM(1, #N/A, 3)" },
  { label: "AVG(1,#VALUE!,3)", formula: "=AVERAGE(1, #VALUE!, 3)" },
  { label: "SQRT(-1)", formula: "=SQRT(-1)" },
  // IFERROR over array
  { label: "IFERROR arr {1,#N/A,3}", formula: "=IFERROR({1, #N/A, 3}, 0)" },
  { label: "IFERROR 10/{1,0,2}", formula: "=IFERROR(10/{1,0,2}, -1)" },
  // RANDARRAY
  { label: "RANDARRAY int", formula: "=RANDARRAY(1, 3, 1, 10, TRUE)" },
  // SUM over range with error cell (grid seed)
  { label: "SUM(A1:A3) errcell", formula: "=SUM(A1:A3)", grid: { A1: 1, A2: "=1/0", A3: 3 } },
  // RANDBETWEEN determinism
  { label: "RB int-eq", formula: "=INT(RANDBETWEEN(1,10))=RANDBETWEEN(1,10)" },
];

function fmt(r: any): string {
  if (r == null) return "null";
  const o = r.outcome ?? r;
  return JSON.stringify(o);
}

for (const eng of engines) {
  const d = createDriver(eng as any);
  await d.init();
  const results = await d.evaluateBatch(tasks.map((t) => ({ formula: t.formula, grid: t.grid })));
  console.log(`\n===== ${eng} =====`);
  results.forEach((r: any, i: number) => {
    console.log(`  ${tasks[i].label.padEnd(24)} | ${fmt(r)}`);
  });
  if (d.dispose) await d.dispose();
}
