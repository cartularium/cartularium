# Writing tests

Tests live in `tests/<suite>.yaml`. Each file is a list of tests; each test asserts what one engine should return for one formula.

## The simple case

```yaml
schemaVersion: 3
name: Math functions
tests:
  - subject: SUM
    name: sum-range
    formula: =SUM(A1:A3)
    grid: { A1: 1, A2: 2, A3: 3 }
    expect: 6
```

Required: `subject`, `name`, `formula`, `expect`. `category` is derived for common cases (`value`, `shape`, `error-code`, `volatile`) and can be supplied when the derived category would be ambiguous.

Assay derives the public reference from `subject/name` (for example `SUM/sum-range`) and derives the fixture key from the semantic content. Do not author `id:` in v3 tests.

## subject

What the test is about. One per test.

| Form | Use for | Example |
|---|---|---|
| `<NAME>` | A function | `SUM`, `VLOOKUP`, `LAMBDA` |
| `op:<symbol>` | An operator | `op:+`, `op:&`, `op:=` |
| `lit:<kind>` | A literal form | `lit:array`, `lit:number` |
| `ref:<kind>` | A reference form | `ref:range`, `ref:sheet` |
| `feature:<name>` | A runtime behavior | `feature:broadcasting`, `feature:recalc` |

Function names come from Lattice's reference TSVs (514 functions across Excel + Sheets). Run `assay coverage` to see which functions still need tests.

## category

What kind of correctness is being asserted.

| Value | Asserts on |
|---|---|
| `value` | Exact equality (numbers, strings, booleans, grids) |
| `shape` | Grid dimensions / spill shape only |
| `error-code` | Which error code is returned |
| `format` | Engine-rendered display output (TEXT, currency, date) |
| `locale` | Locale-sensitive output |
| `interaction` | Multi-cell behavior, recalc, structural ref |
| `volatile` | Non-deterministic; only bounds/type asserted |

When a test could fit two: pick the more specific. A spill-blocking test that asserts an error code is `error-code`, not `shape`.

## Benchmark lane and supportLevel

`category` says what a test asserts. The **benchmark lane** says which compatibility lane the result belongs to: the `benchmark` command scores only pure formula-value tests by default, because a scalar fixture comparison can otherwise create false confidence.

The lane is **derived, not declared.** A test leaves the scored formula-value lane automatically when its existing signals place it elsewhere — you never author the lane directly:

| Derived lane | Triggered by | Benchmark default |
|---|---|---|
| formula-value | none of the below | included |
| volatile | `category: volatile`, `status: volatile`, or subject `RAND`/`RANDBETWEEN`/`RANDARRAY`/`NOW`/`TODAY` | excluded |
| display | `category: format` | excluded |
| grid-context | `category: interaction` | excluded |
| metadata | subject `CELL`/`SHEET`/`SHEETS` | excluded |
| external-effect | `features: [external-io]` | excluded |
| partial | a non-`full` `supportLevel` (see below) | excluded |

So to keep a non-value test out of headline scoring, set the underlying signal (the right `category`, `features: [external-io]`, or a `supportLevel`) — the benchmark derives the rest. (The old `semanticDomain` field was dissolved 2026-06-16; it merely duplicated these signals.)

Use `supportLevel` to document maturity of the covered surface — and it is what excludes a partially-covered subject from headline scoring:

| supportLevel | Meaning |
|---|---|
| `full` | The test is part of a complete semantic coverage set for this subject |
| `subset` | The subject is intentionally only partially covered or implemented |
| `stub` | The behavior is a compatibility stub, not real support |
| `unsupported` | The test records lack of support or a known gap |
| `design-pending` | The correct model is not settled enough to score |

Examples:

```yaml
- subject: SORTN
  name: top-three
  supportLevel: unsupported       # → derived lane "partial", excluded from scoring
  formula: =SORTN({5;2;8;1;4}, 3)
  category: value
  expect: { error: "#NAME?" }

- subject: GOOGLEFINANCE
  name: current-price
  supportLevel: design-pending
  features: [external-io]          # → derived lane "external-effect", excluded
  formula: =GOOGLEFINANCE("GOOG", "price")
  category: value
  expect: { type: number }
```

## expect — matchers

Most tests just want a literal:

```yaml
expect: 6
expect: "text"
expect: true
expect: null
expect: [[1,2],[3,4]]
```

When you need more flexibility:

