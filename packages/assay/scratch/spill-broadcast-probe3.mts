import { createDriver } from "@cartularium/drivers";
const hf = createDriver("hyperformula");
await hf.init();
const p = ["=TRUE()","=FALSE()","=IF(TRUE(), 5, 6)","=AND(TRUE(), TRUE())","=NOT(FALSE())","=IF(2>1, {1,2,3}, {10,20,30})"];
const r = await hf.evaluateBatch(p.map(formula=>({formula})));
r.forEach((x,i)=>console.log(`${p[i]}\t=> ${JSON.stringify((x as any).outcome ?? x)}`));
