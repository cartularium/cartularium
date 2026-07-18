import type { FormulaDialect } from "../dialect.js"
import {
  array,
  binary,
  booleanLiteral,
  call,
  cell,
  columnRange,
  errorLiteral,
  implicitIntersection,
  intersection,
  missingArgument,
  namedReference,
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
  type BinaryExpression,
  type FormulaExpr,
} from "../ir/schema.js"

type BinaryOp = BinaryExpression["op"] | "intersect"

type Token =
  | { type: "number"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "error"; value: Parameters<typeof errorLiteral>[0] }
  | { type: "string"; value: string }
  | { type: "identifier"; value: string }
  | { type: "reference"; value: string; sheetName?: string }
  | { type: "column-range"; value: string; from: string; to: string }
  | { type: "row-range"; value: string; from: string; to: string }
  | { type: "structured-reference"; value: string; tableName: string; selectors: string[] }
  | { type: "op"; value: BinaryOp | "%" | "@" | "#" }
  | { type: "paren"; value: "(" | ")" }
  | { type: "brace"; value: "{" | "}" }
  | { type: "comma"; value: "," }
  | { type: "semicolon"; value: ";" }
  | { type: "space"; value: " " }
  | { type: "eof"; value: "" }

const PRECEDENCE: Record<BinaryOp, number> = {
  intersect: 70,
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

export function parseFormula(source: string, dialect: FormulaDialect): FormulaExpr {
  return new Parser(tokenize(source, dialect)).parse()
}

class Parser {
  private pos = 0

  constructor(private readonly tokens: Token[]) {}

  parse(): FormulaExpr {
    this.skipSpaces()
    const expr = this.parseExpression(0)
    this.skipSpaces()
    if (this.peek().type !== "eof") {
      throw new Error(`Unexpected token ${JSON.stringify(this.peek().value)}.`)
    }
    return expr
  }

  private parseExpression(minPrecedence: number): FormulaExpr {
    let left = this.parsePrefix()

    while (true) {
      const hadSpace = this.skipSpaces()
      const next = this.peek()
      const op = this.infixOp(next, hadSpace)
      if (!op) return left

      const precedence = PRECEDENCE[op]
      if (precedence < minPrecedence) return left

      if (op !== "intersect") this.pos++
      const right = this.parseExpression(precedence + 1)
      left = op === "intersect" ? intersection(left, right) : binary(op, left, right)
    }
  }

  private parsePrefix(): FormulaExpr {
    this.skipSpaces()
    const token = this.peek()

    if (token.type === "op" && (token.value === "+" || token.value === "-")) {
      this.pos++
      return unary(token.value, this.parsePrefix())
    }

    if (token.type === "op" && token.value === "@") {
      this.pos++
      return implicitIntersection(this.parsePrefix())
    }

    let expr = this.parsePrimary()
    while (this.peek().type === "op" && (this.peek().value === "%" || this.peek().value === "#")) {
      const op = this.next()
      expr = op.value === "#" ? spillReference(expr) : postfix("%", expr)
    }
    return expr
  }

  private parsePrimary(): FormulaExpr {
    this.skipSpaces()
    const token = this.next()

    switch (token.type) {
      case "number":
        return number(token.value)
      case "boolean":
        return booleanLiteral(token.value)
      case "error":
        return errorLiteral(token.value)
      case "string":
        return text(token.value)
      case "reference":
        return parseReference(token.value, token.sheetName)
      case "column-range":
        return columnRange(token.from, token.to)
      case "row-range":
        return rowRange(token.from, token.to)
      case "structured-reference":
        return structuredReference(token.tableName, token.selectors)
      case "identifier":
        this.skipSpaces()
        if (this.peek().type !== "paren" || this.peek().value !== "(") {
          return namedReference(token.value)
        }
        this.pos++
        return call(token.value, this.parseArgs())
      case "paren": {
        if (token.value !== "(") throw new Error("Unexpected closing parenthesis.")
        const first = this.parseExpression(0)
        this.skipSpaces()
        if (this.peek().type === "comma") {
          const references = [first]
          while (this.peek().type === "comma") {
            this.pos++
            references.push(this.parseExpression(0))
            this.skipSpaces()
          }
          const close = this.next()
          if (close.type !== "paren" || close.value !== ")") {
            throw new Error("Expected closing parenthesis.")
          }
          return unionReference(references)
        }
        const close = this.next()
        if (close.type !== "paren" || close.value !== ")") {
          throw new Error("Expected closing parenthesis.")
        }
        return first
      }
      case "brace":
        if (token.value !== "{") throw new Error("Unexpected closing array brace.")
        return array(this.parseArrayRows())
      default:
        throw new Error(`Unexpected token ${JSON.stringify(token.value)}.`)
    }
  }

  private parseArgs(): FormulaExpr[] {
    const args: FormulaExpr[] = []
    this.skipSpaces()
    if (this.peek().type === "paren" && this.peek().value === ")") {
      this.pos++
      return args
    }

    while (true) {
      this.skipSpaces()
      if (this.peek().type === "comma") {
        args.push(missingArgument())
        this.pos++
        continue
      }
      if (this.peek().type === "paren" && this.peek().value === ")") {
        args.push(missingArgument())
        this.pos++
        return args
      }

      args.push(this.parseExpression(0))
      this.skipSpaces()
      const token = this.next()
      if (token.type === "paren" && token.value === ")") return args
      if (token.type !== "comma") throw new Error("Expected comma or closing parenthesis.")
      this.skipSpaces()
      if (this.peek().type === "paren" && this.peek().value === ")") {
        args.push(missingArgument())
        this.pos++
        return args
      }
    }
  }

  private parseArrayRows(): FormulaExpr[][] {
    const rows: FormulaExpr[][] = [[]]
    this.skipSpaces()
    if (this.peek().type === "brace" && this.peek().value === "}") {
      this.pos++
      return rows
    }

    while (true) {
      rows[rows.length - 1].push(this.parseExpression(0))
      this.skipSpaces()
      const token = this.next()
      if (token.type === "brace" && token.value === "}") return rows
      if (token.type === "comma") continue
      if (token.type === "semicolon") {
        rows.push([])
        continue
      }
      throw new Error("Expected comma, semicolon, or closing array brace.")
    }
  }

  private infixOp(token: Token, hadSpace: boolean): BinaryOp | null {
    if (hadSpace && canStartIntersectionRight(token)) return "intersect"
    if (token.type !== "op" || token.value === "%" || token.value === "@" || token.value === "#") {
      return null
    }
    return token.value
  }

  private skipSpaces(): boolean {
    let skipped = false
    while (this.peek().type === "space") {
      skipped = true
      this.pos++
    }
    return skipped
  }

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: "eof", value: "" }
  }

  private next(): Token {
    const token = this.peek()
    this.pos++
    return token
  }
}

