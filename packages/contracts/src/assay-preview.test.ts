import test from "node:test"
import assert from "node:assert/strict"
import {
  inspectAssayPreviewResult,
  parseAssayGridClipboard,
  compareAssayGrids,
  type AssayPreviewResultPayload,
  type AssayGridValue,
} from "./assay-preview.js"

test("inspectAssayPreviewResult summarizes pass, fail, error, skipped, and missing platforms", () => {
  const result: AssayPreviewResultPayload = {
    contractVersion: 1,
    jobId: "job-1",
    draftId: "draft/Astral1119/smoke",
    candidateHash: "hash-1",
    runnerId: "mac-mini-runner-review",
    startedAt: "2026-05-16T06:20:15.000Z",
    completedAt: "2026-05-16T06:20:17.000Z",
    platforms: {
      excel: {
        state: "succeeded",
        result: [[4]],
        expected: [[4]],
        passed: true,
        durationMs: 101,
      },
      gsheets: {
        state: "succeeded",
        result: [[{ error: "#NAME?" }]],
        expected: [[4]],
        passed: false,
        durationMs: 202,
      },
      hyperformula: {
        state: "failed",
        result: [[null]],
        expected: [[4]],
        passed: false,
        error: "Formula parse failed",
        durationMs: 303,
      },
      ironcalc: {
        state: "skipped",
        error: "No formula was available for this platform.",
      },
    },
    diagnostics: [
      { severity: "warning", message: "preview used default review lane" },
      { severity: "error", field: "platforms.hyperformula", message: "Formula parse failed" },
    ],
  }

  const inspection = inspectAssayPreviewResult(result, {
    requestedPlatforms: ["excel", "gsheets", "hyperformula", "ironcalc", "lattice"],
  })

  assert.equal(inspection.overall, "error")
  assert.deepEqual(inspection.totals, {
    platforms: 5,
    passed: 1,
    failed: 1,
    errored: 1,
    skipped: 1,
    missing: 1,
    observed: 0,
  })
  assert.deepEqual(inspection.diagnostics, { errors: 1, warnings: 1, infos: 0 })
  assert.deepEqual(
    inspection.platforms.map((platform) => [platform.platform, platform.verdict]),
    [
      ["excel", "passed"],
      ["gsheets", "failed"],
      ["hyperformula", "errored"],
      ["ironcalc", "skipped"],
      ["lattice", "missing"],
    ],
  )
  assert.deepEqual(inspection.platforms[1].diff, {
    resultShape: [1, 1],
    expectedShape: [1, 1],
    matchingCells: 0,
    differentCells: 1,
    extraCells: 0,
    missingCells: 0,
    firstDifferences: [
      {
        row: 0,
        column: 0,
        actual: { error: "#NAME?" },
        expected: 4,
        kind: "different",
      },
    ],
  })
})

test("inspectAssayPreviewResult treats no-expectation platforms as observed", () => {
  const inspection = inspectAssayPreviewResult({
    contractVersion: 1,
    jobId: "job-2",
    draftId: "draft/Astral1119/observed",
    candidateHash: "hash-2",
    runnerId: "local-preview",
    startedAt: "2026-05-16T00:00:00.000Z",
    completedAt: "2026-05-16T00:00:01.000Z",
    platforms: {
      excel: {
        state: "succeeded",
        result: [[42]],
        passed: null,
      },
    },
    diagnostics: [],
  })

  assert.equal(inspection.overall, "observed")
  assert.equal(inspection.platforms[0].verdict, "observed")
  assert.equal(inspection.platforms[0].diff, null)
})

test("inspectAssayPreviewResult marks unsupported result contracts as errors", () => {
  const inspection = inspectAssayPreviewResult({
    contractVersion: 999,
    jobId: "job-3",
    draftId: "draft/Astral1119/future",
    candidateHash: "hash-3",
    runnerId: "future-runner",
    startedAt: "2026-05-16T00:00:00.000Z",
    completedAt: "2026-05-16T00:00:01.000Z",
    platforms: {
      excel: {
        state: "succeeded",
        result: [[1]],
        expected: [[1]],
        passed: true,
      },
    },
    diagnostics: [],
  })

  assert.equal(inspection.contractSupported, false)
  assert.equal(inspection.overall, "error")
})

test("inspectAssayPreviewResult marks empty platform sets as incomplete", () => {
  const inspection = inspectAssayPreviewResult({
    contractVersion: 1,
    jobId: "job-4",
    draftId: "draft/Astral1119/empty",
    candidateHash: "hash-4",
    runnerId: "empty-runner",
    startedAt: "2026-05-16T00:00:00.000Z",
    completedAt: "2026-05-16T00:00:01.000Z",
    platforms: {},
    diagnostics: [],
  })

  assert.equal(inspection.overall, "incomplete")
  assert.equal(inspection.totals.platforms, 0)
})

