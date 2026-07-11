import { createDriver } from "@cartularium/drivers";
for (const p of ["hyperformula", "ironcalc", "formulas", "pycel", "libreoffice", "lattice"] as const) {
  try {
    const d = createDriver(p as any);
    await d.init();
    const r = await d.evaluateBatch([{ id: "x", formula: "=1+1" }]);
    console.log(p, "OK", JSON.stringify(r[0]?.outcome?.kind ?? r[0]));
    await (d as any).dispose?.();
  } catch (e) {
    console.log(p, "FAIL", String(e).slice(0, 140));
  }
}
