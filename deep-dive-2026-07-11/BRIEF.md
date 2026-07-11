# Deep-dive brief — sheets.wiki evidence sweep (2026-07-11)

You are one analyst in a parallel fan-out producing **wiki-grade cross-engine research** from
assay's evidence. Your output will be reconciled later by a separate pass — so every file you
write must be **self-contained, well-formed, and follow the schemas below exactly**.

## Context (read once)

- **assay** (`packages/assay`) is the engine-divergence catalogue: the same formula corpus runs
  across 8 spreadsheet engines (excel, gsheets, hyperformula, ironcalc, lattice, libreoffice,
  pycel, formulas) and the recorded outcomes live in `packages/assay/fixtures/<suite>/<engine>.json`.
- A **fork** = a corpus case where engines split into >1 agreement class. There are ~1822 forks;
  ~877 have **no explanatory annotation**. Your work-list is your batch's slice of those 877.
- **sheets.wiki** (`packages/sheets-wiki/content/function/<NAME>.md`) has 527 function pages,
  mostly imported vendor docs — thin on real cross-engine truth. Your notes are raw material for
  upgrading them.
- **No-verdict principle** (for `annotations.json` only): assay records _what each engine does_
  and _why they differ_ (mechanism), never "which engine is correct". Use the cause vocabulary,
  describe each branch. In the **wiki notes** you may editorialize (the wiki is a consumer lens
  — "HyperFormula's result here is a known bug" is fine there, with a citation if you know one).

## Your inputs

All paths relative to the worktree root `/Users/jaegun/personal/cartularium/.claude/worktrees/wiki-deep-dive/`.

1. **Work-list**: `packages/assay/scratch/worklist/<suite>.json` for each suite in your batch.
   Each item: `{ref, suite, subject, name, formula, tags?, partition}` where `partition` is the
   observed agreement classes: `[{engines: [...], values: [...]}, ...]` (>1 class = the fork).
   `ref` is `SUBJECT/test-name` — the case-ref used everywhere.
2. **Tests**: `packages/assay/tests/<suite>.yaml` — the authored cases (formula may be per-engine
   variants: `formula: {gsheets: ..., excel: ..., lattice: ...}`; may carry `grid:` input seeds).
3. **Recorded fixtures**: `packages/assay/fixtures/<suite>/<engine>.json` —
   `{platform, generatedAt, results}` where `results` is keyed by the test's semantic hash. To
   join ref→hash, the work-list partition values usually suffice; for raw detail, match by
   `formula-as-evaluated`. Excel/gsheets/lattice/libreoffice recordings live ONLY here (you
   cannot run those engines).
4. **Existing explanations**: `packages/assay/divergences/DV-*.yaml` (255 records) — check what's
   already explained before writing; your annotations cover forks these do NOT.
5. **Wiki pages**: `packages/sheets-wiki/content/function/<SUBJECT>.md` (may not exist for every
   subject) and `packages/sheets-wiki/content/concept/*.md`.

## Live probing (pure engines ONLY)

You may (and should) run live probes to test hypotheses and explore edges beyond the corpus:

```bash
cd /Users/jaegun/personal/cartularium/.claude/worktrees/wiki-deep-dive/packages/assay
# write scratch/<your-batch>-probe1.mts  (PREFIX EVERY SCRATCH FILE WITH YOUR BATCH NAME)
npx tsx scratch/<your-batch>-probe1.mts
```

```ts
import { createDriver } from "@cartularium/drivers"
const d = createDriver("hyperformula") // hyperformula | ironcalc | formulas | pycel — NOTHING ELSE
await d.init()
const results = await d.evaluateBatch([
  { formula: '=TEXT(0.5,"0.0%")' },
  { formula: "=A1+1", grid: { A1: 3 } }, // grid seeds: scalar CellValue per address
])
console.log(JSON.stringify(results, null, 1))
```

**HARD RULES:**

- **NEVER** `createDriver("excel")`, `createDriver("gsheets")`, `createDriver("libreoffice")`,
  `createDriver("lattice")` — excel/gsheets are single-owner lanes run separately; the others
  are not installed. If you need Excel/gsheets ground truth you don't have, emit a probe request.
