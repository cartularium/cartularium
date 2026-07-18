// generate starter YAML test blocks for spreadsheet functions
// reads Lattice's reference TSVs, classifies by signature shape,
// emits a test block per function — defaults to `record: true` unless
// the expected value is unambiguous (e.g. ABS(-5) = 5)
// output format is the contract for Phase 2 authoring

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

export interface FunctionSpec {
  name: string;
  category: string;
  syntax: string;
  description: string;
}

export type Pattern =
  | "unary-numeric"
  | "binary-numeric"
  | "binary-comparison"
  | "aggregation"
  | "conditional-aggregation"
  | "text-unary"
  | "text-binary"
  | "predicate"
  | "date-ymd"
  | "nullary"
  | "generic";

// minimal RFC-4180 TSV reader — quoted fields may contain tabs, newlines,
// and doubled quote chars; unquoted fields run to the next tab or newline
export function parseTsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let quoted = false;

  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"' && field === "") {
      quoted = true;
      i++;
      continue;
    }
    if (ch === "\t") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, j) => {
      obj[h] = (r[j] ?? "").trim();
    });
    return obj;
  });
}

export function loadFunctionUniverse(refDir: string): Map<string, FunctionSpec> {
  const files = ["excel_functions.tsv", "gsheets_functions.tsv"];
  const out = new Map<string, FunctionSpec>();
  for (const f of files) {
    const path = join(refDir, f);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    for (const r of parseTsv(text)) {
      if (!r.Name) continue;
      // first-writer-wins so excel_functions.tsv beats gsheets
      if (!out.has(r.Name)) {
        out.set(r.Name, {
          name: r.Name,
          category: r.Type,
          syntax: r.Syntax,
          description: r.Description,
        });
      }
    }
  }
  return out;
}

// extract arg tokens from "ABS(value)" or "SUM(value1, [value2, ...])"
export function extractArgs(syntax: string): string[] {
  const m = syntax.match(/^[A-Z0-9_.]+\(([\s\S]*)\)\s*$/);
  if (!m) return [];
  const inner = m[1].trim();
  if (inner === "") return [];
  // strip optional-markers and split at depth 0
  const args: string[] = [];
  let buf = "";
  let depth = 0;
  for (const ch of inner) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    if ((ch === "," || ch === ";") && depth === 0) {
      args.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) args.push(buf.trim());
  return args.map((a) => a.replace(/[\[\]]/g, "").trim());
}

function isNumericArg(a: string): boolean {
  const k = a.toLowerCase();
  return (
    /^(value|number|num|x|y|n|divisor|dividend|base|exponent|power|factor|count|rows|columns|cols|index|position|significance)\d*$/.test(
      k,
    ) ||
    /^(start_num|num_chars|num_digits|places|significant_digits|decimal_places)/.test(k)
  );
}

function isTextArg(a: string): boolean {
  const k = a.toLowerCase();
  return /^(text|string|old_text|new_text|search_text|within_text|source|prefix|suffix)\d*$/.test(k);
}

function isRangeArg(a: string): boolean {
  const k = a.toLowerCase();
  return /^(range|array|array_or_range|data|reference|database|input_range|source_range)\d*$/.test(k);
}

function isCriterionArg(a: string): boolean {
  const k = a.toLowerCase();
  return /^(criterion|criteria|condition|field|logical_expression)\d*$/.test(k);
}

function isDatePart(a: string): boolean {
  return /^(year|month|day|hour|minute|second|date|start_date|end_date)\b/i.test(a);
}

const COMPARISON_OPERATORS = new Set([
  "EQ", "NE", "GT", "GTE", "LT", "LTE", "ISBETWEEN",
]);

