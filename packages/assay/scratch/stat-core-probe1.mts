import { createDriver } from "@cartularium/drivers";

const engines = ["hyperformula", "ironcalc", "formulas", "pycel"] as const;

// battery: [label, formula, grid?]
const battery: Array<[string, string, Record<string, unknown>?]> = [
  // COUNTA empty-string-cell: excel/formulas/lattice=2, gsheets/hyperformula/ironcalc=3
  ["counta-emptystr-B", "=COUNTA(B1:B3)", { B1: 3.14, B2: "hello", B3: "" }],
  ["counta-emptystr-A", "=COUNTA(A1:A3)", { A1: 1, A2: "", A3: 3 }],
  // COUNTBLANK: excel=3, hyperformula=2
  ["countblank", "=COUNTBLANK(A1:A5)", { A1: 1, A2: "", A3: "hello" }],
  // *A inline boolean vs range coercion (ironcalc divergence hypothesis)
  ["stdeva-inline-bool", "=STDEVA(1, 2, TRUE)"],
  ["stdeva-mixed-C", "=STDEVA(C1:C5)", { C1: 1, C2: "text", C3: true, C4: false, C5: 2 }],
  ["stdevpa-inline-bool", "=STDEVPA(1, 2, TRUE)"],
  ["vara-inline-bool", "=VARA(1, 2, TRUE)"],
  ["varpa-inline-bool", "=VARPA(1, 2, TRUE)"],
  ["averagea-inline-bool", "=AVERAGEA(1, 2, TRUE)"],
  // pycel inline negative oddity
  ["max-inline-neg", "=MAX(-3, -1, -7)"],
  ["min-inline-neg", "=MIN(-3, -1, -7)"],
  ["max-inline-pos", "=MAX(1, 5, 3, 2, 4)"],
  ["max-grid", "=MAX(A1:A3)", { A1: 10, A2: 30, A3: 20 }],
  // missing-function checks
  ["counta-basic", "=COUNTA(B1:B3)", { B1: 1, B2: 2, B3: 3 }],
  ["countblank-basic", "=COUNTBLANK(A1:A3)", { A1: 1 }],
  ["geomean", "=GEOMEAN(A1:A5)", { A1: 1, A2: 2, A3: 3, A4: 4, A5: 5 }],
  ["harmean", "=HARMEAN(A1:A5)", { A1: 1, A2: 2, A3: 3, A4: 4, A5: 5 }],
  ["stdev", "=STDEV(1, 3)"],
  ["stdev-s", "=STDEV.S(1, 2, 3, 4, 5)"],
  ["stdev-p", "=STDEV.P(1, 2, 3, 4, 5)"],
  ["stdevp", "=STDEVP(1, 2, 3, 4, 5)"],
  // MODE.MULT
  ["modemult-single", "=MODE.MULT(1, 2, 2, 3, 4)"],
  ["modemult-norepeat", "=MODE.MULT(1, 2, 3)"],
  ["modemult-tied", "=MODE.MULT(B1:B5)", { B1: 1, B2: 2, B3: 2, B4: 3, B5: 3 }],
  // PERCENTRANK.EXC precision
  ["percentrank-exc", "=PERCENTRANK.EXC(A1:A5, 1)", { A1: 1, A2: 2, A3: 3, A4: 4, A5: 5 }],
];

for (const eng of engines) {
  const d = createDriver(eng);
  await d.init();
  const res = await d.evaluateBatch(
    battery.map(([, formula, grid]) => (grid ? { formula, grid } : { formula })),
  );
  console.log(`\n======== ${eng} ========`);
  battery.forEach(([label], i) => {
    console.log(label.padEnd(22), JSON.stringify(res[i]));
  });
  if (d.dispose) await d.dispose();
}
