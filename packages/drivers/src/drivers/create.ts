// createDriver — the construction factory (ratified driver contract §3.4 / decision 4).
// A platform-discriminated config makes the pure-vs-live-host asymmetry a TYPE, not an
// if/else: `createDriver("hyperformula")` needs nothing, `createDriver("gsheets", …)`
// requires auth. Replaces the `new XDriver(...)` chain in shared.ts `buildDrivers`
// (which stays as the CLI glue that builds these configs from flags + `assay login`).
// Constructs only — `init()` stays the caller's call. Extracts to `@cartularium/drivers`
// alongside the driver classes (Step 4); the CLI glue stays in assay.

import type { Driver } from "./driver.js";
import type { Platform } from "../format/values.js";
import { ExcelDriver } from "./excel.js";
import { GSheetsDriver } from "./gsheets.js";
import { LatticeDriver } from "./lattice.js";
import { IronCalcDriver } from "./ironcalc.js";
import { HyperFormulaDriver } from "./hyperformula.js";
import { LibreOfficeDriver } from "./libreoffice.js";
import { FormulasDriver } from "./formulas.js";
import { PycelDriver } from "./pycel.js";

/** Engines that run in-process with no construction config (probe-ergonomic). */
export type PureEngine = "hyperformula" | "ironcalc" | "formulas" | "pycel" | "libreoffice";

/** Excel via xlwings (local host). Both fields optional — defaults match the class. */
export interface ExcelConfig {
  verbose?: boolean;
  workbookPath?: string | null;
}

/** gsheets via the Sheets API (live host) — needs a spreadsheet + an access token. */
export interface GSheetsConfig {
  spreadsheetId: string;
  accessToken: string;
}

// The asymmetry as a type: gsheets REQUIRES config; pure engines + lattice take none;
// excel's config is optional.
export function createDriver(platform: "excel", config?: ExcelConfig): Driver;
export function createDriver(platform: "gsheets", config: GSheetsConfig): Driver;
export function createDriver(platform: PureEngine | "lattice", config?: never): Driver;
export function createDriver(platform: Platform, config?: unknown): Driver {
  switch (platform) {
    case "excel": {
      const c = (config ?? {}) as ExcelConfig;
      return new ExcelDriver(c.verbose ?? false, c.workbookPath ?? null);
    }
    case "gsheets":
      return new GSheetsDriver(config as GSheetsConfig);
    case "hyperformula":
      return new HyperFormulaDriver();
    case "ironcalc":
      return new IronCalcDriver();
    case "formulas":
      return new FormulasDriver();
    case "pycel":
      return new PycelDriver();
    case "libreoffice":
      return new LibreOfficeDriver();
    case "lattice":
      return new LatticeDriver();
    default: {
      const never: never = platform;
      throw new Error(`createDriver: unknown platform ${String(never)}`);
    }
  }
}
