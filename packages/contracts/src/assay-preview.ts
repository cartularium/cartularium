import { isPlatform } from "./platform.js"

export const ASSAY_PREVIEW_RESULT_CONTRACT_VERSION = 1

export interface AssayCellError {
  error: string
}

export type AssayCellValue = number | string | boolean | AssayCellError | null
export type AssayGridValue = AssayCellValue[][]

export type AssayPreviewDiagnosticSeverity = "error" | "warning" | "info"

export interface AssayPreviewDiagnostic {
  severity: AssayPreviewDiagnosticSeverity
  message: string
  field?: string
}

export type AssayPreviewPlatformState = "succeeded" | "failed" | "skipped"

export interface AssayPreviewPlatformPayload {
  state: AssayPreviewPlatformState
  result?: AssayGridValue
  error?: string
  passed?: boolean | null
  expected?: AssayGridValue
  formulaAsEvaluated?: string
  durationMs?: number
  [key: string]: unknown
}

export interface AssayPreviewResultPayload {
  contractVersion: number
  jobId: string
  draftId: string
  candidateHash: string
  runnerId: string
  startedAt: string
  completedAt: string
  platforms: Record<string, AssayPreviewPlatformPayload | undefined>
  diagnostics: AssayPreviewDiagnostic[]
  [key: string]: unknown
}

export type AssayPreviewPlatformVerdict =
  | "passed"
  | "failed"
  | "errored"
  | "skipped"
  | "missing"
  | "observed"

export type AssayPreviewOverall = "pass" | "fail" | "error" | "incomplete" | "observed"

export type AssayGridDifferenceKind = "different" | "extra" | "missing"

export interface AssayGridCellDifference {
  row: number
  column: number
  actual?: AssayCellValue
  expected?: AssayCellValue
  kind: AssayGridDifferenceKind
}

export interface AssayGridDiff {
  resultShape: [number, number]
  expectedShape: [number, number]
  matchingCells: number
  differentCells: number
  extraCells: number
  missingCells: number
  firstDifferences: AssayGridCellDifference[]
}

export interface AssayPreviewPlatformInspection {
  platform: string
  knownPlatform: boolean
  state: AssayPreviewPlatformState | "missing"
  verdict: AssayPreviewPlatformVerdict
  passed: boolean | null
  error?: string
  durationMs?: number
  formulaAsEvaluated?: string
  result?: AssayGridValue
  expected?: AssayGridValue
  diff: AssayGridDiff | null
}

export interface AssayPreviewInspection {
  contractVersion: number
  contractSupported: boolean
  jobId: string
  draftId: string
  candidateHash: string
  runnerId: string
  startedAt: string
  completedAt: string
  overall: AssayPreviewOverall
  platforms: AssayPreviewPlatformInspection[]
  totals: {
    platforms: number
    passed: number
    failed: number
    errored: number
    skipped: number
    missing: number
    observed: number
  }
  diagnostics: {
    errors: number
    warnings: number
    infos: number
  }
}

export type AssayCompareVerdict =
  | "match"
  | "matches-some"
  | "diverge"
  | "matches-none"
  | "no-target-data"
  | "no-ref-data"

export interface AssayCompareRow {
  address: string                                  // "A1", "B2", or the synthetic "expected"
  targetValue: AssayCellValue | null
  refValues: Record<string, AssayCellValue | null> // keyed by ref platform name
  verdict: AssayCompareVerdict
}

export interface AssayCompareResult {
  rows: AssayCompareRow[]
}

export interface CompareAssayGridsOptions {
  // when provided, prepends a synthetic "expected" row showing every ref's
  // value at expected-grid cells. use this when the target is a platform and
  // the caller wants the expected-context row for comparison.
  expected?: AssayGridValue
}

