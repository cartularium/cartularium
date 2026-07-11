import { createDriver } from "@cartularium/drivers";

async function run(name: string, formulas: {formula:string,grid?:any}[]) {
  const d = createDriver(name as any);
  await d.init();
  const r = await d.evaluateBatch(formulas);
  console.log("\n===== " + name + " =====");
  formulas.forEach((f,i)=>{
    const cell = (r[i] as any);
    console.log(f.formula.padEnd(46), "=>", JSON.stringify(cell?.outcome ?? cell));
  });
}

const coverageProbes = [
  // modern names
  "=BETA.DIST(0.5, 2, 2, TRUE, 0, 1)",
  "=NORM.DIST(1, 0, 1, TRUE)",
  "=CHISQ.DIST.RT(4, 4)",
  "=POISSON.DIST(5, 3, TRUE)",
  // legacy names
  "=BETADIST(0.5, 2, 2)",
  "=BETADIST(5, 2, 3, 0, 10)",
  "=HYPGEOMDIST(1, 4, 8, 20)",
  "=LOGNORMDIST(2, 0, 1)",
  "=NEGBINOMDIST(0, 5, 0.5)",
  "=NORMSDIST(1.96)",
  "=NORMDIST(0, 0, 1, FALSE)",
  "=BINOMDIST(2, 5, 0.5, TRUE)",
  "=EXPONDIST(2, 0.5, TRUE)",
  "=POISSON(5, 3, TRUE)",
  "=WEIBULL(2, 2, 1, TRUE)",
  "=GAMMADIST(2, 2, 1, TRUE)",
  "=CHIDIST(4, 4)",
  "=FDIST(1, 5, 10)",
  "=TDIST(1.812, 10, 1)",
  "=NORMINV(0.95, 0, 1)",
  "=GAMMA(0.5)",
].map(formula=>({formula}));

await run("hyperformula", coverageProbes);
await run("ironcalc", coverageProbes);
await run("formulas", coverageProbes);
await run("pycel", coverageProbes);
