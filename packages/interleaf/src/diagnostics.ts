export type TranspileDiagnosticCode =
  | "parse-error"
  | "unsupported-function"
  | "unsupported-operator"
  | "unsupported-reference"

export interface TranspileDiagnostic {
  code: TranspileDiagnosticCode
  severity: "error"
  message: string
}

export interface FormulaTextResult {
  formula?: string
  diagnostics: TranspileDiagnostic[]
}
