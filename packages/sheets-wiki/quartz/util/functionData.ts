// build-time aggregator for sheets.wiki function pages: lattice TSVs supply
// category + syntax, assay supplies engine status + divergences + tests.
// see @cartularium/contracts/ASSAY-INTEGRATION.md for the manifest schema; canonical types in @cartularium/contracts.

import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import yaml from "js-yaml"
import {
  assertSupportedManifestVersion,
  type EngineStatus,
  type ManifestDvEntry,
  type ManifestEngineEntry,
  type ManifestV4FunctionEntry,
  type ManifestV4TestEntry,
  type TestVerdict,
} from "@cartularium/contracts"

export type EnginesMap = Record<string, ManifestEngineEntry>

export type CoverageMarker = "pending-assay" | "out-of-scope"

export function isEnginesMap(value: unknown): value is EnginesMap {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

export type TestVerdictMap = Partial<Record<string, TestVerdict>>
export type TestMetaMap = Record<string, ManifestV4TestEntry>
export type TestVerdictData = Record<string, TestVerdictMap> & { __meta?: TestMetaMap }

export interface FunctionData {
  category?: string
  syntax?: string
  engines?: EnginesMap
  divergences?: string[]
  divergenceMeta?: Record<string, ManifestDvEntry>
  tests?: string[]
  testVerdicts?: TestVerdictData
}

export type FunctionDataMap = Map<string, FunctionData>

export interface LoadOptions {
  latticePath?: string
  assayPath?: string
  manifestPath?: string
}

export function loadFunctionData(opts: LoadOptions): FunctionDataMap {
  const map: FunctionDataMap = new Map()

  if (opts.latticePath && existsSync(opts.latticePath)) {
    loadLatticeTsv(join(opts.latticePath, "spec/reference/gsheets_functions.tsv"), "gsheets", map)
    loadLatticeTsv(join(opts.latticePath, "spec/reference/excel_functions.tsv"), "excel", map)
  }

  // manifest is preferred when present; raw assay yaml is the fresh-checkout fallback.
  if (opts.manifestPath && existsSync(opts.manifestPath)) {
    mergeFromManifest(opts.manifestPath, map)
  } else if (opts.assayPath && existsSync(opts.assayPath)) {
    loadAssayDivergences(join(opts.assayPath, "divergences"), map)
    loadAssayTests(join(opts.assayPath, "tests"), map)
  }

  return map
}

function mergeFromManifest(path: string, map: FunctionDataMap): void {
  const raw = JSON.parse(readFileSync(path, "utf-8")) as {
    version?: unknown
    functions?: Record<string, ManifestV4FunctionEntry>
    dvs?: Record<string, ManifestDvEntry>
    tests?: Record<string, ManifestV4TestEntry>
  }
  assertSupportedManifestVersion(raw.version, path)
  const dvIndex = raw.dvs ?? {}
  const testIndex = raw.tests ?? {}
  for (const [name, entry] of Object.entries(raw.functions ?? {})) {
    const existing = map.get(name) ?? {}
    existing.engines = { ...(existing.engines ?? {}), ...entry.engines }
    existing.divergences = entry.divergences
    existing.divergenceMeta = pluckByIds(entry.divergences, dvIndex)
    existing.tests = entry.tests
    existing.testVerdicts = pluckTestVerdictData(entry.tests, testIndex)
    map.set(name, existing)
  }
}

function pluckTestVerdictData(
  ids: string[],
  index: Record<string, ManifestV4TestEntry>,
): TestVerdictData | undefined {
  const verdicts = pluckByIds(ids, index, (e) => e.engines) as TestVerdictData | undefined
  const meta = pluckByIds(ids, index)
  if (verdicts && meta) verdicts.__meta = meta
  return verdicts
}

// builds a sub-record by selecting `ids` from a root index. omits the result
// entirely (returns undefined) when nothing matches, so consumers can use the
// `=== undefined` merge guard. an optional projector lets callers reshape the
// stored value (e.g. picking just the engines field off ManifestTestEntry).
function pluckByIds<T, U = T>(
  ids: string[],
  index: Record<string, T>,
  project?: (entry: T) => U,
): Record<string, U> | undefined {
  const out: Record<string, U> = {}
  for (const id of ids) {
    const entry = index[id]
    if (entry === undefined) continue
    out[id] = project ? project(entry) : (entry as unknown as U)
  }
  return Object.keys(out).length > 0 ? out : undefined
}

function loadLatticeTsv(path: string, engine: string, map: FunctionDataMap): void {
  if (!existsSync(path)) return
  const rows = parseTsv(readFileSync(path, "utf-8"))
  if (rows.length === 0) return

  const [header, ...records] = rows
  const typeIdx = header.indexOf("Type")
  const nameIdx = header.indexOf("Name")
  const syntaxIdx = header.indexOf("Syntax")
  if (typeIdx < 0 || nameIdx < 0) return

  for (const row of records) {
    const name = (row[nameIdx] ?? "").trim()
    if (!name) continue
    const category = (row[typeIdx] ?? "").trim().toLowerCase()
    const syntax = (row[syntaxIdx] ?? "").trim() || undefined

    const entry = map.get(name) ?? {}
    if (!entry.category && category) entry.category = category
    if (!entry.syntax && syntax) entry.syntax = syntax
    entry.engines ??= {}
    entry.engines[engine] ??= { status: "available" }
    map.set(name, entry)
  }
}

// status precedence when multiple DVs touch the same (function, engine) pair:
// missing-function wins over partial wins over available.
const STATUS_RANK: Record<EngineStatus, number> = { available: 1, partial: 2, missing: 3 }

function loadAssayDivergences(dir: string, map: FunctionDataMap): void {
  if (!existsSync(dir)) return
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".yaml"))) {
    const dv = yaml.load(readFileSync(join(dir, f), "utf-8")) as DvFile | undefined
    if (!dv?.id || !dv.subjects || !dv.engines) continue

    const dvStatus: EngineStatus = dv.cause === "missing-function" ? "missing" : "partial"
    for (const subject of dv.subjects) {
      const entry = map.get(subject) ?? {}
      entry.engines ??= {}
      for (const engine of dv.engines) {
        const existingRank = entry.engines[engine] ? STATUS_RANK[entry.engines[engine].status] : 0
        if (STATUS_RANK[dvStatus] >= existingRank) {
          entry.engines[engine] = { status: dvStatus, via: dv.id }
        }
      }
      entry.divergences ??= []
      if (!entry.divergences.includes(dv.id)) entry.divergences.push(dv.id)
      map.set(subject, entry)
    }
  }
  for (const entry of map.values()) entry.divergences?.sort()
}