function canStartIntersectionRight(token: Token): boolean {
  return (
    token.type === "reference" ||
    token.type === "identifier" ||
    (token.type === "paren" && token.value === "(")
  )
}

function parseReference(value: string, sheetName?: string): FormulaExpr {
  const rangeParts = value.split(":")
  const reference =
    rangeParts.length === 2 ? range(cell(rangeParts[0]), cell(rangeParts[1])) : cell(value)
  if (sheetName?.includes(":")) {
    const [startSheetName, endSheetName] = sheetName.split(":")
    return sheetRangeReference(startSheetName, endSheetName, reference)
  }
  return sheetName ? sheetReference(sheetName, reference) : reference
}

function tokenize(source: string, dialect: FormulaDialect): Token[] {
  const body = source.startsWith("=") ? source.slice(1) : source
  const tokens: Token[] = []
  let pos = 0

  while (pos < body.length) {
    const ch = body[pos]
    if (/\s/.test(ch)) {
      while (pos < body.length && /\s/.test(body[pos])) pos++
      if (dialect === "excel") tokens.push({ type: "space", value: " " })
      continue
    }

    if (ch === '"') {
      const parsed = readString(body, pos)
      tokens.push({ type: "string", value: parsed.value })
      pos = parsed.end
      continue
    }

    const sheetRange = readSheetRangeReference(body, pos)
    if (sheetRange) {
      tokens.push({
        type: "reference",
        value: sheetRange.reference,
        sheetName: `${sheetRange.startSheetName}:${sheetRange.endSheetName}`,
      })
      pos = sheetRange.end
      continue
    }

    if (ch === "'") {
      const sheet = readSheetReference(body, pos)
      if (!sheet) throw new Error("Expected sheet reference bang.")
      tokens.push({ type: "reference", value: sheet.reference, sheetName: sheet.sheetName })
      pos = sheet.end
      continue
    }

    const two = body.slice(pos, pos + 2)
    if (two === "<>" || two === "<=" || two === ">=") {
      tokens.push({ type: "op", value: two })
      pos += 2
      continue
    }

    const error = readErrorLiteral(body, pos)
    if (error) {
      tokens.push({ type: "error", value: error.value })
      pos = error.end
      continue
    }

    if ("+-*/^&=<>%@#".includes(ch)) {
      tokens.push({ type: "op", value: ch as BinaryOp | "%" | "@" | "#" })
      pos++
      continue
    }

    if (ch === "(" || ch === ")") {
      tokens.push({ type: "paren", value: ch })
      pos++
      continue
    }

    if (ch === "{" || ch === "}") {
      tokens.push({ type: "brace", value: ch })
      pos++
      continue
    }

    if (ch === ",") {
      tokens.push({ type: "comma", value: "," })
      pos++
      continue
    }

    if (ch === ";") {
      tokens.push({ type: "semicolon", value: ";" })
      pos++
      continue
    }

    if (/[0-9.]/.test(ch)) {
      const rowRange = readRowRange(body, pos)
      if (rowRange) {
        tokens.push({
          type: "row-range",
          value: `${rowRange.from}:${rowRange.to}`,
          from: rowRange.from,
          to: rowRange.to,
        })
        pos = rowRange.end
        continue
      }

      const match = /^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][+-]?[0-9]+)?/.exec(
        body.slice(pos),
      )
      if (!match) throw new Error(`Invalid number near ${JSON.stringify(body.slice(pos))}.`)
      tokens.push({ type: "number", value: match[0].replace("e", "E") })
      pos += match[0].length
      continue
    }

    const sheet = readSheetReference(body, pos)
    if (sheet) {
      tokens.push({ type: "reference", value: sheet.reference, sheetName: sheet.sheetName })
      pos = sheet.end
      continue
    }

    const columnRange = readColumnRange(body, pos)
    if (columnRange) {
      tokens.push({
        type: "column-range",
        value: `${columnRange.from}:${columnRange.to}`,
        from: columnRange.from,
        to: columnRange.to,
      })
      pos = columnRange.end
      continue
    }

    const structured = readStructuredReference(body, pos)
    if (structured) {
      tokens.push({
        type: "structured-reference",
        value: `${structured.tableName}${structured.rawSelectors}`,
        tableName: structured.tableName,
        selectors: structured.selectors,
      })
      pos = structured.end
      continue
    }

    const cellReference = readCellReference(body, pos)
    if (cellReference) {
      const rangeTail = readRangeTail(body, cellReference.end)
      tokens.push({
        type: "reference",
        value: `${cellReference.value}${rangeTail?.value ?? ""}`,
      })
      pos = rangeTail?.end ?? cellReference.end
      continue
    }

    if (/[A-Za-z_]/.test(ch)) {
      const match = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(body.slice(pos))
      if (!match) throw new Error(`Invalid identifier near ${JSON.stringify(body.slice(pos))}.`)
      const rawIdentifier = match[0]
      const first = rawIdentifier.toUpperCase()
      pos += match[0].length

      if (first === "TRUE" || first === "FALSE") {
        tokens.push({ type: "boolean", value: first === "TRUE" })
        continue
      }

      tokens.push({ type: "identifier", value: rawIdentifier })
      continue
    }

    throw new Error(`Unexpected character ${JSON.stringify(ch)}.`)
  }

  tokens.push({ type: "eof", value: "" })
  return tokens
}

