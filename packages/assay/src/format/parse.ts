import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import { isCellError, type CellValue, type GridValue, type Platform, type CellError, ALL_PLATFORMS } from "./values.js";
import { type TestSuite, type TestCase, type Override, type Matcher, type PlatformFormula, type Status, type SupportLevel, type Cause, type Category } from "./catalogue.js";
import { reconcileFeatures, applyAdapter } from "./capabilities.js";
import {
  deriveCategory,
  derivePublicRef,
  deriveSubjectRef,
  semanticHashForCase,
} from "../identity/index.js";

// files lacking a supported schemaVersion are rejected — v1→v2 was a one-way cutover
export function loadTestSuite(path: string): TestSuite {
  const raw = readFileSync(path, "utf8");
  const data = parseYaml(raw);

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Invalid test file (must be a YAML map): ${path}`);
  }
  if (data.schemaVersion !== 2 && data.schemaVersion !== 3) {
    throw new Error(
      `Unsupported schema version in ${path}: expected schemaVersion: 2 or 3 (got ${JSON.stringify(data.schemaVersion)}). Run scripts/migrate-v1-to-v2.ts.`,
    );
  }
  if (!Array.isArray(data.tests)) {
    throw new Error(`Test file ${path} has no \`tests:\` array.`);
  }

  const schemaVersion = data.schemaVersion as 2 | 3;
  const definitions = data.definitions as Record<string, string> | undefined;
  const fixtures = data.fixtures as Record<string, Record<string, CellValue>> | undefined;
  const tests = data.tests.map((raw: unknown) => parseTestCase(raw, schemaVersion, fixtures));

  if (definitions) {
    for (const test of tests) expandDefinitionsInTest(test, definitions);
  }
  if (schemaVersion === 3) {
    for (const test of tests) {
      test.semanticHash = semanticHashForCase(test as unknown as Record<string, unknown>);
    }
  }

  return {
    schemaVersion,
    name: data.name,
    definitions,
    fixtures,
    tests,
  };
}

function expandDefinitionsInTest(test: TestCase, definitions: Record<string, string>): void {
  if (typeof test.formula === "string") {
    test.formula = expandDefinitions(test.formula, definitions);
  } else {
    for (const k of Object.keys(test.formula)) {
      const v = test.formula[k];
      if (v) test.formula[k] = expandDefinitions(v, definitions);
    }
  }
}

function expandDefinitions(
  formula: string,
  definitions: Record<string, string>,
): string {
  return formula.replace(/\$\{(\w+)\}/g, (match, name) => {
    const v = definitions[name];
    if (v === undefined) return match;
    return expandDefinitions(v, definitions);
  });
}

function parseTestCase(
  raw: unknown,
  schemaVersion: 2 | 3,
  fixtures?: Record<string, Record<string, CellValue>>,
): TestCase {
  if (!raw || typeof raw !== "object") {
    throw new Error("Test case must be an object");
  }
  const obj = raw as Record<string, unknown>;
  let id: string;
  let subject: string;
  let subjectRef: string | undefined;
  let name: string | undefined;

  if (schemaVersion === 3) {
    subject = stringRequired(obj.subject, "subject");
    name = stringRequired(obj.name, "name", subject);
    subjectRef = deriveSubjectRef(subject, stringOptional(obj.subjectRef, "subjectRef", subject));
    id = derivePublicRef({ subject, subjectRef, name });
  } else {
    id = stringRequired(obj.id, "id", JSON.stringify(obj).slice(0, 80));
    subject = stringRequired(obj.subject, "subject", id);
  }

  let formula: string | PlatformFormula;
  if (typeof obj.formula === "object" && obj.formula !== null && !Array.isArray(obj.formula)) {
    formula = obj.formula as PlatformFormula;
  } else if (typeof obj.formula === "string" || schemaVersion === 2) {
    formula = String(obj.formula ?? "");
  } else {
    throw new Error(`Test ${id} missing required \`formula\``);
  }

  // grid: $name resolves against suite fixtures
  let grid: Record<string, CellValue> | undefined;
  if (typeof obj.grid === "string" && obj.grid.startsWith("$")) {
    const fxName = obj.grid.slice(1);
    if (fixtures && fixtures[fxName]) grid = coerceGridMap(fixtures[fxName]);
    else throw new Error(`Test ${id}: grid reference $${fxName} not found in suite fixtures`);
  } else if (obj.grid && typeof obj.grid === "object") {
    grid = coerceGridMap(obj.grid as Record<string, unknown>);
  }

  let overrides: Partial<Record<Platform, Override>> | undefined;
  if (obj.overrides && typeof obj.overrides === "object" && !Array.isArray(obj.overrides)) {
    overrides = {};
    for (const [k, v] of Object.entries(obj.overrides as Record<string, unknown>)) {
      if (!ALL_PLATFORMS.includes(k as Platform)) continue; // ignore unknown engines
      overrides[k as Platform] = parseOverride(v, id, k);
    }
  }

  const expect = obj.expect === undefined ? undefined : coerceMatcher(obj.expect);
  const category = obj.category
    ? (obj.category as Category)
    : schemaVersion === 3
      ? deriveCategory({ subject, status: obj.status as string | undefined, expect })
      : missingCategory(id);

  return {
    id,
    subject,
    subjectRef,
    name,
    category,
    features: Array.isArray(obj.features) ? (obj.features as string[]) : undefined,
    supportLevel: typeof obj.supportLevel === "string" ? obj.supportLevel as SupportLevel : undefined,
    status: obj.status as Status | undefined,
    formula,
    grid,
    expect,
    overrides,
    links: obj.links as TestCase["links"],
    tags: Array.isArray(obj.tags) ? (obj.tags as unknown[]).map(String) : undefined,
    aliases: Array.isArray(obj.aliases) ? (obj.aliases as unknown[]).map(String) : undefined,
  };
}

