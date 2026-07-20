import type { FormulaSyntax, Token, TokenKind } from "../token.js";

const PATTERNS: Array<[TokenKind, RegExp]> = [
  ["string", /^"(?:""|[^"])*"/],
  ["opaque-reference", /^'(?:''|[^'])*'!/],
  ["opaque-reference", /^(?:\[[^\]]+\])?[A-Za-z_][A-Za-z0-9_.]*!/],
  ["opaque-reference", /^[A-Za-z_][A-Za-z0-9_.]*\[(?:[^\[\]]|\[[^\]]*\])+\]/],
  ["opaque-reference", /^\[(?:[^\[\]]|\[[^\]]*\])+\]/],
  ["opaque-reference", /^#(?:N\/A|REF!|VALUE!|NAME\?|DIV\/0!|NUM!|NULL!|ERROR!)/i],
  ["opaque-reference", /^\$?[A-Za-z]{1,3}\$?\d+(?::\$?[A-Za-z]{1,3}\$?\d+)?/],
  ["opaque-reference", /^\$?[A-Za-z]{1,3}:\$?[A-Za-z]{1,3}/],
  ["opaque-reference", /^\$?\d+:\$?\d+/],
  ["number", /^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/],
  ["identifier", /^[A-Za-z_][A-Za-z0-9_.]*/],
  ["lparen", /^\(/],
  ["rparen", /^\)/],
  ["lbracket", /^\[/],
  ["rbracket", /^\]/],
  ["lbrace", /^\{/],
  ["rbrace", /^\}/],
  ["comma", /^,/],
  ["semicolon", /^;/],
  ["operator", /^[+\-*/^&=<>!:%@]+/],
  ["whitespace", /^\s+/],
];

export const googleSheetsSyntax: FormulaSyntax = {
  dialect: "gsheets",
  tokenize: tokenizeGoogleSheetsFormula,
  referenceMode: googleSheetsReferenceMode,
};

export function googleSheetsReferenceMode(token: Token): "fixed" | "context-dependent" | undefined {
  if (token.kind !== "opaque-reference") return undefined;
  const cell = token.value.match(/^(\$?[A-Za-z]{1,3})(\$?\d+)(?::(\$?[A-Za-z]{1,3})(\$?\d+))?$/);
  if (cell) return cell.slice(1).filter(Boolean).every((part) => part.startsWith("$")) ? "fixed" : "context-dependent";
  const columns = token.value.match(/^(\$?[A-Za-z]{1,3}):(\$?[A-Za-z]{1,3})$/);
  if (columns) return columns.slice(1).every((part) => part.startsWith("$")) ? "fixed" : "context-dependent";
  const rows = token.value.match(/^(\$?\d+):(\$?\d+)$/);
  if (rows) return rows.slice(1).every((part) => part.startsWith("$")) ? "fixed" : "context-dependent";
  if (token.value.includes("[")) return "context-dependent";
  return undefined;
}

export function tokenizeGoogleSheetsFormula(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  while (pos < source.length) {
    let match: RegExpExecArray | null = null;
    let kind: TokenKind = "unknown";
    for (const [candidateKind, pattern] of PATTERNS) {
      match = pattern.exec(source.slice(pos));
      if (match) {
        kind = candidateKind;
        break;
      }
    }
    const value = match?.[0] ?? source[pos];
    tokens.push({ kind, value, start: pos, end: pos + value.length });
    pos += value.length;
  }
  return tokens;
}
