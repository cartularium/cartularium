import type { FormulaDialect } from "./dialect.js"
import type { FormulaTextResult } from "./diagnostics.js"
import type { FormulaExpr } from "./ir/schema.js"
import { collectCompatibilityDiagnostics } from "./analyze/compatibility.js"
import { parseFormula } from "./parse/formula.js"
import { printFormula } from "./print/printer.js"

export type { FormulaDialect } from "./dialect.js"
export type { FormulaTextResult, TranspileDiagnostic } from "./diagnostics.js"
export {
  createCompatibilityIndex,
  FUNCTION_METADATA,
  FORMULA_COMPATIBILITY_MANIFEST,
  getDialectFunctionSupport,
  getFunctionMetadata,
} from "./compatibility/functions.js"
export type {
  CompatibilityIndex,
  DialectFunctionSupport,
  FunctionMetadata,
  FunctionSupport,
} from "./compatibility/functions.js"
export {
  array,
  binary,
  booleanLiteral,
  call,
  cell,
  columnRange,
  errorLiteral,
  implicitIntersection,
  intersection,
  namedReference,
  missingArgument,
  number,
  postfix,
  range,
  rowRange,
  sheetRangeReference,
  sheetReference,
  spillReference,
  structuredReference,
  text,
  unary,
  unionReference,
} from "./ir/schema.js"
export {
  printExcelFormula,
  printFormula,
  printGoogleSheetsFormula,
} from "./print/printer.js"
export type {
  BinaryExpression,
  ArrayLiteral,
  BooleanLiteral,
  CallExpression,
  CellReference,
  ColumnRangeReference,
  ErrorLiteral,
  FormulaExpr,
  ImplicitIntersectionExpression,
  IntersectionExpression,
  MissingArgument,
  NamedReference,
  NumberLiteral,
  PostfixExpression,
  RangeReference,
  RowRangeReference,
  SheetRangeReference,
  SheetReference,
  SpillReference,
  StructuredReference,
  TextLiteral,
  UnaryExpression,
  UnionReference,
} from "./ir/schema.js"

export interface TranspileOptions {
  from: FormulaDialect
  to: FormulaDialect
}

export type TranspileResult = FormulaTextResult

export function transpileFormula(source: string, options: TranspileOptions): TranspileResult {
  let expr: FormulaExpr
  try {
    expr = parseFormula(source, options.from)
  } catch (error) {
    return {
      diagnostics: [
        {
          code: "parse-error",
          severity: "error",
          message: error instanceof Error ? error.message : "Formula could not be parsed.",
        },
      ],
    }
  }

  const diagnostics = collectCompatibilityDiagnostics(expr, options)
  if (diagnostics.length > 0) return { diagnostics }

  return printFormula(expr, options.to)
}
