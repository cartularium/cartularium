# Google Sheets calculation limits — live deep dive (2026-07-11)

Method: live probing via the assay **gsheets driver** (`@cartularium/drivers`, `createDriver("gsheets", …)`)
plus raw Sheets API for the custom-grid spill probes. Boundary-pair method throughout: a claimed
limit N is verified by observing the value at N and a failure (`#ERROR!` / `#VALUE!` / server error)
at N+1. Every probe returned a 1×1 scalar (formulas wrapped in `ROWS` / `LEN` / `REDUCE`) so reads
stayed cheap.

- **Scratch spreadsheet (manual cleanup — no drive scope to delete):**
  `1OCPDxnyEvc0hXyn6iZzLCRIYXajMW4zHuaB5wh30Rhs` (title "assay-calc-limits-2026-07-11").
- Plus 1 orphaned wedge-recovery throwaway spreadsheet per host-wedge event (the nesting probes,
  section D — the driver's D4 recovery creates a fresh spreadsheet it can't delete without
  `drive.file` scope).
- ~190 probes total. Wall clock per probe: 2–5 s typical; the 10M-element array probe 8.7 s; a
  host-wedge probe ~11 s (3 retries). **No probe approached the 60 s red-flag line; none aborted.**

## Calibration

| Probe                                                  | Wall clock |
| ------------------------------------------------------ | ---------- |
| `=1+1`                                                 | 2.4 s      |
| `=ROWS(MAP(SEQUENCE(1000),LAMBDA(x,x+x)))`             | 3.5 s      |
| `=ROWS(MAP(SEQUENCE(666664),LAMBDA(x,x+x)))`           | 4.4 s      |
| `=ROWS(MAP(SEQUENCE(10000000),LAMBDA(x,)))` (heaviest) | 8.7 s      |

Per-probe budget derived: ~5 s expected, 60 s hard red flag. Held for the entire run.

---

## Section A — the call-count model: **28/28 boundary pairs confirmed exactly**

Every claim in the wiki's call-count model reproduced live to the exact element. The model
`limit N = floor((2,000,000 − overhead) / body_cost)` is correct in every particular tested.

### Overhead constants (each pinned by a value-at-N / #ERROR!-at-N+1 pair)

| HOF                | Claimed overhead | Boundary probe                                           | Result                     |
| ------------------ | ---------------- | -------------------------------------------------------- | -------------------------- |
| `MAP` (1 array)    | 7                | `map(sequence(1999993),lambda(x,x))`                     | 1999993 / +1 → `#ERROR!` ✓ |
| `MAP` (2 arrays)   | 10               | `map(sequence(1999990),sequence(1999990),lambda(a,b,a))` | 1999990 / +1 → `#ERROR!` ✓ |
| `MAP` (3 arrays)   | 13               | `map(seq(1999987)×3,lambda(a,b,c,a))`                    | 1999987 / +1 → `#ERROR!` ✓ |
| `REDUCE`           | 8                | `reduce(,sequence(1999992),lambda(a,b,b))`               | 1999992 / +1 → `#ERROR!` ✓ |
| `SCAN`             | 9                | `scan(,sequence(1999991),lambda(a,b,b))`                 | 1999991 / +1 → `#ERROR!` ✓ |
| `BYROW` (seq(n))   | 7                | `byrow(sequence(1999993),lambda(r,r))`                   | 1999993 / +1 → `#ERROR!` ✓ |
| `BYROW` (seq(n,1)) | 8                | `byrow(sequence(1999992,1),lambda(r,r))`                 | 1999992 / +1 → `#ERROR!` ✓ |
| `MAKEARRAY`        | 8                | `makearray(1999992,1,lambda(r,c,r))`                     | 1999992 / +1 → `#ERROR!` ✓ |

### Body-cost rules (all via MAP overhead 7)

| Rule                             | Body                    | Claimed cost / limit | Result                     |
| -------------------------------- | ----------------------- | -------------------- | -------------------------- |
| Operators desugar (`add`=1)      | `x+x`                   | 3 / 666664           | ✓                          |
| Left-assoc chaining              | `x+x+x`                 | 5 / 399998           | ✓                          |
| Literal _called_ costs 1         | `n(1)`                  | 2 / 999996           | ✓                          |
| IF costs 2                       | `if(x,x,x)`             | 5 / 399998           | ✓                          |
| IF branch value pass-through     | `if(x,1,x)`             | 4 / 499998           | ✓ (literal branch skipped) |
| IF non-taken branch = root only  | `if(false,x+x+x+x+x,x)` | 5 / 399998           | ✓                          |
| LET binding value pass-through   | `let(y,1,y)`            | 5 / 399998           | ✓                          |
| LET binding value _called_       | `let(y,x,y)`            | 6 / 333332           | ✓                          |
| IFERROR costs 1, fallback called | `iferror(x,1)`          | 3 / 666664           | ✓                          |
| LAMBDA call overhead 2           | `lambda(y,y)(x)`        | 6 / 333332           | ✓                          |

