import type { Token } from "./token.js";

export interface TokenNode {
  kind: "token";
  token: Token;
}

export interface CallNode {
  kind: "call";
  name: TokenNode;
  preParenWhitespace: TokenNode[];
  lparen: TokenNode;
  args: Node[][];
  rparen: TokenNode;
}

export type Node = TokenNode | CallNode;

export function parseLossless(tokens: Token[]): Node[] {
  return new Parser(tokens).parse();
}

export function printNode(node: Node): string {
  if (node.kind === "token") return node.token.value;
  return [
    printNode(node.name),
    ...node.preParenWhitespace.map(printNode),
    printNode(node.lparen),
    ...node.args.flatMap((arg) => arg.map(printNode)),
    printNode(node.rparen),
  ].join("");
}

export function printNodes(nodes: Node[]): string {
  return nodes.map(printNode).join("");
}

class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Node[] {
    const nodes: Node[] = [];
    while (this.pos < this.tokens.length) nodes.push(this.parseNext());
    return nodes;
  }

  private parseNext(): Node {
    const token = this.peek();
    if (!token) throw new Error("Unexpected end of formula.");
    if (token.kind === "identifier") {
      let lookahead = this.pos + 1;
      const whitespace: Token[] = [];
      while (this.tokens[lookahead]?.kind === "whitespace") {
        whitespace.push(this.tokens[lookahead]);
        lookahead++;
      }
      if (this.tokens[lookahead]?.kind === "lparen") return this.parseCall(whitespace);
    }
    return this.tokenNode(this.consume());
  }

  private parseCall(whitespace: Token[]): CallNode {
    const name = this.tokenNode(this.consume());
    const preParenWhitespace = whitespace.map(() => this.tokenNode(this.consume()));
    const lparen = this.tokenNode(this.consume());
    const args: Node[][] = [];
    let current: Node[] = [];
    let standaloneDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;

    for (;;) {
      const token = this.peek();
      if (!token) throw new Error(`Unclosed call to ${name.token.value}.`);
      if (token.kind === "rparen") {
        if (standaloneDepth > 0) {
          standaloneDepth--;
          current.push(this.tokenNode(this.consume()));
          continue;
        }
        if (current.length > 0) args.push(current);
        return {
          kind: "call",
          name,
          preParenWhitespace,
          lparen,
          args,
          rparen: this.tokenNode(this.consume()),
        };
      }
      if (
        standaloneDepth === 0 &&
        braceDepth === 0 &&
        bracketDepth === 0 &&
        (token.kind === "comma" || token.kind === "semicolon")
      ) {
        current.push(this.tokenNode(this.consume()));
        args.push(current);
        current = [];
        continue;
      }
      const node = this.parseNext();
      current.push(node);
      if (node.kind === "token") {
        if (node.token.kind === "lparen") standaloneDepth++;
        if (node.token.kind === "lbrace") braceDepth++;
        if (node.token.kind === "rbrace") braceDepth--;
        if (node.token.kind === "lbracket") bracketDepth++;
        if (node.token.kind === "rbracket") bracketDepth--;
      }
    }
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    const token = this.tokens[this.pos];
    if (!token) throw new Error("Unexpected end of formula.");
    this.pos++;
    return token;
  }

  private tokenNode(token: Token): TokenNode {
    return { kind: "token", token };
  }
}
