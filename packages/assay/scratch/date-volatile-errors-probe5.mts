import { createDriver } from "@cartularium/drivers";
const tasks = [
  { label: "HF WEEKNUM(DATE,21)", formula: "=WEEKNUM(DATE(2023,1,1),21)" },
  { label: "HF WEEKNUM(DATE,1)", formula: "=WEEKNUM(DATE(2023,1,1),1)" },
  { label: "HF WEEKNUM(45658,21)", formula: "=WEEKNUM(44927,21)" },
  { label: "HF ISOWEEKNUM(DATE)", formula: "=ISOWEEKNUM(DATE(2023,1,1))" },
  { label: "HF YEARFRAC(45658..)", formula: "=YEARFRAC(45658,46023,2)" },
];
for (const eng of ["hyperformula"]) {
  const d = createDriver(eng as any); await d.init();
  const res: any = await d.evaluateBatch(tasks.map(t=>({formula:t.formula})));
  console.log("=== "+eng+" ===");
  res.forEach((r:any,i:number)=>{const o=r.outcome??r;const g=o.grid?.[0]?.[0]?.primitive??o;console.log("  "+tasks[i].label.padEnd(22)+" | "+JSON.stringify(g));});
  if(d.dispose) await d.dispose();
}