- Never edit repo source, tests, fixtures, or divergences. You write ONLY under
  `deep-dive-2026-07-11/batches/<your-batch>/` and `packages/assay/scratch/<your-batch>-*`.
- Never `git commit`, never `git add`.
- pycel/formulas spawn python via uv (already synced); they're parallel-safe but slow — batch
  your probes, don't loop one-at-a-time.

## Deliverables

Write into `deep-dive-2026-07-11/batches/<your-batch>/`:

### 1. `annotations.json` — draft fork annotations (the store-ready artifact)

An array. One entry per **explanation cluster** (one mechanism may cover many refs — scope them
together; do NOT write 40 copies of the same sentence):

```json
[
  {
    "content": "2-6 sentences. Descriptive mechanism: what each branch does and why (engine X evaluates ... whereas Y ...). No correctness verdicts. Cite live-probe confirmation if you did one.",
    "cause": "one of: missing-function | missing-arg-form | argument-arity | arg-semantics | precision | format-rendering | locale | shape | array-orientation | error-code | error-attribution | null-vs-zero | recalc-semantics | array-handling | unimplemented-edge | version-skew | intentional-spec | TODO",
    "scope": [{ "kind": "ref-set", "refs": ["SUBJECT/test-name", "..."] }],
    "_meta": {
      "batch": "<your-batch>",
      "confidence": "high | medium | low",
      "evidence": "one line: what grounds this (recorded fixtures / live probe / literature)",
      "wants_probe": ["probe-id", "..."]
    }
  }
]
```

Every ref in your work-list should end up in exactly one annotation's scope (or be explicitly
listed in `skipped.json` with a reason — e.g. "fixture data insufficient, needs live excel").

### 2. `notes/<SUBJECT>.md` — wiki-grade deep-dive notes

For the subjects in your batch with the richest stories (aim for the top ~8–20 subjects by
substance, not a stub for everything). Group tightly-related subjects into one file when the
story is shared (e.g. `IMSUM-IMSUB-IMPRODUCT.md`). Template:

```markdown
# <SUBJECT> — cross-engine deep dive

**Batch:** <batch> · **Refs:** <the work-list refs covered> · **Confidence:** high/medium/low

## Behavior summary

What the function does; where engines agree (one paragraph).

## Divergences

Per fork: the formula, a compact result table (engine → result), the mechanism, and which
cause bucket it is. Markdown tables. Include live-probe output you gathered.

## Edges explored beyond the corpus

New edge cases you probed on pure engines (formula → per-engine result), anything surprising.

## Wiki-facing notes

Concrete text/points the function page should carry (compatibility caveats, portability advice).

## Open questions

What needs Excel/gsheets live confirmation (reference probe-request ids), what needs a human.
```

### 3. `probe-requests.json` — what you want confirmed on live Excel / Google Sheets

```json
[
  {
    "id": "<your-batch>-001",
    "engines": ["excel", "gsheets"],
    "formula": "=TEXT(0.5,\"0.0%\")",
    "formula_excel": "(optional excel-syntax override)",
    "formula_gsheets": "(optional gsheets-syntax override)",
    "grid": { "A1": 3 },
    "hypothesis": "expected result and why",
    "note": "which annotation/note consumes this"
  }
]
```

Keep these **high-value** (uncertain claims, new edges) — budget ~10–40 per batch, not hundreds.
Plain formulas + scalar grid seeds only; no INDIRECT/OFFSET/volatile unless that IS the question.

### 4. `SUMMARY.md` — ≤1 page: what you covered, headline findings, counts, what you skipped.

## Method expectations

- **Ground everything.** Recorded fixtures first; live pure-engine probes to reproduce/extend;
  training knowledge last and always flagged (`confidence: low` or a probe request).
- **Read the existing DV records for your subjects** so you extend, not duplicate.
- **Depth over breadth in notes; breadth over depth in annotations** (annotations must cover the
  whole work-list; notes go deep on the best material).
- Full sentences, precise engine names, exact formulas, exact observed values. The reconciling
  model is weaker than you — leave nothing implicit.