export function compareAssayGrids(
  target: AssayGridValue | null,
  refs: Record<string, AssayGridValue | null>,
  options: CompareAssayGridsOptions = {},
): AssayCompareResult {
  const refEntries = Object.entries(refs)
  const allGrids: AssayGridValue[] = []
  if (target) allGrids.push(target)
  if (options.expected) allGrids.push(options.expected)
  for (const [, grid] of refEntries) if (grid) allGrids.push(grid)

  const shape = unionShape(allGrids)
  const rows: AssayCompareRow[] = []

  if (options.expected) {
    rows.push(buildSyntheticExpectedRow(options.expected, target, refEntries))
  }

  for (let row = 0; row < shape[0]; row++) {
    for (let column = 0; column < shape[1]; column++) {
      const address = addressFor(row, column)
      const targetValue = target && hasGridCell(target, row, column) ? target[row][column] : null
      const refValues: Record<string, AssayCellValue | null> = {}
      for (const [name, grid] of refEntries) {
        refValues[name] = grid && hasGridCell(grid, row, column) ? grid[row][column] : null
      }
      rows.push({
        address,
        targetValue,
        refValues,
        verdict: resolveCompareVerdict(targetValue, refValues, target !== null, refEntries),
      })
    }
  }

  return { rows }
}

function buildSyntheticExpectedRow(
  expected: AssayGridValue,
  target: AssayGridValue | null,
  refEntries: Array<[string, AssayGridValue | null]>,
): AssayCompareRow {
  // synthetic row uses A1 as stand-in; editor pulls per-cell expected/actual from regular rows
  const refValues: Record<string, AssayCellValue | null> = {}
  for (const [name, grid] of refEntries) {
    refValues[name] = grid && hasGridCell(grid, 0, 0) ? grid[0][0] : null
  }
  const expectedValue = hasGridCell(expected, 0, 0) ? expected[0][0] : null
  return {
    address: "expected",
    targetValue: expectedValue,
    refValues,
    verdict: resolveCompareVerdict(expectedValue, refValues, true, refEntries),
  }
}

function resolveCompareVerdict(
  targetValue: AssayCellValue | null,
  refValues: Record<string, AssayCellValue | null>,
  targetIsPresent: boolean,
  refEntries: Array<[string, AssayGridValue | null]>,
): AssayCompareVerdict {
  const allRefsAbsent = refEntries.every(([, grid]) => grid === null)
  if (allRefsAbsent) return "no-ref-data"
  if (!targetIsPresent || targetValue === null) return "no-target-data"

  const refsWithData = Object.entries(refValues).filter(([name]) => {
    const grid = refEntries.find(([n]) => n === name)?.[1]
    return grid !== null
  })

  if (refsWithData.length === 0) return "no-ref-data"

  const firstRef = refsWithData[0][1]
  const allRefsAgree = refsWithData.every(([, value]) => cellEquals(value, firstRef))
  if (allRefsAgree) {
    return cellEquals(targetValue, firstRef) ? "match" : "diverge"
  }

  const targetMatchesAny = refsWithData.some(([, value]) => cellEquals(value, targetValue))
  return targetMatchesAny ? "matches-some" : "matches-none"
}

function unionShape(grids: AssayGridValue[]): [number, number] {
  let rows = 0
  let columns = 0
  for (const grid of grids) {
    const [r, c] = gridShape(grid)
    if (r > rows) rows = r
    if (c > columns) columns = c
  }
  return [rows, columns]
}

export function addressFor(row: number, column: number): string {
  return `${columnLetters(column)}${row + 1}`
}