const ERROR_LITERALS = [
  "#GETTING_DATA",
  "#DIV/0!",
  "#VALUE!",
  "#NULL!",
  "#NAME?",
  "#REF!",
  "#NUM!",
  "#N/A",
] as const

function readErrorLiteral(
  source: string,
  start: number,
): { value: Parameters<typeof errorLiteral>[0]; end: number } | null {
  const upper = source.slice(start).toUpperCase()
  const value = ERROR_LITERALS.find((candidate) => upper.startsWith(candidate))
  return value ? { value, end: start + value.length } : null
}

function readColumnRange(
  source: string,
  start: number,
): { from: string; to: string; end: number } | null {
  const match = /^(\$?[A-Za-z]+):(\$?[A-Za-z]+)/.exec(source.slice(start))
  if (!match) return null
  return {
    from: match[1].toUpperCase(),
    to: match[2].toUpperCase(),
    end: start + match[0].length,
  }
}

function readRowRange(
  source: string,
  start: number,
): { from: string; to: string; end: number } | null {
  const match = /^(\$?[0-9]+):(\$?[0-9]+)/.exec(source.slice(start))
  if (!match) return null
  return { from: match[1], to: match[2], end: start + match[0].length }
}

function readStructuredReference(source: string, start: number):
  | {
      tableName: string
      rawSelectors: string
      selectors: string[]
      end: number
    }
  | null {
  const table = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(source.slice(start))
  if (!table || source[start + table[0].length] !== "[") return null

  let depth = 0
  let pos = start + table[0].length
  let body = ""
  while (pos < source.length) {
    const ch = source[pos]
    if (ch === "[") {
      depth++
      if (depth > 1) body += ch
      pos++
      continue
    }
    if (ch === "]") {
      depth--
      if (depth === 0) {
        return {
          tableName: table[0],
          rawSelectors: source.slice(start + table[0].length, pos + 1),
          selectors: parseStructuredSelectors(body),
          end: pos + 1,
        }
      }
      body += ch
      pos++
      continue
    }
    body += ch
    pos++
  }

  throw new Error("Unterminated structured reference.")
}

