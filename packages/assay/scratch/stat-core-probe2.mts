import { createDriver } from "@cartularium/drivers";

const cases: Array<[string, string, Record<string, unknown>?]> = [
  ["stdeva-inline-num", "=STDEVA(1, 2, 3)"],
  ["stdeva-inline-bool", "=STDEVA(1, 2, TRUE)"],
  ["stdeva-range-bool", "=STDEVA(C1:C3)", { C1: 1, C2: 2, C3: true }],
  ["vara-inline-num", "=VARA(1, 2, 3)"],
  ["vara-inline-bool", "=VARA(1, 2, TRUE)"],
  ["stdev.s-inline-bool", "=STDEV.S(1, 2, TRUE)"],
  ["average-inline-bool", "=AVERAGE(1, 2, TRUE)"],
];

for (const eng of ["hyperformula", "ironcalc"] as const) {
  const d = createDriver(eng);
  await d.init();
  const res = await d.evaluateBatch(cases.map(([, f, g]) => (g ? { formula: f, grid: g } : { formula: f })));
  console.log(`\n== ${eng} ==`);
  cases.forEach(([label], i) => {
    const o = (res[i] as any).outcome;
    const p = o?.grid?.[0]?.[0]?.primitive;
    console.log(label.padEnd(20), JSON.stringify(p));
  });
  if (d.dispose) await d.dispose();
}
