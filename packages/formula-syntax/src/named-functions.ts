import { parseLossless, type CallNode, type Node, type TokenNode } from "./cst.js";
import { canonical, functionCalls, referencedIdentifiers, rewriteIdentifiers } from "./scope.js";
import type { FormulaSyntax } from "./token.js";

export interface NamedFunctionDefinition {
  name: string;
  definition: string;
}

export type NamedFunctionInlineErrorCode =
  | "ambiguous-name"
  | "duplicate-name"
  | "expansion-limit"
  | "invalid-definition"
  | "prohibited-call"
  | "recursive-definition";

export class NamedFunctionInlineError extends Error {
  override name = "NamedFunctionInlineError";

  constructor(
    readonly code: NamedFunctionInlineErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export interface NamedFunctionInlineOptions {
  maxDefinitions?: number;
  maxDepth?: number;
  maxFormulaLength?: number;
  prohibitedFunctions?: Iterable<string>;
  protectedIdentifiers?: Iterable<string>;
}

export interface NamedFunctionInlineResult {
  formula: string;
  inlinedFunctions: string[];
}

export interface NamedFunctionInliner {
  inline(formula: string): NamedFunctionInlineResult;
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_.]*$/;

export function inlineNamedFunctions(
  formula: string,
  definitions: NamedFunctionDefinition[],
  syntax: FormulaSyntax,
  options: NamedFunctionInlineOptions = {},
): NamedFunctionInlineResult {
  return createNamedFunctionInliner(definitions, syntax, options).inline(formula);
}

export function createNamedFunctionInliner(
  definitions: NamedFunctionDefinition[],
  syntax: FormulaSyntax,
  options: NamedFunctionInlineOptions = {},
): NamedFunctionInliner {
  const maxDefinitions = options.maxDefinitions ?? 256;
  const maxDepth = options.maxDepth ?? 20;
  const maxFormulaLength = options.maxFormulaLength ?? 50_000;
  if (definitions.length > maxDefinitions) {
    throw new NamedFunctionInlineError(
      "expansion-limit",
      `workbook has ${definitions.length} named functions; limit is ${maxDefinitions}`,
    );
  }

  const byName = new Map<string, NamedFunctionDefinition>();
  for (const definition of definitions) {
    if (!IDENTIFIER.test(definition.name)) {
      throw new NamedFunctionInlineError("invalid-definition", `invalid named-function name: ${definition.name}`);
    }
    const name = canonical(definition.name);
    if (byName.has(name)) {
      throw new NamedFunctionInlineError("duplicate-name", `duplicate named-function name: ${definition.name}`);
    }
    byName.set(name, definition);
  }

  const protectedNames = new Set([...(options.protectedIdentifiers ?? [])].map(canonical));
  for (const name of byName.keys()) {
    if (protectedNames.has(name)) {
      throw new NamedFunctionInlineError(
        "ambiguous-name",
        `named function ${name} collides with a protected identifier`,
      );
    }
  }

  const expanded = new Map<string, { formula: string; functions: string[] }>();
  const expand = (name: string, stack: string[]): { formula: string; functions: string[] } => {
    const cached = expanded.get(name);
    if (cached !== undefined) return cached;
    if (stack.includes(name)) {
      const cycle = [...stack.slice(stack.indexOf(name)), name].join(" → ");
      throw new NamedFunctionInlineError("recursive-definition", `recursive named functions: ${cycle}`);
    }
    if (stack.length >= maxDepth) {
      throw new NamedFunctionInlineError("expansion-limit", `named-function expansion exceeds depth ${maxDepth}`);
    }
    const source = byName.get(name);
    if (!source) throw new Error(`Missing named-function definition: ${name}`);
    const normalized = normalizeDefinition(source, syntax);
    const dependencies = referencedIdentifiers(normalized, syntax, byName.keys());
    const replacements = new Map<string, string>();
    const functions: string[] = [];
    for (const dependency of dependencies) {
      const result = expand(dependency, [...stack, name]);
      replacements.set(dependency, result.formula);
      for (const used of result.functions) if (!functions.includes(used)) functions.push(used);
    }
    const expandedFormula = rewriteIdentifiers(normalized, syntax, replacements);
    assertLength(expandedFormula, maxFormulaLength);
    functions.push(name);
    const result = { formula: expandedFormula, functions };
    expanded.set(name, result);
    return result;
  };

  return {
    inline(formula) {
      const roots = referencedIdentifiers(formula, syntax, byName.keys());
      if (roots.size === 0) {
        assertNoProhibitedCalls(formula, syntax, options.prohibitedFunctions);
        return { formula, inlinedFunctions: [] };
      }
      const replacements = new Map<string, string>();
      const functions: string[] = [];
      for (const root of roots) {
        const result = expand(root, []);
        replacements.set(root, result.formula);
        for (const used of result.functions) if (!functions.includes(used)) functions.push(used);
      }
      const output = rewriteIdentifiers(formula, syntax, replacements);
      assertLength(output, maxFormulaLength);
      assertNoProhibitedCalls(output, syntax, options.prohibitedFunctions);
      return { formula: output, inlinedFunctions: functions };
    },
  };
}

function assertNoProhibitedCalls(
  formula: string,
  syntax: FormulaSyntax,
  prohibitedFunctions: Iterable<string> | undefined,
): void {
  const prohibited = new Set([...(prohibitedFunctions ?? [])].map(canonical));
  const hits = [...functionCalls(formula, syntax)].filter((name) => prohibited.has(name)).sort();
  if (hits.length) {
    throw new NamedFunctionInlineError(
      "prohibited-call",
      `expanded formula calls prohibited function${hits.length === 1 ? "" : "s"}: ${hits.join(", ")}`,
    );
  }
}

function normalizeDefinition(source: NamedFunctionDefinition, syntax: FormulaSyntax): string {
  let definition = source.definition.trim();
  if (definition.startsWith("=")) definition = definition.slice(1).trim();
  definition = definition.replace(/^_xlfn\.LAMBDA\b/i, "LAMBDA");
  let nodes: Node[];
  try {
    nodes = parseLossless(syntax.tokenize(definition));
  } catch (error) {
    throw new NamedFunctionInlineError(
      "invalid-definition",
      `${source.name} is not a complete LAMBDA: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const call = nodes.length === 1 && nodes[0].kind === "call" ? (nodes[0] as CallNode) : null;
  if (!call || canonical(call.name.token.value) !== "LAMBDA" || call.args.length < 2) {
    throw new NamedFunctionInlineError("invalid-definition", `${source.name} is not a complete LAMBDA`);
  }
  const parameters = call.args.slice(0, -1).map(parameterName);
  if (parameters.some((name) => name === null) || new Set(parameters).size !== parameters.length) {
    throw new NamedFunctionInlineError("invalid-definition", `${source.name} has invalid or duplicate parameters`);
  }
  return definition;
}

function parameterName(nodes: Node[]): string | null {
  const significant = nodes.filter(
    (node) =>
      node.kind !== "token" ||
      !["whitespace", "comma", "semicolon"].includes(node.token.kind),
  );
  if (significant.length !== 1 || significant[0].kind !== "token") return null;
  const token = significant[0] as TokenNode;
  return token.token.kind === "identifier" && IDENTIFIER.test(token.token.value)
    ? canonical(token.token.value)
    : null;
}

function assertLength(formula: string, max: number): void {
  if (formula.length > max) {
    throw new NamedFunctionInlineError(
      "expansion-limit",
      `expanded formula has ${formula.length} characters; limit is ${max}`,
    );
  }
}