export function columnLetters(column: number): string {
  let n = column
  let letters = ""
  do {
    letters = String.fromCharCode(65 + (n % 26)) + letters
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return letters
}

export interface InspectAssayPreviewResultOptions {
  requestedPlatforms?: readonly string[]
  maxDifferences?: number
}

export function inspectAssayPreviewResult(
  result: AssayPreviewResultPayload,
  options: InspectAssayPreviewResultOptions = {},
): AssayPreviewInspection {
  const platforms = platformOrder(result.platforms, options.requestedPlatforms)
  const maxDifferences = options.maxDifferences ?? 5
  const inspectedPlatforms = platforms.map((platform) =>
    inspectPlatform(platform, result.platforms[platform], maxDifferences),
  )
  const totals = {
    platforms: inspectedPlatforms.length,
    passed: inspectedPlatforms.filter((platform) => platform.verdict === "passed").length,
    failed: inspectedPlatforms.filter((platform) => platform.verdict === "failed").length,
    errored: inspectedPlatforms.filter((platform) => platform.verdict === "errored").length,
    skipped: inspectedPlatforms.filter((platform) => platform.verdict === "skipped").length,
    missing: inspectedPlatforms.filter((platform) => platform.verdict === "missing").length,
    observed: inspectedPlatforms.filter((platform) => platform.verdict === "observed").length,
  }
  const diagnostics = diagnosticCounts(result.diagnostics)

  const contractSupported = result.contractVersion === ASSAY_PREVIEW_RESULT_CONTRACT_VERSION

  return {
    contractVersion: result.contractVersion,
    contractSupported,
    jobId: result.jobId,
    draftId: result.draftId,
    candidateHash: result.candidateHash,
    runnerId: result.runnerId,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    overall: contractSupported ? overallVerdict(totals, diagnostics.errors) : "error",
    platforms: inspectedPlatforms,
    totals,
    diagnostics,
  }
}

export function diffAssayGrids(
  result: AssayGridValue,
  expected: AssayGridValue,
  maxDifferences = 5,
): AssayGridDiff {
  const resultShape = gridShape(result)
  const expectedShape = gridShape(expected)
  const rows = Math.max(resultShape[0], expectedShape[0])
  const columns = Math.max(resultShape[1], expectedShape[1])
  const firstDifferences: AssayGridCellDifference[] = []
  let matchingCells = 0
  let differentCells = 0
  let extraCells = 0
  let missingCells = 0

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const hasActual = hasGridCell(result, row, column)
      const hasExpected = hasGridCell(expected, row, column)
      if (hasActual && hasExpected) {
        const actual = result[row][column]
        const expectedCell = expected[row][column]
        if (cellEquals(actual, expectedCell)) {
          matchingCells++
        } else {
          differentCells++
          pushDifference(firstDifferences, maxDifferences, {
            row,
            column,
            actual,
            expected: expectedCell,
            kind: "different",
          })
        }
      } else if (hasActual) {
        extraCells++
        pushDifference(firstDifferences, maxDifferences, {
          row,
          column,
          actual: result[row][column],
          kind: "extra",
        })
      } else if (hasExpected) {
        missingCells++
        pushDifference(firstDifferences, maxDifferences, {
          row,
          column,
          expected: expected[row][column],
          kind: "missing",
        })
      }
    }
  }

  return {
    resultShape,
    expectedShape,
    matchingCells,
    differentCells,
    extraCells,
    missingCells,
    firstDifferences,
  }
}

export function parseAssayGridClipboard(text: string): AssayGridValue {
  if (text === "") return [[null]]
  const rows = parseTabularText(text.replace(/\r\n/g, "\n").replace(/\r/g, "\n"))
  if (rows.length === 0) return [[null]]
  return rows.map((row) => row.map(coerceClipboardCell))
}

function inspectPlatform(
  platform: string,
  payload: AssayPreviewPlatformPayload | undefined,
  maxDifferences: number,
): AssayPreviewPlatformInspection {
  if (!payload) {
    return {
      platform,
      knownPlatform: isPlatform(platform),
      state: "missing",
      verdict: "missing",
      passed: null,
      diff: null,
    }
  }

  const verdict = platformVerdict(payload)
  const result = payload.result
  const expected = payload.expected
  return {
    platform,
    knownPlatform: isPlatform(platform),
    state: payload.state,
    verdict,
    passed: payload.passed ?? null,
    error: payload.error,
    durationMs: payload.durationMs,
    formulaAsEvaluated: payload.formulaAsEvaluated,
    result,
    expected,
    diff: result && expected ? diffAssayGrids(result, expected, maxDifferences) : null,
  }
}

