import { parseLossless, printNodes, type CallNode, type Node, type TokenNode } from "./cst.js";
import type { FormulaSyntax } from "./token.js";

export function rewriteIdentifiers(
  source: string,
  syntax: FormulaSyntax,
  replacements: ReadonlyMap<string, string>,
): string {
  const normalized = new Map<string, string>();
  for (const [name, replacement] of replacements) normalized.set(canonical(name), replacement);
  const nodes = parseLossless(syntax.tokenize(source));
  return printNodes(nodes.map((node) => rewriteNode(node, new Set(), normalized)));
}

export function rewriteRecursiveReferences(
  source: string,
  syntax: FormulaSyntax,
  target: string,
  self: string,
  parameters: string[],
  separator: string,
): string {
  const rewrite: RecursiveRewrite = {
    target: canonical(target),
    self,
    bareReplacement: `LAMBDA(${parameters.join(separator)}${separator}${self}(${[
      self,
      ...parameters,
    ].join(separator)}))`,
    separator,
  };
  const nodes = parseLossless(syntax.tokenize(source));
  return printNodes(nodes.map((node) => rewriteRecursiveNode(node, new Set(), rewrite)));
}

export function referencedIdentifiers(
  source: string,
  syntax: FormulaSyntax,
  candidates: Iterable<string>,
): Set<string> {
  const wanted = new Set([...candidates].map(canonical));
  const found = new Set<string>();
  walk(parseLossless(syntax.tokenize(source)), new Set(), {
    identifier(name) {
      const normalized = canonical(name);
      if (wanted.has(normalized)) found.add(normalized);
    },
  });
  return found;
}

export function functionCalls(source: string, syntax: FormulaSyntax): Set<string> {
  const found = new Set<string>();
  walk(parseLossless(syntax.tokenize(source)), new Set(), {
    call(name) {
      found.add(canonical(name));
    },
  });
  return found;
}

function rewriteNode(
  node: Node,
  scope: ReadonlySet<string>,
  replacements: ReadonlyMap<string, string>,
): Node {
  if (node.kind === "token") return rewriteToken(node, scope, replacements);
  const name = canonical(node.name.token.value);
  if (name === "LET") return rewriteLet(node, scope, replacements);
  if (name === "LAMBDA") return rewriteLambda(node, scope, replacements);
  return {
    ...node,
    name: rewriteToken(node.name, scope, replacements),
    args: node.args.map((arg) => arg.map((child) => rewriteNode(child, scope, replacements))),
  };
}

function rewriteRecursiveNode(
  node: Node,
  scope: ReadonlySet<string>,
  rewrite: RecursiveRewrite,
): Node {
  if (node.kind === "token") {
    if (
      node.token.kind !== "identifier" ||
      scope.has(rewrite.target) ||
      canonical(node.token.value) !== rewrite.target
    ) {
      return node;
    }
    return { ...node, token: { ...node.token, value: rewrite.bareReplacement } };
  }

  const name = canonical(node.name.token.value);
  if (name === "LET") {
    return rewriteRecursiveLet(node, scope, rewrite);
  }
  if (name === "LAMBDA") {
    return rewriteRecursiveLambda(node, scope, rewrite);
  }
  const args = node.args.map((arg) =>
    arg.map((child) => rewriteRecursiveNode(child, scope, rewrite)),
  );
  if (scope.has(rewrite.target) || name !== rewrite.target) return { ...node, args };
  const selfArgument: Node[] = [syntheticToken("identifier", rewrite.self)];
  if (args.length > 0) selfArgument.push(syntheticToken("comma", rewrite.separator));
  return {
    ...node,
    name: { ...node.name, token: { ...node.name.token, value: rewrite.self } },
    args: [selfArgument, ...args],
  };
}

interface RecursiveRewrite {
  target: string;
  self: string;
  bareReplacement: string;
  separator: string;
}

function syntheticToken(kind: "identifier" | "comma", value: string): TokenNode {
  return { kind: "token", token: { kind, value, start: 0, end: 0 } };
}

function rewriteRecursiveLet(
  node: CallNode,
  scope: ReadonlySet<string>,
  rewrite: RecursiveRewrite,
): CallNode {
  const current = new Set(scope);
  const args: Node[][] = [];
  for (let i = 0; i < node.args.length; ) {
    const arg = node.args[i];
    if (i === node.args.length - 1) {
      args.push(
        arg.map((child) => rewriteRecursiveNode(child, current, rewrite)),
      );
      break;
    }
    args.push(arg);
    const value = node.args[i + 1];
    if (value) {
      args.push(
        value.map((child) => rewriteRecursiveNode(child, current, rewrite)),
      );
    }
    const declared = declarationName(arg);
    if (declared) current.add(declared);
    i += 2;
  }
  return { ...node, args };
}

