import { createDriver } from "@cartularium/drivers";

const engines = ["hyperformula", "ironcalc", "formulas", "pycel"] as const;

const tasks = [
  // modern dynamic-array reshape/spill
  { formula: "=SEQUENCE(2, 3)" },
  { formula: "=HSTACK(1, 2, 3)" },
  { formula: "=VSTACK(1, 2, 3)" },
  { formula: "=SORT({3;1;2})" },
  { formula: "=TOCOL({1,2;3,4}, 0, TRUE)" },
  { formula: "=TOROW({1,2;3,4}, 0, FALSE)" },
  { formula: "=WRAPCOLS({1,2,3,4}, 2)" },
  { formula: "=WRAPROWS({1,2,3}, 2, \"x\")" },
  // FLATTEN — Google Sheets proprietary
  { formula: "=FLATTEN({1,2;3,4})" },
  // FREQUENCY inline
  { formula: "=FREQUENCY({1;2;3;4;5}, {2;4})" },
  // MINVERSE singular
  { formula: "=MINVERSE({1,2;2,4})" },
  // INDEX with grid (all pure engines should give 20)
  { formula: "=INDEX(A1:B2, 2, 1)", grid: { A1: 10, B1: 11, A2: 20, B2: 21 } },
  // regression family
  { formula: "=LINEST({1,2,3}, {1,2,3})" },
  { formula: "=LINEST({2,4,6,8})" },
  { formula: "=LINEST({1,2,3,4}, {1,2,3,4}, TRUE, TRUE)" },
  { formula: "=LOGEST({2,4,8,16}, {1,2,3,4})" },
  { formula: "=LOGEST({2,4,8,16})" },
  { formula: "=TREND({2,4,6,8})" },
  { formula: "=TREND({1,2,3,4}, {1,2,3,4}, {5;6;7})" },
  { formula: "=TREND({1,2,3}, {1,2,3}, {4,5})" },
  { formula: "=GROWTH({2,4,8,16})" },
  { formula: "=GROWTH({2,4,8,16}, {1,2,3,4}, {5;6})" },
];

for (const eng of engines) {
  const d = createDriver(eng);
  await d.init();
  const res = await d.evaluateBatch(tasks);
  console.log("\n########## " + eng + " ##########");
  for (let i = 0; i < tasks.length; i++) {
    console.log(tasks[i].formula, "=>", JSON.stringify(res[i]));
  }
  if (d.dispose) await d.dispose();
}
