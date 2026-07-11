import { createDriver } from "@cartularium/drivers";

// Excel serials (1900 system) for the grid dates we need
const d = {
  "2008-01-01": 39448,
  "2008-03-01": 39508,
  "2008-10-30": 39751,
  "2009-02-15": 39859,
  "2009-04-01": 39904,
  "2020-01-01": 43831,
  "2021-01-01": 43831 + 366,
  "2022-01-01": 43831 + 366 + 365,
};

async function run(engine: "hyperformula" | "ironcalc" | "formulas" | "pycel", tasks: any[]) {
  const drv = createDriver(engine);
  await drv.init();
  const res = await drv.evaluateBatch(tasks);
  console.log(`\n===== ${engine} =====`);
  tasks.forEach((t, i) => {
    console.log(JSON.stringify({ f: t.formula, r: res[i] }));
  });
  if (drv.dispose) await drv.dispose();
}

const xnpvSingle = { formula: "=XNPV(0.1, A1:A2, B1:B2)", grid: { A1: 0, A2: 1000, B1: d["2020-01-01"], B2: d["2021-01-01"] } };
const xnpvStd = { formula: "=XNPV(0.09, A1:A5, B1:B5)", grid: { A1: -10000, A2: 2750, A3: 4250, A4: 3250, A5: 2750, B1: d["2008-01-01"], B2: d["2008-03-01"], B3: d["2008-10-30"], B4: d["2009-02-15"], B5: d["2009-04-01"] } };
const xirrGuess = { formula: "=XIRR(A1:A3, B1:B3, 0.1)", grid: { A1: -1000, A2: 500, A3: 600, B1: d["2020-01-01"], B2: d["2021-01-01"], B3: d["2022-01-01"] } };

// ironcalc: does it round on read-back?
const ironcalcRounding = [
  { formula: "=CUMIPMT(0.05/12, 360, 100000, 1, 12, 0)" },
  { formula: "=PMT(0.06/12, 360, 0, 1000000)" },
  { formula: "=NPER(0.05/12, -1073.64, 200000)" },
  { formula: "=DDB(1000, 100, 10, 10)" },
  { formula: "=NPV(0.1, -1000, 300, 300, 300, 300, 300)" },
  { formula: "=TBILLYIELD(DATE(2011,2,15), DATE(2011,5,15), 98.5)" },
  { formula: "=IRR(A1:A4)", grid: { A1: -10000, A2: 3000, A3: 4200, A4: 6800 } },
  { formula: "=MIRR(A1:A4, 0.1, 0.1)", grid: { A1: -1000, A2: 500, A3: 500, A4: 500 } },
];

// hyperformula: missing set + has-set + RRI + XNPV/XIRR
const hf = [
  { formula: "=ACCRINT(DATE(2011,2,15), DATE(2011,8,15), DATE(2012,2,15), 0.0575, 1000, 1, 1)" },
  { formula: "=PRICE(DATE(2011,2,15), DATE(2021,11,15), 0.0575, 0.065, 100, 2, 0)" },
  { formula: "=YIELD(DATE(2011,2,15), DATE(2021,11,15), 0.0575, 95.04287, 100, 2, 0)" },
  { formula: "=VDB(2400, 300, 10, 0, 10, 2, TRUE)" },
  { formula: "=DISC(DATE(2011,2,15), DATE(2011,11,15), 97.975, 100, 0)" },
  { formula: "=CUMIPMT(0.05/12, 360, 100000, 1, 12, 0)" },
  { formula: "=TBILLEQ(DATE(2011,2,15), DATE(2011,5,15), 0.065)" },
  { formula: "=RRI(0, 1000, 2000)" },
  xnpvSingle,
  xnpvStd,
  xirrGuess,
];

// formulas (python lib): ACCRINT day-count, IPMT #NUM!, XNPV number, RRI
const fm = [
  { formula: "=ACCRINT(DATE(2011,2,15), DATE(2011,8,15), DATE(2012,2,15), 0.0575, 1000, 1, 1)" },
  { formula: "=ACCRINT(DATE(2008,3,1), DATE(2008,8,31), DATE(2011,2,15), 0.1, 1000, 2, 0)" },
  { formula: "=IPMT(0.05/12, 360, 360, -200000)" },
  { formula: "=RRI(0, 1000, 2000)" },
  xnpvSingle,
];

// ironcalc RRI + IPMT-last for error comparison
const ironcalcErr = [
  { formula: "=RRI(0, 1000, 2000)" },
  { formula: "=IPMT(0.05/12, 360, 360, -200000)" },
];

await run("ironcalc", [...ironcalcRounding, ...ironcalcErr]);
await run("hyperformula", hf);
await run("formulas", fm);
