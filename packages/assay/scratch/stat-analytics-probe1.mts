import { createDriver } from "@cartularium/drivers";

const gridAB5 = { A1: 1, A2: 2, A3: 3, A4: 5, A5: 4, B1: 2, B2: 3, B3: 5, B4: 4, B5: 6 };
// generic 5x2 numeric grid for range-taking fns (exact values don't matter for missing-function checks)

const probes = [
  // legacy vs modern name coverage
  { formula: "=CONFIDENCE.T(0.05, 2.5, 50)" },
  { formula: "=CONFIDENCE(0.05, 1, 100)" },
  { formula: "=CONFIDENCE.NORM(0.05, 1, 100)" },
  { formula: "=COVAR(A1:A5, B1:B5)", grid: gridAB5 },
  { formula: "=COVARIANCE.P(A1:A5, B1:B5)", grid: gridAB5 },
  { formula: "=FTEST(A1:A5, B1:B5)", grid: gridAB5 },
  { formula: "=F.TEST(A1:A5, B1:B5)", grid: gridAB5 },
  { formula: "=TTEST(A1:A5, B1:B5, 1, 2)", grid: gridAB5 },
  { formula: "=T.TEST(A1:A5, B1:B5, 1, 2)", grid: gridAB5 },
  { formula: "=ZTEST(A1:A5, 4, 1.5)", grid: gridAB5 },
  { formula: "=Z.TEST(A1:A5, 4, 1.5)", grid: gridAB5 },
  { formula: "=FORECAST(6, B1:B5, A1:A5)", grid: gridAB5 },
  { formula: "=FORECAST.LINEAR(6, B1:B5, A1:A5)", grid: gridAB5 },
  { formula: "=INTERCEPT(B1:B5, A1:A5)", grid: gridAB5 },
  { formula: "=SLOPE(B1:B5, A1:A5)", grid: gridAB5 },
  { formula: "=KURT(A1:A5)", grid: gridAB5 },
  { formula: "=SKEW(A1:A5)", grid: gridAB5 },
  { formula: "=SKEW.P(A1:A5)", grid: gridAB5 },
  { formula: "=PEARSON(A1:A5, B1:B5)", grid: gridAB5 },
  { formula: "=CORREL(A1:A5, B1:B5)", grid: gridAB5 },
  { formula: "=RSQ(B1:B5, A1:A5)", grid: gridAB5 },
  { formula: "=STEYX(B1:B5, A1:A5)", grid: gridAB5 },
  // non-standard
  { formula: "=MARGINOFERROR(A1:A5, 0.05)", grid: { A1: 1, A2: 2, A3: 3, A4: 4, A5: 5 } },
  // database
  { formula: "=DSTDEV(A1:D5, \"Price\", F1:F2)", grid: gridAB5 },
  // external
  { formula: "=HYPERLINK(\"https://example.com\")" },
  { formula: "=HYPERLINK(\"https://example.com\", \"click me\")" },
  { formula: "=TRUE()" },
  { formula: "=FALSE()" },
];

for (const name of ["hyperformula", "ironcalc", "formulas", "pycel"] as const) {
  const d = createDriver(name);
  await d.init();
  const results = await d.evaluateBatch(probes);
  console.log(`\n===== ${name} =====`);
  for (let i = 0; i < probes.length; i++) {
    console.log(probes[i].formula.padEnd(42), "=>", JSON.stringify(results[i]));
  }
  await d.dispose?.();
}
