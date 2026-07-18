export type FormulaExpr =
  | MissingArgument
  | NumberLiteral
  | BooleanLiteral
  | ErrorLiteral
  | TextLiteral
  | CellReference
  | NamedReference
  | ColumnRangeReference
  | RowRangeReference
  | UnionReference
  | RangeReference
  | SheetReference
  | SheetRangeReference
  | StructuredReference
  | ArrayLiteral
  | CallExpression
  | UnaryExpression
  | PostfixExpression
  | SpillReference
  | ImplicitIntersectionExpression
  | BinaryExpression
  | IntersectionExpression

export interface MissingArgument {
  kind: "missing-argument"
}

export interface NumberLiteral {
  kind: "number"
  value: string
}

export interface BooleanLiteral {
  kind: "boolean"
  value: boolean
}

export interface ErrorLiteral {
  kind: "error"
  value: SpreadsheetError
}

export type SpreadsheetError =
  | "#NULL!"
  | "#DIV/0!"
  | "#VALUE!"
  | "#REF!"
  | "#NAME?"
  | "#NUM!"
  | "#N/A"
  | "#GETTING_DATA"

export interface TextLiteral {
  kind: "text"
  value: string
}

export interface CellReference {
  kind: "cell"
  address: string
}

export interface NamedReference {
  kind: "named-reference"
  name: string
}

export interface ColumnRangeReference {
  kind: "column-range"
  from: string
  to: string
}

export interface RowRangeReference {
  kind: "row-range"
  from: string
  to: string
}

export interface UnionReference {
  kind: "union-reference"
  references: FormulaExpr[]
}

export interface RangeReference {
  kind: "range"
  from: FormulaExpr
  to: FormulaExpr
}

export interface SheetReference {
  kind: "sheet-reference"
  sheetName: string
  reference: FormulaExpr
}

export interface SheetRangeReference {
  kind: "sheet-range-reference"
  startSheetName: string
  endSheetName: string
  reference: FormulaExpr
}

export interface StructuredReference {
  kind: "structured-reference"
  tableName: string
  selectors: string[]
}

export interface ArrayLiteral {
  kind: "array"
  rows: FormulaExpr[][]
}

export interface CallExpression {
  kind: "call"
  name: string
  args: FormulaExpr[]
}

export interface UnaryExpression {
  kind: "unary"
  op: "+" | "-"
  expr: FormulaExpr
}

export interface PostfixExpression {
  kind: "postfix"
  op: "%"
  expr: FormulaExpr
}

export interface SpillReference {
  kind: "spill-reference"
  reference: FormulaExpr
}

export interface ImplicitIntersectionExpression {
  kind: "implicit-intersection"
  expr: FormulaExpr
}

export interface BinaryExpression {
  kind: "binary"
  op: "^" | "*" | "/" | "+" | "-" | "&" | "=" | "<>" | "<" | ">" | "<=" | ">="
  left: FormulaExpr
  right: FormulaExpr
}

export interface IntersectionExpression {
  kind: "intersection"
  left: FormulaExpr
  right: FormulaExpr
}

export function missingArgument(): MissingArgument {
  return { kind: "missing-argument" }
}

export function number(value: string | number): NumberLiteral {
  return { kind: "number", value: String(value) }
}

export function booleanLiteral(value: boolean): BooleanLiteral {
  return { kind: "boolean", value }
}

export function errorLiteral(value: SpreadsheetError): ErrorLiteral {
  return { kind: "error", value }
}

export function text(value: string): TextLiteral {
  return { kind: "text", value }
}

export function cell(address: string): CellReference {
  return { kind: "cell", address: address.toUpperCase() }
}

export function namedReference(name: string): NamedReference {
  return { kind: "named-reference", name }
}

export function columnRange(from: string, to: string): ColumnRangeReference {
  return { kind: "column-range", from: from.toUpperCase(), to: to.toUpperCase() }
}

export function rowRange(from: string | number, to: string | number): RowRangeReference {
  return { kind: "row-range", from: String(from), to: String(to) }
}

export function unionReference(references: FormulaExpr[]): UnionReference {
  return { kind: "union-reference", references }
}

export function range(from: FormulaExpr, to: FormulaExpr): RangeReference {
  return { kind: "range", from, to }
}

export function sheetReference(sheetName: string, reference: FormulaExpr): SheetReference {
  return { kind: "sheet-reference", sheetName, reference }
}

export function sheetRangeReference(
  startSheetName: string,
  endSheetName: string,
  reference: FormulaExpr,
): SheetRangeReference {
  return { kind: "sheet-range-reference", startSheetName, endSheetName, reference }
}

export function structuredReference(
  tableName: string,
  selectors: string[],
): StructuredReference {
  return { kind: "structured-reference", tableName, selectors }
}

export function array(rows: FormulaExpr[][]): ArrayLiteral {
  return { kind: "array", rows }
}

export function call(name: string, args: FormulaExpr[]): CallExpression {
  return { kind: "call", name: name.toUpperCase(), args }
}

export function unary(op: UnaryExpression["op"], expr: FormulaExpr): UnaryExpression {
  return { kind: "unary", op, expr }
}

export function postfix(op: PostfixExpression["op"], expr: FormulaExpr): PostfixExpression {
  return { kind: "postfix", op, expr }
}

export function spillReference(reference: FormulaExpr): SpillReference {
  return { kind: "spill-reference", reference }
}

export function implicitIntersection(expr: FormulaExpr): ImplicitIntersectionExpression {
  return { kind: "implicit-intersection", expr }
}

export function binary(
  op: BinaryExpression["op"],
  left: FormulaExpr,
  right: FormulaExpr,
): BinaryExpression {
  return { kind: "binary", op, left, right }
}

export function intersection(left: FormulaExpr, right: FormulaExpr): IntersectionExpression {
  return { kind: "intersection", left, right }
}
