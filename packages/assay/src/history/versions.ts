// probe versionString() across every supported platform without init()

import { ALL_PLATFORMS } from "../format/values.js";
import type { Platform } from "../format/values.js";
import { ExcelDriver } from "@cartularium/drivers";
import { FormulasDriver } from "@cartularium/drivers";
import { HyperFormulaDriver } from "@cartularium/drivers";
import { IronCalcDriver } from "@cartularium/drivers";
import { LatticeDriver } from "@cartularium/drivers";
import { LibreOfficeDriver } from "@cartularium/drivers";
import { PycelDriver } from "@cartularium/drivers";
import type { Driver } from "@cartularium/drivers";

// instantiates each driver without calling init() — versionString() is
// designed to be self-contained so we don't pay subprocess startup cost
// twice during a record run
function instantiate(p: Platform): Driver | null {
  switch (p) {
    case "excel":        return new ExcelDriver();
    case "formulas":     return new FormulasDriver();
    case "hyperformula": return new HyperFormulaDriver();
    case "ironcalc":     return new IronCalcDriver();
    case "lattice":      return new LatticeDriver();
    case "libreoffice":  return new LibreOfficeDriver();
    case "pycel":        return new PycelDriver();
    // gsheets needs creds + a spreadsheet; skipped here. its versionString
    // returns null anyway until the sentinel suite ships
    case "gsheets":      return null;
    default:             return null;
  }
}

export interface VersionProbeResult {
  versions: Partial<Record<Platform, string | null>>;
  // human-readable summary of what was probed and how long each took
  log: Array<{ platform: Platform; result: string | null; ms: number }>;
}

export async function probeVersions(
  platforms: readonly Platform[] = ALL_PLATFORMS,
): Promise<VersionProbeResult> {
  const probes = platforms.map(async (p) => {
    const driver = instantiate(p);
    if (!driver) return { platform: p, result: null, ms: 0 };
    const t0 = Date.now();
    let result: string | null = null;
    try { result = await driver.versionString(); } catch { /* null */ }
    return { platform: p, result, ms: Date.now() - t0 };
  });
  const log = await Promise.all(probes);
  const versions: Partial<Record<Platform, string | null>> = {};
  for (const r of log) versions[r.platform] = r.result;
  return { versions, log };
}
