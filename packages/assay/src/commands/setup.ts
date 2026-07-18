// install the python-driver deps via uv (xlwings + ironcalc + formulas + pycel).
// The python toolchain lives in @cartularium/drivers now (the drivers extracted), so
// `uv sync` runs there — resolved as the packages/drivers sibling in the monorepo.

import { execSync } from "node:child_process";
import { join } from "node:path";

export async function setup(): Promise<void> {
  // build/commands/setup.js → up 3 = packages/ → drivers (sibling package root)
  const driversRoot = join(import.meta.dirname || ".", "..", "..", "..", "drivers");
  console.log(`Installing python-driver deps via uv (in ${driversRoot})...`);
  execSync("uv sync", { cwd: driversRoot, stdio: "inherit" });
  console.log("\nSetup complete.");
}
