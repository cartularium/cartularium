export type TokenKind =
  | "identifier"
  | "string"
  | "number"
  | "opaque-reference"
  | "operator"
  | "lparen"
  | "rparen"
  | "lbracket"
  | "rbracket"
  | "lbrace"
  | "rbrace"
  | "comma"
  | "semicolon"
  | "whitespace"
  | "unknown";

export interface Token {
  kind: TokenKind;
  value: string;
  start: number;
  end: number;
}

export interface FormulaSyntax {
  dialect: string;
  tokenize(source: string): Token[];
}