function rewriteRecursiveLambda(
  node: CallNode,
  scope: ReadonlySet<string>,
  rewrite: RecursiveRewrite,
): CallNode {
  const current = new Set(scope);
  const args = node.args.map((arg, index) => {
    if (index === node.args.length - 1) {
      return arg.map((child) => rewriteRecursiveNode(child, current, rewrite));
    }
    const declared = declarationName(arg);
    if (declared) current.add(declared);
    return arg;
  });
  return { ...node, args };
}

function rewriteToken(
  node: TokenNode,
  scope: ReadonlySet<string>,
  replacements: ReadonlyMap<string, string>,
): TokenNode {
  if (node.token.kind !== "identifier") return node;
  const name = canonical(node.token.value);
  if (scope.has(name)) return node;
  const replacement = replacements.get(name);
  return replacement === undefined ? node : { ...node, token: { ...node.token, value: replacement } };
}

function rewriteLet(
  node: CallNode,
  scope: ReadonlySet<string>,
  replacements: ReadonlyMap<string, string>,
): CallNode {
  const current = new Set(scope);
  const args: Node[][] = [];
  for (let i = 0; i < node.args.length; ) {
    const arg = node.args[i];
    if (i === node.args.length - 1) {
      args.push(arg.map((child) => rewriteNode(child, current, replacements)));
      break;
    }
    args.push(arg);
    const value = node.args[i + 1];
    if (value) args.push(value.map((child) => rewriteNode(child, current, replacements)));
    const declared = declarationName(arg);
    if (declared) current.add(declared);
    i += 2;
  }
  return { ...node, args };
}

function rewriteLambda(
  node: CallNode,
  scope: ReadonlySet<string>,
  replacements: ReadonlyMap<string, string>,
): CallNode {
  const current = new Set(scope);
  const args = node.args.map((arg, index) => {
    if (index === node.args.length - 1) {
      return arg.map((child) => rewriteNode(child, current, replacements));
    }
    const declared = declarationName(arg);
    if (declared) current.add(declared);
    return arg;
  });
  return { ...node, args };
}

interface Visitor {
  identifier?(name: string): void;
  call?(name: string): void;
}

function walk(nodes: Node[], scope: ReadonlySet<string>, visitor: Visitor): void {
  for (const node of nodes) walkNode(node, scope, visitor);
}

function walkNode(node: Node, scope: ReadonlySet<string>, visitor: Visitor): void {
  if (node.kind === "token") {
    if (node.token.kind === "identifier" && !scope.has(canonical(node.token.value))) {
      visitor.identifier?.(node.token.value);
    }
    return;
  }

  const name = canonical(node.name.token.value);
  if (name === "LET") {
    visitor.call?.(name);
    walkLet(node, scope, visitor);
    return;
  }
  if (name === "LAMBDA") {
    visitor.call?.(name);
    walkLambda(node, scope, visitor);
    return;
  }
  if (!scope.has(name)) {
    visitor.identifier?.(name);
    visitor.call?.(name);
  }
  for (const arg of node.args) walk(arg, scope, visitor);
}

function walkLet(node: CallNode, scope: ReadonlySet<string>, visitor: Visitor): void {
  const current = new Set(scope);
  for (let i = 0; i < node.args.length; ) {
    const arg = node.args[i];
    if (i === node.args.length - 1) {
      walk(arg, current, visitor);
      break;
    }
    const value = node.args[i + 1];
    if (value) walk(value, current, visitor);
    const declared = declarationName(arg);
    if (declared) current.add(declared);
    i += 2;
  }
}

function walkLambda(node: CallNode, scope: ReadonlySet<string>, visitor: Visitor): void {
  const current = new Set(scope);
  node.args.forEach((arg, index) => {
    if (index === node.args.length - 1) {
      walk(arg, current, visitor);
      return;
    }
    const declared = declarationName(arg);
    if (declared) current.add(declared);
  });
}

function declarationName(nodes: Node[]): string | undefined {
  const token = nodes.find((node): node is TokenNode => node.kind === "token" && node.token.kind === "identifier");
  return token ? canonical(token.token.value) : undefined;
}

export function canonical(name: string): string {
  return name.toUpperCase();
}
