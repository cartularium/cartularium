import assert from "node:assert/strict"
import { test } from "node:test"
import corpus from "./corpus/transpile.json" with { type: "json" }
import { transpileFormula, type FormulaDialect, type TranspileDiagnostic } from "./index.js"

interface CorpusCase {
  name: string
  source: string
  from: FormulaDialect
  to: FormulaDialect
  formula?: string
  diagnostics: TranspileDiagnostic[]
}

for (const entry of corpus as CorpusCase[]) {
  test(`corpus: ${entry.name}`, () => {
    const result = transpileFormula(entry.source, { from: entry.from, to: entry.to })

    assert.equal(result.formula, entry.formula)
    assert.deepEqual(result.diagnostics, entry.diagnostics)
  })
}