```yaml
expect: { error: "#N/A" } # specific error
expect: { error: any } # any error
expect: { near: 3.14159, tol: 1e-4 } # numeric tolerance
expect: { ge: 0, lt: 1 } # numeric range
expect: { type: number } # type assertion
expect: { matches: "^[A-Z]+$" } # regex on string
expect: { shape: [3, 1] } # grid dimensions only
expect: { not: <matcher> } # negation
expect: { any-of: [<m>, <m>] } # disjunction
expect: { all-of: [<m>, <m>] } # conjunction
```

Compose freely: `expect: { all-of: [{ type: number }, { ge: 0 }, { lt: 1 }] }`.

## When engines disagree — overrides

`expect:` is the canonical value. Engines that deviate get an override with a structured cause and the value they actually returned (the *recorded baseline*).

```yaml
- subject: MOD
  name: negative-dividend
  formula: =MOD(-5, 2)
  category: value
  expect: 1
  overrides:
    hyperformula:
      cause: arg-semantics
      recorded: -1
      note: hyperformula uses sign-of-dividend; gsheets/excel use sign-of-divisor
```

When the engine just doesn't have the function:

```yaml
overrides:
  pycel:
    cause: missing-function
    recorded: { error: "#NAME?" }
```

The cause is a closed enum — pick the most specific one:

| cause | meaning |
|---|---|
| `missing-function` | function not implemented (typically `#NAME?` / `#REF!`) |
| `missing-arg-form` | function exists; this signature/arity rejected |
| `argument-arity` | same signature, different default for an optional arg |
| `arg-semantics` | different interpretation of an argument |
| `precision` | numeric precision differs |
| `format-rendering` | output rendered with a different format string |
| `locale` | locale-sensitive output (separate from rendering) |
| `shape` | return shape differs in dimensions |
| `array-orientation` | same dimensions, transposed |
| `error-code` | same semantic error, different code |
| `error-attribution` | error appears in a different cell (spill-blocking) |
| `null-vs-zero` | blank/null/zero coercion divergence |
| `recalc-semantics` | volatile / iterative / lazy-eval differs |
| `array-handling` | broadcasting or array-arithmetic rules differ |
| `unimplemented-edge` | function exists; breaks on this specific input |
| `version-skew` | depends on engine release; expected to resolve |
| `intentional-spec` | engine documents an intentional divergence |

The `recorded:` value is sticky. `assay generate` updates fixtures freely; `recorded:` only changes when you accept drift via `assay check --mode=resolutions --accept`. That separation is what makes drift detection real.

## features — capability dependencies

Some formulas need an engine to support a particular runtime behavior. Declare it explicitly:

```yaml
- subject: op:+
  name: broadcast-row
  formula: "=1+{10,20,30}"
  category: value
  features: [broadcasting]
  expect: [[11, 21, 31]]
```

The runner reconciles features against `capabilities/<engine>.json`:
- `native` → run the formula as-is
- `wrapped` → apply a per-engine adapter (e.g., `=ARRAYFORMULA(...)` on gsheets)
- `absent` → skip the test on that engine, with a reason

If you omit `features:`, the formula runs as-written everywhere. That's the right call when you want to test bare-formula behavior (e.g., implicit intersection in gsheets).

Common features: `broadcasting`, `dynamic-arrays`, `lambda`, `higher-order-lambda`, `regex`, `external-io`, `volatile`, `iterative-calc`, `let-bindings`.

## status — when there's no canonical

Default is `verified`. Two other values:

```yaml
status: volatile # non-deterministic; expect is a matcher (RAND/NOW/TODAY)
status: observed # no canonical; per-engine values recorded but not asserted
```

`observed` covers tests where engines genuinely disagree and there's no reference answer to assert.

## Linking to a divergence

When a test illustrates a documented divergence, link to its catalogue entry:

```yaml
- subject: SORT
  name: direction-numeric
  formula: =SORT({3;1;2}, 1, -1)
  category: value
  features: [dynamic-arrays]
  expect: [[1],[2],[3]]
  overrides:
    gsheets:
      expect: [[3],[2],[1]]
      cause: arg-semantics
      recorded: [[3],[2],[1]]
  links:
    divergence: DV-0042
```

When `links.divergence` is set, keep `name:` stable. The catalogue handle is the public `subject/name` ref; fixture identity still comes from the semantic hash.

## Authoring loop

```
1. assay scaffold <FUNC> # emit starter YAML
2. edit tests/<suite>.yaml
3. assay generate -p <engine> # record fixtures live
4. assay run # check expected vs recorded
5. assay lint # catch common mistakes
```

Common mistakes the linter catches: bare error-strings (`expect: "#NUM!"` instead of `expect: { error: "#NUM!" }`); array literals without `features: [broadcasting]`; missing `subject:`, `name:`, or `formula:`.