function platformVerdict(payload: AssayPreviewPlatformPayload): AssayPreviewPlatformVerdict {
  if (payload.state === "skipped") return "skipped"
  if (payload.error) return "errored"
  if (payload.passed === true) return "passed"
  if (payload.passed === false) return "failed"
  return "observed"
}

function platformOrder(
  platformPayloads: Record<string, AssayPreviewPlatformPayload | undefined>,
  requestedPlatforms: readonly string[] | undefined,
): string[] {
  const ordered: string[] = []
  for (const platform of requestedPlatforms ?? []) {
    if (!ordered.includes(platform)) ordered.push(platform)
  }
  for (const platform of Object.keys(platformPayloads)) {
    if (!ordered.includes(platform)) ordered.push(platform)
  }
  return ordered
}

function diagnosticCounts(diagnostics: readonly AssayPreviewDiagnostic[] | undefined) {
  const counts = { errors: 0, warnings: 0, infos: 0 }
  for (const diagnostic of diagnostics ?? []) {
    if (diagnostic.severity === "error") counts.errors++
    else if (diagnostic.severity === "warning") counts.warnings++
    else if (diagnostic.severity === "info") counts.infos++
  }
  return counts
}

function overallVerdict(
  totals: AssayPreviewInspection["totals"],
  diagnosticErrors: number,
): AssayPreviewOverall {
  if (diagnosticErrors > 0 || totals.errored > 0) return "error"
  if (totals.failed > 0) return "fail"
  if (totals.platforms === 0) return "incomplete"
  if (totals.missing > 0 || totals.skipped > 0) return "incomplete"
  if (totals.platforms > 0 && totals.platforms === totals.observed) return "observed"
  return "pass"
}

function gridShape(grid: AssayGridValue): [number, number] {
  const rows = grid.length
  const columns = grid.reduce((max, row) => Math.max(max, row.length), 0)
  return [rows, columns]
}

function hasGridCell(grid: AssayGridValue, row: number, column: number): boolean {
  return row < grid.length && column < grid[row].length
}

function pushDifference(
  differences: AssayGridCellDifference[],
  maxDifferences: number,
  difference: AssayGridCellDifference,
): void {
  if (differences.length < maxDifferences) differences.push(difference)
}

function cellEquals(left: AssayCellValue, right: AssayCellValue): boolean {
  if (isCellError(left) || isCellError(right)) {
    return isCellError(left) && isCellError(right) && left.error === right.error
  }
  return Object.is(left, right)
}

function isCellError(value: AssayCellValue): value is AssayCellError {
  return typeof value === "object" && value !== null && "error" in value
}

function parseTabularText(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let index = 0
  let quoted = false

  while (index < text.length) {
    const char = text[index]
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"'
          index += 2
          continue
        }
        quoted = false
        index++
        continue
      }
      cell += char
      index++
      continue
    }

    if (cell === "" && char === '"') {
      quoted = true
      index++
      continue
    }
    if (char === "\t") {
      row.push(cell)
      cell = ""
      index++
      continue
    }
    if (char === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
      index++
      continue
    }
    cell += char
    index++
  }

  if (cell !== "" || row.length > 0 || !text.endsWith("\n")) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

function coerceClipboardCell(value: string): AssayCellValue {
  if (value === "") return null
  const trimmed = value.trim()
  if (trimmed === "") return value
  if (/^#(?:NULL!|DIV\/0!|VALUE!|REF!|NAME\?|NUM!|N\/A|GETTING_DATA|SPILL!|CALC!|FIELD!|BLOCKED!|UNKNOWN!)$/i.test(trimmed)) {
    return { error: trimmed.toUpperCase() }
  }
  if (/^TRUE$/i.test(trimmed)) return true
  if (/^FALSE$/i.test(trimmed)) return false
  if (isPlainNumber(trimmed)) return Number(trimmed)
  return value
}

function isPlainNumber(value: string): boolean {
  if (value.startsWith("=")) return false
  return /^[+-]?(?:\d+|\d*\.\d+)(?:[eE][+-]?\d+)?$/.test(value)
}
