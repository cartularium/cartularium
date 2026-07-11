import { createDriver } from "@cartularium/drivers";
async function run(engine: string, formulas: any[]) {
  const d = createDriver(engine as any);
  await d.init();
  const res = await d.evaluateBatch(formulas);
  console.log("=== " + engine + " ===");
  res.forEach((r: any, i: number) => {
    console.log(JSON.stringify(formulas[i].formula), "->", JSON.stringify(r.outcome ?? r));
  });
  if (d.dispose) await d.dispose();
}
const fs = [
  { formula: "=TRUE>0" },
  { formula: "=TRUE>1" },
  { formula: "=FALSE<0" },
  { formula: '="a">1' },
  { formula: '="a">TRUE' },
  { formula: '=1>"a"' },
  { formula: '="apple"<"banana"' },
  { formula: "=1/3" },
  { formula: "=1/3*3=1" },
  { formula: "=0.1+0.2" },
  { formula: "=123456789012345678" },
];
for (const e of ["hyperformula", "ironcalc", "formulas", "pycel"]) {
  try { await run(e, fs); } catch (err) { console.log(e, "ERR", String(err).slice(0,200)); }
}
