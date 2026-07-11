import { createDriver } from "@cartularium/drivers";

const formulas = [
  // pycel negative-arg hypothesis
  '=ERF(1)', '=ERF(0)', '=ERF(-1)', '=ERF(-0.5)', '=ERF(0,1)',
  '=DEC2BIN(10)', '=DEC2BIN(-2)', '=DEC2HEX(255)', '=DEC2HEX(-1)', '=DEC2OCT(8)', '=DEC2OCT(-1)',
  '=BIN2DEC("1111111111")', '=HEX2DEC("FFFFFFFFFF")',
  // missing-function sets
  '=ERF.PRECISE(1)', '=IMLOG("1")', '=IMLOG("3+4i")', '=IMCOTH("1")', '=IMTANH("0")', '=IMTANH("1+1i")',
  // precision / complex string rendering
  '=IMCOS("1+1i")', '=IMSIN("1+1i")', '=IMEXP("1")', '=IMLOG2("8")', '=IMCSC("1+1i")', '=IMTAN("1+1i")',
  '=IMCOT("1")', '=IMSEC("1+1i")',
  // error attribution
  '=IMARGUMENT("i")', '=IMDIV("1+2i","0")', '=IMARGUMENT("3+4i")',
  // zero cases
  '=IMCOS("0")', '=IMSIN("0")', '=IMEXP("0")', '=IMLOG10("10")',
];

const engines = ["hyperformula", "ironcalc", "formulas", "pycel"] as const;
const out: Record<string, any> = {};
for (const e of engines) {
  const d = createDriver(e);
  await d.init();
  const results = await d.evaluateBatch(formulas.map((f) => ({ formula: f })));
  out[e] = results.map((r: any, i: number) => [formulas[i], JSON.stringify(r?.outcome ?? r)]);
  if (d.dispose) await d.dispose();
}
for (const e of engines) {
  console.log("\n===== " + e + " =====");
  for (const [f, r] of out[e]) console.log(f.padEnd(26), r);
}
