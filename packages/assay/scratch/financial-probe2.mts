import { createDriver } from "@cartularium/drivers";

// Test XNPV / XIRR date-argument coercion: numeric serial vs ISO string seeds.
async function run(engine: "hyperformula" | "ironcalc" | "formulas", tasks: any[]) {
  const drv = createDriver(engine);
  await drv.init();
  const res = await drv.evaluateBatch(tasks);
  console.log(`\n===== ${engine} =====`);
  tasks.forEach((t, i) => console.log(JSON.stringify({ label: t._label, r: res[i]?.outcome?.grid?.[0]?.[0]?.primitive ?? res[i] })));
  if (drv.dispose) await drv.dispose();
}

const serials = { A1: 0, A2: 1000, B1: 43831, B2: 44197 };
const strings = { A1: 0, A2: 1000, B1: "2020-01-01", B2: "2021-01-01" };

const xirrSerials = { A1: -1000, A2: 500, A3: 600, B1: 43831, B2: 44197, B3: 44562 };
const xirrStrings = { A1: -1000, A2: 500, A3: 600, B1: "2020-01-01", B2: "2021-01-01", B3: "2022-01-01" };

const tasks = [
  { _label: "XNPV serial-dates", formula: "=XNPV(0.1, A1:A2, B1:B2)", grid: serials },
  { _label: "XNPV string-dates", formula: "=XNPV(0.1, A1:A2, B1:B2)", grid: strings },
  { _label: "XIRR serial-dates", formula: "=XIRR(A1:A3, B1:B3, 0.1)", grid: xirrSerials },
  { _label: "XIRR string-dates", formula: "=XIRR(A1:A3, B1:B3, 0.1)", grid: xirrStrings },
];

await run("hyperformula", tasks);
await run("ironcalc", tasks);
await run("formulas", tasks);
