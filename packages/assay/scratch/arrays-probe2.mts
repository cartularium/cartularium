import { createDriver } from "@cartularium/drivers";

// Edge exploration on `formulas` (the pure engine that implements the reshape family)
// and pycel/hyperformula for contrast.
const tasks = [
  { formula: "=WRAPROWS({1,2,3}, 2)" },        // no pad arg -> default pad?
  { formula: "=WRAPCOLS({1,2,3}, 2)" },        // no pad arg
  { formula: "=TOCOL({1,\"\",3})" },            // default scan, empty string
  { formula: "=TOCOL({1,2;3,4})" },             // default scan order (by row)
  { formula: "=TOROW({1,2;3,4})" },             // default scan order
  { formula: "=SORT({3;1;2}, 1, -1)" },         // descending
  { formula: "=HSTACK({1;2}, {3;4})" },         // 2D stack
  { formula: "=VSTACK({1,2}, {3,4})" },         // 2D stack
];

for (const eng of ["formulas", "hyperformula"] as const) {
  const d = createDriver(eng);
  await d.init();
  const res = await d.evaluateBatch(tasks);
  console.log("\n##### " + eng + " #####");
  for (let i = 0; i < tasks.length; i++) {
    const o = (res[i] as any).outcome;
    console.log(tasks[i].formula, "=>", o.kind, JSON.stringify(o.grid ?? o));
  }
  if (d.dispose) await d.dispose();
}