function loadAssayTests(dir: string, map: FunctionDataMap): void {
  if (!existsSync(dir)) return
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".yaml"))) {
    const data = yaml.load(readFileSync(join(dir, f), "utf-8")) as TestFile | undefined
    if (!Array.isArray(data?.tests)) continue
    for (const test of data.tests) {
      if (!test?.id || !test.subject) continue
      const entry = map.get(test.subject) ?? {}
      entry.tests ??= []
      if (!entry.tests.includes(test.id)) entry.tests.push(test.id)
      map.set(test.subject, entry)
    }
  }
}

interface DvFile {
  id: string
  cause?: string
  subjects?: string[]
  engines?: string[]
}

interface TestFile {
  schemaVersion?: number
  tests?: Array<{ id?: string; subject?: string }>
}

// minimal RFC-4180 TSV reader: quoted fields may contain tabs, newlines, and
// doubled quote chars; lattice TSVs use this for multi-line descriptions.
export function parseTsv(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let fieldStart = true

  for (let i = 0; i < content.length; i++) {
    const c = content[i]
    if (inQuotes) {
      if (c === '"' && content[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else {
        field += c
      }
      continue
    }
    if (fieldStart && c === '"') {
      inQuotes = true
      fieldStart = false
      continue
    }
    if (c === "\t") {
      row.push(field)
      field = ""
      fieldStart = true
      continue
    }
    if (c === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      fieldStart = true
      continue
    }
    if (c === "\r") continue
    field += c
    fieldStart = false
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}