// conservative — anything not placed with confidence falls through to "generic"
export function classifySignature(spec: FunctionSpec): Pattern {
  const args = extractArgs(spec.syntax);

  if (args.length === 0) return "nullary";

  if (COMPARISON_OPERATORS.has(spec.name) && args.length >= 2) {
    return "binary-comparison";
  }

  if (args.every(isDatePart) && args.length >= 1 && args.length <= 3) {
    return "date-ymd";
  }

  // require an explicit variadic marker — `value\d` alone would swallow
  // true binary-numeric signatures like `ADD(value1, value2)`
  const first = args[0].toLowerCase();
  const isVariadic = /\.\.\./.test(spec.syntax) || /\[[^\]]*\d[^\]]*\.\.\./.test(spec.syntax);
  if (
    (isNumericArg(first) || first === "value" || first === "value1") &&
    args.length >= 2 &&
    isVariadic
  ) {
    return "aggregation";
  }

  if (args.length >= 2 && isRangeArg(args[0]) && isCriterionArg(args[1])) {
    return "conditional-aggregation";
  }

  // predicate: single value-typed arg returning bool (Info / IS* funcs)
  if (
    args.length === 1 &&
    (args[0].toLowerCase() === "value" || args[0].toLowerCase() === "reference") &&
    (spec.category === "Info" || spec.name.startsWith("IS"))
  ) {
    return "predicate";
  }

  if (args.length === 1 && isNumericArg(args[0])) return "unary-numeric";
  if (args.length === 1 && isTextArg(args[0])) return "text-unary";

  if (args.length === 2 && args.every(isNumericArg)) return "binary-numeric";
  if (args.length === 2 && isTextArg(args[0])) return "text-binary";

  return "generic";
}

interface Case {
  name: string;
  formula: string;
  expect?: unknown;
  record?: boolean;
  grid?: Record<string, unknown>;
}

function quoteFormula(f: string): string {
  // YAML single-quoted: ' → '' and wrap
  return `'${f.replace(/'/g, "''")}'`;
}

function renderCase(c: Case, tags: string[], subject: string, fileStem: string): string {
  const id = scaffoldId(fileStem, subject, c.name);
  const lines: string[] = [];
  lines.push(`  - id: ${id}`);
  lines.push(`    subject: ${subject}`);
  lines.push(`    category: value`);
  if (c.record) lines.push(`    status: observed`);
  lines.push(`    formula: ${quoteFormula(c.formula)}`);
  if (c.grid) {
    lines.push(`    grid:`);
    for (const [k, v] of Object.entries(c.grid)) {
      lines.push(`      ${k}: ${yamlScalar(v)}`);
    }
  }
  if (!c.record && c.expect !== undefined) {
    lines.push(`    expect: ${yamlScalar(c.expect)}`);
  }
  // v1 `name` preserved as a tag for searchability
  const allTags = [`name:${slugify(c.name)}`, ...tags];
  lines.push(`    tags: [${allTags.join(", ")}]`);
  return lines.join("\n");
}

function scaffoldId(fileStem: string, subject: string, name: string): string {
  const hash = createHash("sha256")
    .update(subject)
    .update(" ")
    .update(slugify(name))
    .digest("hex")
    .slice(0, 6);
  return `${fileStem}/${hash}`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "unnamed";
}

function yamlScalar(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "string") {
    if (v.startsWith("#")) return `"${v}"`;
    return JSON.stringify(v);
  }
  return JSON.stringify(v);
}

function shortTag(category: string): string {
  return category.toLowerCase();
}

type Emitter = (spec: FunctionSpec) => Case[];

