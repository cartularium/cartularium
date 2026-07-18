import type {
  FunctionCompatibilityEntry,
  FormulaCompatibilityManifest,
  FormulaCompatibilitySupport,
  PlatformFunctionSupport,
} from "@cartularium/contracts"
import {
  ALL_PLATFORMS,
  FORMULA_COMPATIBILITY_MANIFEST_VERSION,
} from "@cartularium/contracts"
import type { FormulaDialect } from "../dialect.js"

export type FunctionSupport = FormulaCompatibilitySupport
export type DialectFunctionSupport = PlatformFunctionSupport
export type FunctionMetadata = FunctionCompatibilityEntry

export interface CompatibilityIndex {
  functions: Map<string, FunctionMetadata>
}

// Transitional seed. The canonical compatibility feed should be generated from Assay;
// see packages/contracts/INTERLEAF-COMPATIBILITY.md.
const FORMULA_COMPATIBILITY_MANIFEST: FormulaCompatibilityManifest = {
  version: FORMULA_COMPATIBILITY_MANIFEST_VERSION,
  generatedAt: "1970-01-01T00:00:00.000Z",
  platforms: ALL_PLATFORMS,
  functions: {
    ARRAYFORMULA: {
      name: "ARRAYFORMULA",
      platforms: {
        gsheets: {
          support: "native",
          note: "Google Sheets array expansion wrapper.",
        },
        excel: {
          support: "absent",
          note: "Excel dynamic arrays do not use an ARRAYFORMULA wrapper.",
        },
      },
      tags: ["array"],
    },
    ENCODEURL: {
      name: "ENCODEURL",
      platforms: {
        gsheets: {
          support: "native",
          note: "Google Sheets URL encoding helper.",
        },
        excel: {
          support: "absent",
          note: "Excel has no compatible text formula function.",
        },
      },
      tags: ["web"],
    },
    GOOGLEFINANCE: {
      name: "GOOGLEFINANCE",
      platforms: {
        gsheets: {
          support: "external-service",
          note: "Google Sheets market data service.",
        },
        excel: {
          support: "absent",
          note: "Excel has no compatible formula function.",
        },
      },
      tags: ["external-io", "google"],
    },
    GOOGLETRANSLATE: {
      name: "GOOGLETRANSLATE",
      platforms: {
        gsheets: {
          support: "external-service",
          note: "Google Sheets translation service.",
        },
        excel: {
          support: "absent",
          note: "Excel has no compatible formula function.",
        },
      },
      tags: ["external-io", "google"],
    },
    IMPORTDATA: {
      name: "IMPORTDATA",
      platforms: {
        gsheets: {
          support: "external-service",
          note: "Google Sheets external data import.",
        },
        excel: {
          support: "absent",
          note: "Excel has no compatible formula function.",
        },
      },
      tags: ["external-io", "web"],
    },
    IMPORTFEED: {
      name: "IMPORTFEED",
      platforms: {
        gsheets: {
          support: "external-service",
          note: "Google Sheets feed import.",
        },
        excel: {
          support: "absent",
          note: "Excel has no compatible formula function.",
        },
      },
      tags: ["external-io", "web"],
    },
    IMPORTHTML: {
      name: "IMPORTHTML",
      platforms: {
        gsheets: {
          support: "external-service",
          note: "Google Sheets HTML table/list import.",
        },
        excel: {
          support: "absent",
          note: "Excel has no compatible formula function.",
        },
      },
      tags: ["external-io", "web"],
    },
    IMPORTRANGE: {
      name: "IMPORTRANGE",
      platforms: {
        gsheets: {
          support: "context-required",
          note: "Google Sheets cross-spreadsheet range import.",
        },
        excel: {
          support: "absent",
          note: "Excel has no compatible formula function.",
        },
      },
      tags: ["external-io", "workbook"],
    },
    IMPORTXML: {
      name: "IMPORTXML",
      platforms: {
        gsheets: {
          support: "external-service",
          note: "Google Sheets XML/HTML import.",
        },
        excel: {
          support: "absent",
          note: "Excel has no compatible formula function.",
        },
      },
      tags: ["external-io", "web"],
    },
    ISURL: {
      name: "ISURL",
      platforms: {
        gsheets: {
          support: "native",
          note: "Google Sheets URL predicate.",
        },
        excel: {
          support: "absent",
          note: "Excel has no compatible formula function.",
        },
      },
      tags: ["web"],
    },
    QUERY: {
      name: "QUERY",
      platforms: {
        gsheets: {
          support: "context-required",
          note: "Google Sheets table query language.",
        },
        excel: {
          support: "absent",
          note: "Excel has no compatible formula function.",
        },
      },
      tags: ["query"],
    },
    SORTN: {
      name: "SORTN",
      platforms: {
        gsheets: {
          support: "native",
          note: "Google Sheets top-N sort/filter helper.",
        },
        excel: {
          support: "absent",
          note: "Excel has no compatible formula function.",
        },
      },
      tags: ["filter"],
    },
  },
}

const DEFAULT_COMPATIBILITY_INDEX = createCompatibilityIndex(FORMULA_COMPATIBILITY_MANIFEST)

export function createCompatibilityIndex(
  manifest: FormulaCompatibilityManifest,
): CompatibilityIndex {
  const functions = new Map<string, FunctionMetadata>()
  for (const entry of Object.values(manifest.functions)) {
    functions.set(entry.name.toUpperCase(), entry)
    functions.set(entry.name.toLowerCase(), entry)
  }
  return { functions }
}

export function getFunctionMetadata(name: string): FunctionMetadata | undefined {
  return DEFAULT_COMPATIBILITY_INDEX.functions.get(name.toUpperCase())
}

export function getDialectFunctionSupport(
  name: string,
  dialect: FormulaDialect,
): DialectFunctionSupport | undefined {
  return getFunctionMetadata(name)?.platforms[dialect]
}

const FUNCTION_METADATA = Object.values(FORMULA_COMPATIBILITY_MANIFEST.functions)

export { FORMULA_COMPATIBILITY_MANIFEST, FUNCTION_METADATA }