### SWITCH — both compiled forms confirmed

| Form                               | Body              | Claimed cost / limit | Result |
| ---------------------------------- | ----------------- | -------------------- | ------ |
| 3-arg (overhead 2; case costs 2)   | `switch(x,x,x)`   | 6 / 333332           | ✓      |
| 3-arg, case literal skipped        | `switch(x,1,x)`   | 4 / 499998           | ✓      |
| 3-arg, val literal skipped         | `switch(x,x,1)`   | 5 / 399998           | ✓      |
| 4-arg (overhead 3)                 | `switch(x,x,x,x)` | 7 / 285713           | ✓      |
| 4-arg, case skipped (pass-through) | `switch(x,1,x,x)` | 6 / 333332           | ✓      |
| 4-arg, default always called       | `switch(x,x,x,1)` | 7 / 285713           | ✓      |

The wiki's structural claim — 3-arg and 4-arg SWITCH cost their arguments differently — reproduces
exactly. In 3-arg the case carries an implicit no-match cost (2) while expr/val are pass-through; in
4-arg the case becomes pass-through and expr/default are always called.

### REDUCE/SCAN init boundary

`reduce(0,sequence(1999992),…)` (literal init, pass-through, overhead 8) → 1999992, while
`reduce(n(0),sequence(1999991),…)` (init is an expression that must be evaluated, overhead 9) → 1999991. The one-element difference is exactly the extra call for evaluating `n(0)`. ✓

**Section A verdict: 28 confirmed, 0 drifted, 0 refuted.** The model needs no correction.

---

## Section B — the headline constants

- **2,000,000 call limit: confirmed, inclusive.** MAP overhead 7 + 1,999,993 body-cost-1 elements =
  exactly 2,000,000 calls and works; one more element → `#ERROR!`. The call limit is reached at
  exactly 2,000,000 and the sentinel is `#ERROR!`.
- **10,000,000 array limit: confirmed, inclusive — with a refinement on the error.**
  `rows(map(sequence(10000000),lambda(x,)))` → 10000000 (works); `sequence(10000001)` → **`#VALUE!`**.
  So the array-size limit is exactly 10,000,000, but exceeding it produces **`#VALUE!`**, not the
  `#ERROR!` that the call/stack limits produce. The wiki's opening line ("If either limit is reached
  the formula … outputs `#ERROR!`") refers to the call and stack limits; the array limit is a
  distinct error class.
  - The earlier surprising `1` from `rows(map(sequence(10000001),lambda(x,)))` is an artifact: MAP
    receives the 1×1 `#VALUE!`, maps the empty body over that single cell, and ROWS reports 1 row.
    With a non-empty body the `#VALUE!` propagates.
- **"Array limit binds first" for an empty body: confirmed.** `map(sequence(3000000),lambda(x,))`
  (empty body, body cost 0) returns 3000000 even though 3,000,000 > the 2,000,000 call limit —
  because a cost-0 body never accrues per-element calls, so only the array limit applies.

---

## Section C — the stack limit

Self-applying LAMBDA `=LAMBDA(f,n,IF(n<=0,0,f(f,n-1)))(self, depth)` (cheap per-level body so the
call limit stays far away):

| depth                      | result        |
| -------------------------- | ------------- |
| 9998, 9999                 | `0` (success) |
| 10000, 10001, 12000, 20000 | `#ERROR!`     |

**Stack limit = 10,000, confirmed.** The boundary is clean at recursion depth 10000. This is
definitively the stack limit and not the call limit: at depth 10000 the formula has made only
~70k function calls (~7/level), two orders of magnitude below the 2,000,000 call limit. The sentinel
is `#ERROR!`, same as the call limit — the two are distinguished by which resource is exhausted, not
by the error text.

---

## Section D — undocumented-on-the-page limits (newly established)