function stringRequired(value: unknown, field: string, context?: string): string {
  if (typeof value === "string") return value;
  if (field === "id" && context) {
    throw new Error(`Test missing required \`${field}\`: ${context}`);
  }
  if (context) throw new Error(`Test ${context} missing required \`${field}\``);
  throw new Error(`Test missing required \`${field}\``);
}

function stringOptional(value: unknown, field: string, context?: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  if (context) throw new Error(`Test ${context} field \`${field}\` must be a string`);
  throw new Error(`Test field \`${field}\` must be a string`);
}

function missingCategory(id: string): never {
  throw new Error(`Test ${id} missing required \`category\``);
}

// coerce error-code strings into CellError; recurses into grids; matcher objects pass through
function coerceMatcher(v: unknown): Matcher {
  if (v === null || v === undefined) return v as Matcher;
  if (typeof v === "string") return coerceCellValue(v) as Matcher;
  if (Array.isArray(v)) {
    return v.map(coerceMatcher) as Matcher;
  }
  return v as Matcher;
}

function parseOverride(raw: unknown, testId: string, engine: string): Override {
  if (!raw || typeof raw !== "object") {
    throw new Error(`Test ${testId}: override for ${engine} must be an object`);
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.cause !== "string") {
    throw new Error(`Test ${testId}: override for ${engine} missing required \`cause\``);
  }
  const override: Override = { cause: o.cause as Cause };
  if (o.expect !== undefined) override.expect = coerceMatcher(o.expect);
  if (o.recorded !== undefined) {
    override.recorded = coerceMatcher(o.recorded) as CellValue | CellValue[][];
  }
  if (typeof o.note === "string") override.note = o.note;
  return override;
}

function coerceGridMap(map: Record<string, unknown>): Record<string, CellValue> {
  const out: Record<string, CellValue> = {};
  for (const [k, v] of Object.entries(map)) out[k] = coerceCellValue(v);
  return out;
}

function coerceCellValue(v: unknown): CellValue {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" && v.startsWith("#") && /^#[A-Z0-9/!?]+!?$/.test(v)) {
    return { error: v } as CellError;
  }
  return v as CellValue;
}

// scalars → [[v]], 1D → [[...]], 2D pass through
export function normalizeToGrid(value: CellValue | CellValue[] | CellValue[][]): GridValue {
  if (value === null || value === undefined) return [[null]];
  if (!Array.isArray(value)) return [[coerceCellValue(value)]];
  if (value.length === 0) return [[]];
  if (!Array.isArray(value[0])) return [(value as unknown[]).map(coerceCellValue)];
  return (value as unknown[][]).map((row) => row.map(coerceCellValue));
}

export interface ResolvedFormula {
  formula: string;
  /** engine-side text actually evaluated (after adapter wrap, if any) */
  asEvaluated: string;
  /** true when feature reconciliation said this engine cannot run the test */
  skip: boolean;
  skipReason?: string;
}

// pick per-platform formula, reconcile features, apply adapter wrap if needed
export function resolveFormulaForPlatform(
  test: TestCase,
  platform: Platform,
): ResolvedFormula | null {
  const base = getFormulaForPlatform(test.formula, platform);
  if (base === null) return null;
  const reconciled = reconcileFeatures(test.features, platform);
  if (reconciled.kind === "skip") {
    return { formula: base, asEvaluated: base, skip: true, skipReason: reconciled.reason };
  }
  if (reconciled.kind === "wrapped") {
    const wrapped = applyAdapter(base, reconciled.adapter);
    return { formula: wrapped, asEvaluated: wrapped, skip: false };
  }
  return { formula: base, asEvaluated: base, skip: false };
}

export function getFormulaForPlatform(
  formula: string | PlatformFormula,
  platform: Platform,
): string | null {
  if (typeof formula === "string") return formula;
  return formula[platform] ?? null;
}

// lighter than resolveFormulaForPlatform — skip reason or null, no wrapped text
export function featureSkipFor(test: TestCase, platform: Platform): string | null {
  if (getFormulaForPlatform(test.formula, platform) === null) return null;
  const reconciled = reconcileFeatures(test.features, platform);
  return reconciled.kind === "skip" ? reconciled.reason : null;
}

// override.expect → that; override w/o expect → null (documented deviation, drift catches changes); no override → test.expect
export function effectiveExpect(test: TestCase, platform: Platform): Matcher | null {
  const ov = test.overrides?.[platform];
  if (ov) {
    return ov.expect ?? null;
  }
  return test.expect ?? null;
}