const emitters: Record<Pattern, Emitter> = {
  "unary-numeric": (s) => [
    { name: `${s.name} positive`, formula: `=${s.name}(5)`, record: true },
    { name: `${s.name} zero`, formula: `=${s.name}(0)`, record: true },
    { name: `${s.name} negative`, formula: `=${s.name}(-5)`, record: true },
    { name: `${s.name} text arg`, formula: `=${s.name}("abc")`, record: true },
  ],

  "binary-numeric": (s) => [
    { name: `${s.name} positive pair`, formula: `=${s.name}(10, 3)`, record: true },
    { name: `${s.name} with zero`, formula: `=${s.name}(10, 0)`, record: true },
    { name: `${s.name} negative`, formula: `=${s.name}(-10, 3)`, record: true },
    { name: `${s.name} text arg`, formula: `=${s.name}("abc", 1)`, record: true },
  ],

  "binary-comparison": (s) => {
    // known-behaviour expects where possible
    const cmpAgree: Record<string, boolean> = { EQ: true, GT: false, GTE: true, LT: false, LTE: true, NE: false };
    const cmpDiffer: Record<string, boolean> = { EQ: false, GT: true, GTE: true, LT: false, LTE: false, NE: true };
    const agree = cmpAgree[s.name];
    const differ = cmpDiffer[s.name];

    if (s.name === "ISBETWEEN") {
      return [
        { name: `${s.name} inside range`, formula: `=${s.name}(5, 1, 10)`, expect: true },
        { name: `${s.name} below range`, formula: `=${s.name}(0, 1, 10)`, expect: false },
        { name: `${s.name} at lower bound`, formula: `=${s.name}(1, 1, 10)`, record: true },
        { name: `${s.name} at upper bound`, formula: `=${s.name}(10, 1, 10)`, record: true },
        { name: `${s.name} exclusive bounds`, formula: `=${s.name}(1, 1, 10, FALSE, FALSE)`, expect: false },
      ];
    }

    return [
      { name: `${s.name} equal values`, formula: `=${s.name}(5, 5)`, expect: agree },
      { name: `${s.name} differing values`, formula: `=${s.name}(5, 3)`, expect: differ },
      { name: `${s.name} string coercion`, formula: `=${s.name}("5", 5)`, record: true },
      { name: `${s.name} case-sensitivity`, formula: `=${s.name}("abc", "ABC")`, record: true },
    ];
  },

  aggregation: (s) => [
    { name: `${s.name} single number`, formula: `=${s.name}(5)`, record: true },
    { name: `${s.name} multiple numbers`, formula: `=${s.name}(1, 2, 3, 4)`, record: true },
    { name: `${s.name} range`, formula: `=${s.name}(A1:A3)`, record: true },
    { name: `${s.name} mixed types`, formula: `=${s.name}(1, "text", 2, TRUE)`, record: true },
  ],

  "conditional-aggregation": (s) => [
    { name: `${s.name} numeric match`, formula: `=${s.name}(A1:A5, ">2")`, record: true },
    { name: `${s.name} exact match`, formula: `=${s.name}(A1:A5, 2)`, record: true },
    { name: `${s.name} no matches`, formula: `=${s.name}(A1:A5, ">100")`, record: true },
  ],

  "text-unary": (s) => [
    { name: `${s.name} empty`, formula: `=${s.name}("")`, record: true },
    { name: `${s.name} basic`, formula: `=${s.name}("hello")`, record: true },
    { name: `${s.name} mixed case`, formula: `=${s.name}("Hello World")`, record: true },
    { name: `${s.name} unicode`, formula: `=${s.name}("café ünïcode")`, record: true },
  ],

  "text-binary": (s) => [
    { name: `${s.name} basic`, formula: `=${s.name}("hello", "world")`, record: true },
    { name: `${s.name} empty first`, formula: `=${s.name}("", "x")`, record: true },
  ],

  predicate: (s) => {
    // well-characterised ISxxx get concrete expects; others fall back to
    // record-mode. blank-reference cases carry an explicit grid so engines
    // don't disagree about what a "blank reference" means
    const known: Record<string, { num?: boolean; text?: boolean; blank?: boolean; error?: boolean; bool?: boolean }> = {
      ISNUMBER: { num: true, text: false, blank: false, error: false, bool: false },
      ISTEXT: { num: false, text: true, blank: false, error: false, bool: false },
      ISNONTEXT: { num: true, text: false, blank: true, error: true, bool: true },
      ISBLANK: { num: false, text: false, blank: true, error: false, bool: false },
      ISLOGICAL: { num: false, text: false, blank: false, error: false, bool: true },
      ISERR: { num: false, text: false, blank: false, error: true, bool: false },
      ISERROR: { num: false, text: false, blank: false, error: true, bool: false },
      ISNA: { num: false, text: false, blank: false, bool: false },
    };
    const k = known[s.name];

    const cases: Case[] = [];
    const mk = (suffix: string, formula: string, e: boolean | undefined, grid?: Record<string, unknown>): Case => {
      const c: Case = e !== undefined ? { name: `${s.name} ${suffix}`, formula, expect: e } : { name: `${s.name} ${suffix}`, formula, record: true };
      if (grid) (c as Case & { grid?: unknown }).grid = grid;
      return c;
    };

    cases.push(mk("of number", `=${s.name}(42)`, k?.num));
    cases.push(mk("of text", `=${s.name}("hello")`, k?.text));
    const blankCase: Case & { grid?: Record<string, unknown> } = {
      name: `${s.name} of blank`,
      formula: `=${s.name}(A1)`,
    };
    blankCase.grid = { A1: null };
    if (k?.blank !== undefined) blankCase.expect = k.blank;
    else blankCase.record = true;
    cases.push(blankCase);
    cases.push(mk("of error", `=${s.name}(1/0)`, k?.error));
    if (k?.bool !== undefined) cases.push(mk("of boolean", `=${s.name}(TRUE)`, k.bool));
    return cases;
  },

  "date-ymd": (s) => {
    const argc = extractArgs(s.syntax).length;
    if (argc === 3) {
      return [
        { name: `${s.name} basic`, formula: `=${s.name}(2025, 3, 15)`, record: true },
        { name: `${s.name} leap day`, formula: `=${s.name}(2024, 2, 29)`, record: true },
        { name: `${s.name} end of month`, formula: `=${s.name}(2025, 12, 31)`, record: true },
      ];
    }
    return [{ name: `${s.name} basic`, formula: `=${s.name}("2025-03-15")`, record: true }];
  },

  nullary: (s) => [{ name: `${s.name} nullary`, formula: `=${s.name}()`, record: true }],

  generic: (s) => {
    const args = extractArgs(s.syntax);
    const placeholders = args.map(placeholderFor).join(", ");
    return [
      {
        name: `${s.name} smoke`,
        formula: `=${s.name}(${placeholders})`,
        record: true,
      },
    ];
  },
};

