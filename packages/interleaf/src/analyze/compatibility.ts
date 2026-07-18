import type { FormulaDialect } from "../dialect.js"
import type { TranspileDiagnostic } from "../diagnostics.js"
import type { FormulaExpr } from "../ir/schema.js"
import { getFunctionMetadata } from "../compatibility/functions.js"

export interface CompatibilityOptions {
  from: FormulaDialect
  to: FormulaDialect
}

export function collectCompatibilityDiagnostics(
  expr: FormulaExpr,
  options: CompatibilityOptions,
): TranspileDiagnostic[] {
  const diagnostics: TranspileDiagnostic[] = []
  visit(expr, (node) => {
    if (node.kind !== "call") return

    const metadata = getFunctionMetadata(node.name)
    if (!metadata) return

    const sourceSupport = metadata.platforms[options.from]
    const targetSupport = metadata.platforms[options.to]
    if (targetSupport?.support !== "absent") return

    if (
      options.from === "gsheets" &&
      (sourceSupport?.support === "external-service" ||
        sourceSupport?.support === "context-required" ||
        metadata.tags?.includes("external-io"))
    ) {
      diagnostics.push({
        code: "unsupported-function",
        severity: "error",
        message: `${metadata.name} requires Google Sheets external service context.`,
      })
      return
    }

    diagnostics.push({
      code: "unsupported-function",
      severity: "error",
      message: `${metadata.name} is not available in ${formatDialect(options.to)}.`,
    })
  })
  return diagnostics
}

function formatDialect(dialect: FormulaDialect): string {
  switch (dialect) {
    case "excel":
      return "Excel"
    case "gsheets":
      return "Google Sheets"
  }
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