| Limit                      | Boundary                                     | Failure mode                                               |
| -------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| **Formula text length**    | ≥ 2,000,000 chars accepted                   | none observed — writes not rejected                        |
| **Function nesting depth** | ~280 (280 OK, ~283+ fails)                   | **server-side HTTP 500** (host wedge), not a formula error |
| **Argument count**         | no independent cap (`SUM` of 24,000 args OK) | bounded only by formula length                             |
| **Computed string result** | 50,000 chars (50000 OK, 50001 → `#VALUE!`)   | `#VALUE!`                                                  |
| **REPT output**            | ~32,000 (32000 OK, 32100 → `#VALUE!`)        | `#VALUE!`                                                  |
| **Literal string value**   | ≥ 500,000 chars stored                       | none — literals are not capped at 50,000                   |
| **SEQUENCE / spill**       | 10,000,000 (the array limit)                 | `#VALUE!`; spill auto-grows the grid                       |
| **Numeric overflow**       | max double ~1.7977e308                       | `#NUM!`, never Infinity                                    |

Detail:

- **Formula length.** `=LEN("x…x")` with total text up to 2,000,000 chars is accepted and returns
  the length. The documented "50,000 characters per cell" limit does **not** cap formula text.
- **Nesting depth.** `=ABS(ABS(…ABS(1)…))`: 10–280 deep return `1`; from ~283 deep the Sheets API
  returns HTTP 500 "Internal error encountered" — gsheets' evaluation server crashes rather than
  returning a formula error. The driver's wedge recovery (D4) handled it each time and the host
  survived (health-checked with `=1+1` → 2 between rounds). The exact cutoff is slightly
  non-deterministic (280 OK, 283 failed across runs), consistent with a server call-stack limit.
- **Argument count.** `=SUM(1,1,…,1)` with 255, 256, 1000, 10000, 20000, 24000 args all return N.
  No Excel-style 255-argument cap; the only ceiling is the (very high) formula-length limit.
- **String caps.** A _computed_ string result (`CONCATENATE`, `TEXTJOIN`) caps at exactly 50,000
  chars (`#VALUE!` above). `REPT` caps lower, at ~32,000 (its own function-specific limit). But a
  _literal_ string value (`="aaaa…"`) stores to at least 500,000 chars — the 50,000 cap is on
  function-produced strings, not on literal entry.
- **SEQUENCE / spill.** The SEQUENCE size ceiling is the 10,000,000 array limit (`sequence(10000001)`
  → `#VALUE!`). Spilling past a sheet's current grid does _not_ produce `#REF!` from bounds: gsheets
  auto-grows the grid (SEQUENCE(51) on a 50-row sheet grew rowCount to 551 and filled all 51 cells;
  SEQUENCE(200) grew it to 700). `#REF!` only appears when the spill target already contains data.
  (First spill run produced spurious `#REF!` because the between-probe clear wrote empty strings into
  the target cells, which gsheets treats as data — the fresh-sheet re-run corrected this.)
- **Numeric overflow.** `POWER(10,308)` = 1e308, `POWER(10,309)` = `#NUM!`; `2^1023` OK, `2^1024` =
  `#NUM!`; the max double `1.7976931348623157E308` OK, ×2 = `#NUM!`; `-1E308*10` = `#NUM!`. gsheets
  never yields Infinity — overflow is always `#NUM!`.

---

## Section E — optional: per-cell budget independence

Two `=rows(map(sequence(1999993),lambda(x,x)))` cells (each at the 2,000,000 call limit) co-hosted on
the same sheet both returned 1999993. Section A already ran up to four near-2M formulas co-tiled on a
shared host with all correct. **Each cell has its own independent 2,000,000 budget — confirmed.**
(Iterative-calculation interaction was not probed; noted as future work.)

---

## Summary verdict counts

| Section                   | Confirmed | Drifted | Refuted | Red-flagged | New limits established                     |
| ------------------------- | --------- | ------- | ------- | ----------- | ------------------------------------------ |
| A (call-count model)      | 28        | 0       | 0       | 0           | —                                          |
| B (2M / 10M constants)    | 3         | 0       | 0       | 0           | array-limit error = `#VALUE!` (refinement) |
| C (stack limit)           | 1         | 0       | 0       | 0           | —                                          |
| D (undocumented)          | —         | —       | —       | 0           | 8                                          |
| E (per-cell independence) | 1         | 0       | 0       | 0           | —                                          |

The wiki's model was **already accurate**; the value added is confirmation to the exact element, the
`#VALUE!`-vs-`#ERROR!` distinction for the array limit, and section D's newly-measured limits.
