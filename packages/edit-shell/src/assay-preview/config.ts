export const ASSAY_API_VERSION = 1
export const CURRENT_SUBMITTED_CASE_CONTRACT = 1
export const CURRENT_PREVIEW_INPUT_CONTRACT = 1
export const CURRENT_PREVIEW_RESULT_CONTRACT = 1

export const SUPPORTED_SUBMITTED_CASE_CONTRACTS = [CURRENT_SUBMITTED_CASE_CONTRACT] as const
export const SUPPORTED_PREVIEW_INPUT_CONTRACTS = new Set([CURRENT_PREVIEW_INPUT_CONTRACT])
export const SUPPORTED_PREVIEW_RESULT_CONTRACTS = new Set([CURRENT_PREVIEW_RESULT_CONTRACT])
export const SUPPORTED_PREVIEW_INPUT_CONTRACT_LIST = [CURRENT_PREVIEW_INPUT_CONTRACT] as const
export const SUPPORTED_PREVIEW_RESULT_CONTRACT_LIST = [CURRENT_PREVIEW_RESULT_CONTRACT] as const

export const ASSAY_CASE_SCHEMA_VERSION = 2
export const ASSAY_PLATFORMS = [
  "gsheets",
  "excel",
  "lattice",
  "ironcalc",
  "hyperformula",
  "libreoffice",
  "formulas",
  "pycel",
] as const
export const ASSAY_CATEGORIES = [
  "value",
  "shape",
  "error-code",
  "format",
  "locale",
  "interaction",
  "volatile",
] as const
export const IMPLEMENTED_PREVIEW_PLATFORMS = ["gsheets", "excel", "hyperformula"] as const
export const DEFAULT_REVIEW_PREVIEW_PLATFORMS = ["excel", "gsheets"] as const

export const MAX_PREVIEW_INPUT_BYTES = 128 * 1024
export const MAX_PREVIEW_RESULT_BYTES = 512 * 1024

export const CLAIM_TIMEOUT_MS = 5 * 60 * 1000
