import { createDriver } from "@cartularium/drivers";
const d = createDriver("hyperformula");
await d.init();
const r = await d.evaluateBatch([
  { id: "t1", formula: '=TEXT(0.5,"0.0%")' },
  { id: "t2", formula: "=SEQUENCE(2,2)" },
]);
console.log(JSON.stringify(r, null, 1));
