import { createDriver } from "@cartularium/drivers";
const d = createDriver("hyperformula");
await d.init();
// 2x3 table: excel p = 0.00030819201700830936 at df=(2-1)(3-1)=2. lattice = 0.0063762422150260845
// 2x2 table: excel p = 0.31487864133641985 at df=(2-1)(2-1)=1. lattice = 0.798807828845659
const probes = [
  "=CHISQ.INV.RT(0.00030819201700830936, 2)",   // back out chi2 stat for 2x3
  "=CHISQ.INV.RT(0.31487864133641985, 1)",       // back out chi2 stat for 2x2
];
const r = await d.evaluateBatch(probes.map(formula=>({formula})));
const chi2_2x3 = (r[0] as any).outcome.grid[0][0].primitive.value;
const chi2_2x2 = (r[1] as any).outcome.grid[0][0].primitive.value;
console.log("chi2 statistic (2x3 table):", chi2_2x3);
console.log("chi2 statistic (2x2 table):", chi2_2x2);

// Now re-evaluate the tail at candidate df values
const check = [
  `=CHISQ.DIST.RT(${chi2_2x3}, 2)`,  // excel df -> should match excel 0.000308...
  `=CHISQ.DIST.RT(${chi2_2x3}, 5)`,  // flat-count df (rows*cols-1=5) -> lattice hypothesis 0.006376
  `=CHISQ.DIST.RT(${chi2_2x3}, 4)`,  // alt
  `=CHISQ.DIST.RT(${chi2_2x2}, 1)`,  // excel df -> 0.31488
  `=CHISQ.DIST.RT(${chi2_2x2}, 3)`,  // flat-count df (4-1=3) -> lattice hypothesis 0.79881
];
const r2 = await d.evaluateBatch(check.map(formula=>({formula})));
check.forEach((f,i)=>{
  console.log(f.padEnd(50), "=>", (r2[i] as any).outcome.grid[0][0].primitive.value);
});
console.log("\nlattice recorded 2x3:", 0.0063762422150260845, " 2x2:", 0.798807828845659);