function placeholderFor(argName: string): string {
  const n = argName.toLowerCase();
  // most-specific first — `date_string` should route to date, not string
  if (/lambda/.test(n)) return "LAMBDA(x, x+1)";
  if (/date/.test(n)) return '"2025-01-15"';
  if (/\b(year)\b/.test(n)) return "2025";
  if (/\b(month)\b/.test(n)) return "3";
  if (/\b(day|hour|minute|second)\b/.test(n)) return "15";
  if (/array|range|data|reference|database|input_range|source_range/.test(n)) return "A1:A3";
  if (/criterion|condition|criteria/.test(n)) return '">0"';
  if (/logical_expression/.test(n)) return "TRUE";
  if (/unit\b/.test(n)) return '"D"';
  if (/text|string|old_text|new_text|search_text|within_text/.test(n)) return '"text"';
  if (/number|num|value|count|rows|cols|index|x|y|n\b|rate|nper|pv|fv|pmt/.test(n)) return "1";
  return "1";
}

export interface ScaffoldResult {
  yaml: string;
  pattern: Pattern;
  cases: number;
}

// emits a header comment with syntax + description so authors know
// what they're characterising
export function scaffoldFunction(spec: FunctionSpec, fileStem: string = "scaffold"): ScaffoldResult {
  const pattern = classifySignature(spec);
  const cases = emitters[pattern](spec);
  const tag = shortTag(spec.category);
  const rendered = cases
    .map((c) => renderCase(c, [tag], spec.name, fileStem))
    .join("\n\n");
  const header =
    `  # ${spec.name} — ${spec.syntax}\n` +
    (spec.description ? `  # ${spec.description.split("\n")[0].slice(0, 120)}\n` : "") +
    `  # scaffold-pattern: ${pattern}`;
  return {
    yaml: `${header}\n${rendered}\n`,
    pattern,
    cases: cases.length,
  };
}

// caller adds the `name:` header and `tests:` key
export function scaffoldMany(specs: FunctionSpec[], fileStem: string = "scaffold"): { yaml: string; summary: Record<Pattern, number> } {
  const blocks: string[] = [];
  const summary = {} as Record<Pattern, number>;
  for (const s of specs) {
    const r = scaffoldFunction(s, fileStem);
    summary[r.pattern] = (summary[r.pattern] ?? 0) + 1;
    blocks.push(r.yaml);
  }
  return { yaml: blocks.join("\n"), summary };
}
