import type { FormulaDialect } from "../dialect.js"
import type { FormulaTextResult, TranspileDiagnostic } from "../diagnostics.js"
import type { BinaryExpression, FormulaExpr } from "../ir/schema.js"

const PRECEDENCE: Record<BinaryExpression["op"] | "intersection", number> = {
  intersection: 70,
  "^": 60,
  "*": 50,
  "/": 50,
  "+": 40,
  "-": 40,
  "&": 35,
  "=": 30,
  "<>": 30,
  "<": 30,
  ">": 30,
  "<=": 30,
  ">=": 30,
}

export function printExcelFormula(expr: FormulaExpr): FormulaTextResult {
  return printFormula(expr, "excel")
}

export function printGoogleSheetsFormula(expr: FormulaExpr): FormulaTextResult {
  return printFormula(expr, "gsheets")
}

export function printFormula(expr: FormulaExpr, dialect: FormulaDialect): FormulaTextResult {
  const diagnostics = collectPrintDiagnostics(expr, dialect)
  if (diagnostics.length > 0) return { diagnostics }

  return {
    formula: `=${printExpr(expr, 0)}`,
    diagnostics,
  }
}

function collectPrintDiagnostics(
  expr: FormulaExpr,
  dialect: FormulaDialect,
): TranspileDiagnostic[] {
  const diagnostics: TranspileDiagnostic[] = []
  visit(expr, (node) => {
    if (node.kind === "intersection" && dialect === "gsheets") {
      diagnostics.push({
        code: "unsupported-operator",
        severity: "error",
        message: "Excel intersection cannot be printed as a Google Sheets formula.",
      })
    }
    if (node.kind === "implicit-intersection" && dialect === "gsheets") {
      diagnostics.push({
        code: "unsupported-operator",
        severity: "error",
        message: "Excel implicit intersection cannot be printed as a Google Sheets formula.",
      })
    }
    if (node.kind === "structured-reference" && dialect === "gsheets") {
      diagnostics.push({
        code: "unsupported-reference",
        severity: "error",
        message: "Excel structured references cannot be printed as a Google Sheets formula.",
      })
    }
    if (node.kind === "sheet-range-reference" && dialect === "gsheets") {
      diagnostics.push({
        code: "unsupported-reference",
        severity: "error",
        message: "Excel 3D sheet references cannot be printed as a Google Sheets formula.",
      })
    }
    if (node.kind === "spill-reference" && dialect === "gsheets") {
      diagnostics.push({
        code: "unsupported-reference",
        severity: "error",
        message: "Excel spill references cannot be printed as a Google Sheets formula.",
      })
    }
    if (node.kind === "union-reference" && dialect === "gsheets") {
      diagnostics.push({
        code: "unsupported-reference",
        severity: "error",
        message: "Excel reference unions cannot be printed as a Google Sheets formula.",
      })
    }
  })
  return diagnostics
}

function visit(expr: FormulaExpr, visitor: (expr: FormulaExpr) => void): void {
  visitor(expr)
  switch (expr.kind) {
    case "call":
      for (const arg of expr.args) visit(arg, visitor)
      return
    case "unary":
    case "postfix":
    case "implicit-intersection":
      visit(expr.expr, visitor)
      return
    case "spill-reference":
      visit(expr.reference, visitor)
      return
    case "binary":
    case "intersection":
      visit(expr.left, visitor)
      visit(expr.right, visitor)
      return
    case "range":
      visit(expr.from, visitor)
      visit(expr.to, visitor)
      return
    case "sheet-reference":
    case "sheet-range-reference":
      visit(expr.reference, visitor)
      return
    case "structured-reference":
      return
    case "union-reference":
      for (const reference of expr.references) visit(reference, visitor)
      return
    case "array":
      for (const row of expr.rows) {
        for (const item of row) visit(item, visitor)
      }
      return
    case "number":
    case "boolean":
    case "error":
    case "text":
    case "missing-argument":
    case "named-reference":
    case "column-range":
    case "row-range":
    case "cell":
      return
  }
}

function printExpr(expr: FormulaExpr, parentPrecedence: number): string {
  switch (expr.kind) {
    case "missing-argument":
      return ""
    case "number":
    case "error":
      return expr.value
    case "boolean":
      return expr.value ? "TRUE" : "FALSE"
    case "text":
      return `"${expr.value.replaceAll('"', '""')}"`
    case "cell":
      return expr.address
    case "named-reference":
      return expr.name
    case "column-range":
      return `${expr.from}:${expr.to}`
    case "row-range":
      return `${expr.from}:${expr.to}`
    case "union-reference":
      return `(${expr.references.map((reference) => printExpr(reference, 0)).join(",")})`
    case "range":
      return `${printExpr(expr.from, 80)}:${printExpr(expr.to, 80)}`
    case "sheet-reference":
      return `${quoteSheetName(expr.sheetName)}!${printExpr(expr.reference, 80)}`
    case "sheet-range-reference":
      return `${quoteSheetName(expr.startSheetName)}:${quoteSheetName(
        expr.endSheetName,
      )}!${printExpr(expr.reference, 80)}`
    case "structured-reference":
      return `${expr.tableName}${printStructuredSelectors(expr.selectors)}`
    case "array":
      return `{${expr.rows.map((row) => row.map((item) => printExpr(item, 0)).join(",")).join(";")}}`
    case "call":
      return `${expr.name}(${expr.args.map((arg) => printExpr(arg, 0)).join(",")})`
    case "unary":
      return `${expr.op}${printExpr(expr.expr, 80)}`
    case "postfix":
      return `${printExpr(expr.expr, 80)}%`
    case "spill-reference":
      return `${printExpr(expr.reference, 80)}#`
    case "implicit-intersection":
      return `@${printExpr(expr.expr, 80)}`
    case "binary": {
      const precedence = PRECEDENCE[expr.op]
      const printed = `${printExpr(expr.left, precedence)}${expr.op}${printExpr(
        expr.right,
        precedence + 1,
      )}`
      return precedence < parentPrecedence ? `(${printed})` : printed
    }
    case "intersection": {
      const precedence = PRECEDENCE.intersection
      const printed = `${printExpr(expr.left, precedence)} ${printExpr(
        expr.right,
        precedence + 1,
      )}`
      return precedence < parentPrecedence ? `(${printed})` : printed
    }
  }
}

function quoteSheetName(sheetName: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_.]*$/.test(sheetName)) return sheetName
  return `'${sheetName.replaceAll("'", "''")}'`
}

function printStructuredSelectors(selectors: string[]): string {
  if (selectors.length === 1 && !selectors[0].startsWith("#")) return `[${selectors[0]}]`
  return `[${selectors.map((selector) => `[${selector}]`).join(",")}]`
}
