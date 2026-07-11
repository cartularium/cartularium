import { createDriver } from "@cartularium/drivers";

const cases: { formula: string; grid?: Record<string, unknown> }[] = [
  // error sub-expression handling (pycel #NAME? story)
  { formula: "=1/0" },
  { formula: "=ISERR(1/0)" },
  { formula: "=NA()" },
  { formula: "=NA()+1" },
  { formula: '="a"+1' },
  { formula: '=ISERROR("a"+1)' },
  { formula: "=ISNA(1/0)" },
  { formula: "=ISLOGICAL(1/0)" },
  { formula: "=N(1/0)" },
  // TYPE
  { formula: "=TYPE(42)" },
  { formula: '=TYPE("hello")' },
  { formula: "=TYPE(TRUE)" },
  { formula: "=TYPE(1/0)" },
  { formula: "=TYPE({1,2,3})" },
  { formula: "=TYPE(A1)", grid: { A1: 5 } },
  { formula: "=TYPE(A1)" }, // blank cell
  // CELL
  { formula: '=CELL("format", A1)', grid: { A1: 42 } },
  { formula: '=CELL("type", A1)', grid: { A1: 42 } },
  { formula: '=CELL("width", A1)', grid: { A1: 42 } },
  // ISDATE
  { formula: '=ISDATE("2024-01-15")' },
  { formula: "=ISDATE(TODAY())" },
  // ISREF
  { formula: "=ISREF(A1)", grid: { A1: 1 } },
  { formula: "=ISREF(A1:A3)" },
  { formula: '=ISREF(INDIRECT("A1"))' },
  // SHEETS
  { formula: "=SHEETS()" },
  { formula: "=SHEETS(A1)", grid: { A1: 1 } },
  // ISBLANK empty-string cell vs literal
  { formula: "=ISBLANK(A1)", grid: { A1: "" } },
  { formula: '=ISBLANK("")' },
  { formula: "=ISBLANK(A1)" }, // truly empty cell
];

const engines = ["hyperformula", "ironcalc", "formulas", "pycel"] as const;

for (const eng of engines) {
  const d = createDriver(eng);
  await d.init();
  const results = await d.evaluateBatch(cases as any);
  console.log(`\n========== ${eng} ==========`);
  results.forEach((r, i) => {
    console.log(`${cases[i].formula}${cases[i].grid ? "  grid=" + JSON.stringify(cases[i].grid) : ""}  =>  ${JSON.stringify(r)}`);
  });
  if ((d as any).dispose) await (d as any).dispose();
}