function parseStructuredSelectors(body: string): string[] {
  if (!body.includes("[") && !body.includes("]")) return [body]
  return body
    .split(/\s*,\s*/)
    .map((selector) => selector.replace(/^\[/, "").replace(/\]$/, ""))
}

function readString(source: string, start: number): { value: string; end: number } {
  let value = ""
  let pos = start + 1
  while (pos < source.length) {
    if (source[pos] === '"') {
      if (source[pos + 1] === '"') {
        value += '"'
        pos += 2
        continue
      }
      return { value, end: pos + 1 }
    }
    value += source[pos]
    pos++
  }
  throw new Error("Unterminated string literal.")
}

function readSheetRangeReference(
  source: string,
  start: number,
): { startSheetName: string; endSheetName: string; reference: string; end: number } | null {
  const startSheet = readSheetName(source, start)
  if (!startSheet || source[startSheet.end] !== ":") return null
  const endSheet = readSheetName(source, startSheet.end + 1)
  if (!endSheet || source[endSheet.end] !== "!") return null
  const reference = readCellReference(source, endSheet.end + 1)
  if (!reference) throw new Error("Expected cell reference after sheet range.")
  const rangeTail = readRangeTail(source, reference.end)
  return {
    startSheetName: startSheet.name,
    endSheetName: endSheet.name,
    reference: `${reference.value}${rangeTail?.value ?? ""}`,
    end: rangeTail?.end ?? reference.end,
  }
}

function readSheetReference(
  source: string,
  start: number,
): { sheetName: string; reference: string; end: number } | null {
  const sheetName = readSheetName(source, start)
  if (!sheetName || source[sheetName.end] !== "!") return null
  const reference = readCellReference(source, sheetName.end + 1)
  if (!reference) throw new Error("Expected cell reference after sheet name.")
  const rangeTail = readRangeTail(source, reference.end)
  return {
    sheetName: sheetName.name,
    reference: `${reference.value}${rangeTail?.value ?? ""}`,
    end: rangeTail?.end ?? reference.end,
  }
}

function readSheetName(source: string, start: number): { name: string; end: number } | null {
  if (source[start] === "'") {
    let name = ""
    let pos = start + 1
    while (pos < source.length) {
      if (source[pos] === "'") {
        if (source[pos + 1] === "'") {
          name += "'"
          pos += 2
          continue
        }
        return { name, end: pos + 1 }
      }
      name += source[pos]
      pos++
    }
    throw new Error("Unterminated quoted sheet name.")
  }

  const match = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(source.slice(start))
  return match ? { name: match[0], end: start + match[0].length } : null
}

function readCellReference(source: string, start: number): { value: string; end: number } | null {
  const match = /^\$?[A-Za-z]+\$?[0-9]+/.exec(source.slice(start))
  if (!match) return null
  return { value: match[0].toUpperCase(), end: start + match[0].length }
}

function readRangeTail(source: string, start: number): { value: string; end: number } | null {
  if (source[start] !== ":") return null
  const match = /^:(\$?[A-Za-z]+\$?[0-9]+)/.exec(source.slice(start))
  if (!match) throw new Error("Expected cell reference after range colon.")
  return { value: `:${match[1].toUpperCase()}`, end: start + match[0].length }
}
