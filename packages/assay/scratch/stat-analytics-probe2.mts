import { createDriver } from "@cartularium/drivers";

// Verify the wiki identity: MARGINOFERROR(range, c) == CONFIDENCE.T(1-c, STDEV(range), COUNT(range))
// corpus basic: range=1..5, c=0.05 -> recorded gsheets/lattice = 0.04718417110127355
// corpus wider: range=10,20,30,40,50, c=0.01 -> recorded = 0.09428439626864216
const probes = [
  { formula: "=CONFIDENCE.T(0.95, STDEV(A1:A5), COUNT(A1:A5))", grid: { A1: 1, A2: 2, A3: 3, A4: 4, A5: 5 } },
  { formula: "=CONFIDENCE.T(0.99, STDEV(A1:A5), COUNT(A1:A5))", grid: { A1: 10, A2: 20, A3: 30, A4: 40, A5: 50 } },
];
for (const name of ["hyperformula", "formulas"] as const) {
  const d = createDriver(name);
  await d.init();
  const r = await d.evaluateBatch(probes);
  console.log(`\n== ${name} ==`);
  for (let i = 0; i < probes.length; i++) console.log(probes[i].formula, "=>", JSON.stringify(r[i]));
  await d.dispose?.();
}