test("parseAssayGridClipboard normalizes spreadsheet TSV into typed grid values", () => {
  assert.deepEqual(
    parseAssayGridClipboard('1\tTRUE\t#N/A\n"two\twords"\t\t3.5\n"line\nbreak"\tFALSE\t=SUM(1,1)\n'),
    [
      [1, true, { error: "#N/A" }],
      ["two\twords", null, 3.5],
      ["line\nbreak", false, "=SUM(1,1)"],
    ],
  )
})

test("parseAssayGridClipboard preserves trailing empty cells but ignores a final copied newline", () => {
  assert.deepEqual(parseAssayGridClipboard("a\t\nb\tc\n"), [
    ["a", null],
    ["b", "c"],
  ])
})

test("compareAssayGrids: all refs match target → match", () => {
  const target = [[6]]
  const refs = { gsheets: [[6]], libreoffice: [[6]] }
  const { rows } = compareAssayGrids(target, refs)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].address, "A1")
  assert.equal(rows[0].verdict, "match")
  assert.deepEqual(rows[0].refValues, { gsheets: 6, libreoffice: 6 })
})

test("compareAssayGrids: some refs match target → matches-some", () => {
  const target = [[6]]
  const refs = { gsheets: [[6]], libreoffice: [[7]] }
  const { rows } = compareAssayGrids(target, refs)
  assert.equal(rows[0].verdict, "matches-some")
})

test("compareAssayGrids: no refs match target but refs agree → diverge", () => {
  const target = [[6]]
  const refs = { gsheets: [[7]], libreoffice: [[7]] }
  const { rows } = compareAssayGrids(target, refs)
  assert.equal(rows[0].verdict, "diverge")
})

test("compareAssayGrids: refs disagree internally and none match target → matches-none", () => {
  const target = [[6]]
  const refs = { gsheets: [[7]], libreoffice: [[8]] }
  const { rows } = compareAssayGrids(target, refs)
  assert.equal(rows[0].verdict, "matches-none")
})

test("compareAssayGrids: target absent → no-target-data", () => {
  const refs = { gsheets: [[6]] }
  const { rows } = compareAssayGrids(null, refs)
  assert.equal(rows[0].verdict, "no-target-data")
  assert.equal(rows[0].targetValue, null)
})

test("compareAssayGrids: all refs absent → no-ref-data", () => {
  const target = [[6]]
  const refs = { gsheets: null, libreoffice: null }
  const { rows } = compareAssayGrids(target, refs)
  assert.equal(rows[0].verdict, "no-ref-data")
})

test("compareAssayGrids: cell errors compare by error code", () => {
  const target: AssayGridValue = [[{ error: "#NAME?" }]]
  const refs = { gsheets: [[{ error: "#NAME?" } as const]] }
  const { rows } = compareAssayGrids(target, refs)
  assert.equal(rows[0].verdict, "match")
})

test("compareAssayGrids: ragged shapes report missing cells as null", () => {
  const target = [[1, 2], [3]]
  const refs = { gsheets: [[1, 2], [3, 4]] }
  const { rows } = compareAssayGrids(target, refs)
  const b2 = rows.find((r) => r.address === "B2")
  assert.ok(b2)
  assert.equal(b2!.targetValue, null)
  assert.equal(b2!.refValues.gsheets, 4)
  assert.equal(b2!.verdict, "no-target-data")
})

test("compareAssayGrids: rows are ordered row-major by address", () => {
  const target = [[1, 2], [3, 4]]
  const refs = { gsheets: [[1, 2], [3, 4]] }
  const { rows } = compareAssayGrids(target, refs)
  assert.deepEqual(rows.map((r) => r.address), ["A1", "B1", "A2", "B2"])
})

test("compareAssayGrids: expected option prepends synthetic 'expected' row", () => {
  const target = [[6]]
  const refs = { gsheets: [[6]] }
  const expected = [[6]]
  const { rows } = compareAssayGrids(target, refs, { expected })
  assert.equal(rows[0].address, "expected")
  assert.equal(rows[0].targetValue, 6)
  assert.deepEqual(rows[0].refValues, { gsheets: 6 })
  assert.equal(rows[0].verdict, "match")
})

test("compareAssayGrids: address column letters extend past Z", () => {
  // 27 columns × 1 row; column 27 = "AA"
  const target: AssayGridValue = [Array.from({ length: 27 }, (_, i) => i + 1)]
  const refs = { gsheets: target }
  const { rows } = compareAssayGrids(target, refs)
  assert.equal(rows[rows.length - 1].address, "AA1")
})
