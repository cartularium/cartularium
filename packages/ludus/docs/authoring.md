# Authoring problems

One YAML file per problem in `problems/`, and it is the single source: the
template spreadsheet, the site page, the oracle's expected outputs, and the
worker's problem bundle are all generated from it. Nothing downstream is
hand-edited. `src/problem-types.ts` is the schema authority; this doc is the
judgment that the schema can't carry.

## Setup

Authoring CLIs run as **judge@cartularium.org** (token in `~/.ludusrc.json`,
OAuth client at `credentials.json`). If the token is missing or stale:
`pnpm --filter @cartularium/ludus run login` — the `run` is required; bare
`pnpm login` collides with pnpm's builtin.

## Identity

A problem's public identity is a monotonic number: `ld-NNNN`. Numbers are
allocated when a problem is *accepted into the corpus*, and never reused — a
deleted problem retires its number and leaves a gap (Codeforces and Project
Euler both carry dead numbers without harm). Candidates that haven't earned a
number yet live in `problems/drafts/` — both build scripts read `problems/`
non-recursively, so drafts never reach the site or the worker. Cull drafts
freely; that churn never touches the id space.

The URL uses the slug, not the number (`/problems/combine-skus/`) — LeetCode's
split: number for identity and speech, slug for the address. Filename is both:
`ld-NNNN-slug.yaml`.

Content-hash identity was considered and rejected: problems are mutable
documents — re-oracles rewrite `expected`, statements get reworded, grades get
recalibrated — and identity has to survive all of that, because submissions,
stored programs, and the future Rasch attempt log all key on it. A hash gets a
different job instead: the `verified` stamp below fingerprints the oracle
surface so staleness detection is mechanical.

## The loop

1. **Draft the YAML.** In `problems/drafts/` until it's corpus-worthy; mint the
   next `ld-NNNN` and move it up on acceptance. Everything except
   `cases[].expected`, `template.spreadsheetId`, and `verified` — tooling owns
   those three.
2. **Oracle.** `pnpm --filter @cartularium/ludus oracle problems/<file>.yaml`
   runs `reference` through the judge machinery per case and writes `expected`
   plus the `verified` stamp (date + oracle-surface hash) back into the file.
   Inspect the printed scratch URL when a case looks wrong. Never hand-edit
   `expected` or `verified`; re-run the oracle.
   `pnpm oracle --check problems/*.yaml` is the staleness sweep: it recomputes
   each hash offline and exits nonzero if any surface changed since its last
   oracle run — the drift-discipline entry point.
3. **Template.** `pnpm --filter @cartularium/ludus template problems/<file>.yaml`
   creates the styled judge-owned template (design language:
   `src/template-style.ts`) and writes its id back. Prints the `/copy` link.
   Open the template and read the About tab — statement rendering problems show
   up here first.
4. **Self-test.** Store a legitimate solution using a *different technique*
   than `reference` in `selftest.alt`, then
   `pnpm --filter @cartularium/ludus selftest problems/<file>.yaml`.
   It runs both mandatory acceptance checks through the real judge:
   - The alt-technique solve must be accepted (ld-0004: SUMPRODUCT against a
     SUMIF reference; ld-0007: fixpoint iteration against MINVERSE). This is
     what proves the problem is solvable off the reference path and exercises
     statement clarity, the compare policy, and lint.
   - The sample answer hardcoded into OUTPUT must pass the sample and fail
     the hidden cases. If it passes hidden, the hidden cases are too close to
     the sample.
   Failing sheets are kept and linked for inspection. Solving your own copy
   by hand on top of this is encouraged, not required.
5. **Redeploy both surfaces.** Template regeneration mints a new spreadsheet
   id, so the deployed site's copy links go stale until
   `LUDUS_SERVICE_URL=<worker-url> pnpm build:site` +
   `wrangler pages deploy public --project-name ludus`. The worker bundles
   problems at deploy time: `pnpm build:worker-problems`, then
   `wrangler deploy`. This coupling has bitten once already; treat regenerate
   and redeploy as one action.

## Fields

**id / slug / filename.** See Identity above. `slug` must be unique — it is
the page address.

**verified.** Oracle-owned: `asOf` is the date the reference last ran against
live Sheets; `hash` fingerprints reference + template ranges + case inputs.
Compare policy and prose are deliberately outside the hash — changing them
doesn't stale the oracle run. CI recomputes the hashes on every ludus change
(the staleness sweep in `ludus-build.yml`).

**selftest.** `alt` holds the alternative-technique solution that
`pnpm selftest` submits. It is corpus material like `reference` — keep it
working, and keep its technique genuinely distinct. Outside the oracle
surface: editing it doesn't stale `verified`.

**difficulty.** The hand-grade prior: an open-ended integer, no cap
(climbing-grade model — recalibrate as the corpus ceiling rises). Users only
ever see the banded block meter. The three-layer system (Rasch estimator,
hand prior, banded display) is spec §4.

**requires.** Prerequisite knowledge, not difficulty — the community ladder:
`arrays`, `query`, `lambda`, `recursion`, `algorithmic`. Answers "can I
attempt this yet?" so the difficulty number doesn't have to.

**attribution.** Required for adapted problems; rendered on the About tab and
the site page.

**statement.** Rendered on the site page and the About cover. Say explicitly
what the solver may assume: row-order freedom, blank handling, whether input
blocks vary in size. The one universal rule the template already teaches:
*when the grader swaps INPUT, everything must still work.*

**challenges.** Informational categories (`oner`, `lambdaless`, `golfed`),
rendered as chips with About-tab descriptions (`CHALLENGE_NOTES`). Not
enforced by lint today.

**reference.** The reference solution formula; the oracle places it at
OUTPUT's top-left. It runs in an API-created scratch sheet, so external-class
functions fail there.

## Grid conventions

- `template.input` and `template.output` are fixed rectangles that become the
  INPUT/OUTPUT named ranges. The judge pours data in one end, reads the other,
  and never looks anywhere else.
- INPUT is judge-owned and overwritten wholesale each case. A user formula
  inside it is a lint reject, not a silent clobber.
- Leave a blank margin row and column around INPUT — for block labels and air.
  wp-0001 put INPUT at A1 and had no room for the community original's
  per-block month labels.
- Size OUTPUT to cover the largest expected extent across all cases.
  Comparison trims trailing blanks, so oversizing is free (wp-0001 uses
  `Answer!A2:D40`).
- `answerHeaders` are template-owned: rendered inside the blue border, above
  the graded region, never graded. To grade headers instead, omit
  `answerHeaders` and put the header row in `expected`.
- The expected-sample self-check block renders two columns right of OUTPUT,
  rows aligned; its label needs OUTPUT to start below row 1.

## Cases

At least one `sample` case is required — the template pre-fills the first one
into INPUT and places its expected output in the gray self-check block.

Disclosure rule: sample failures show the full diff; hidden failures show
only the case number and a coarse category. Design hidden cases accordingly —
they are the anti-hardcoding mechanism, so vary what a hardcoder would have
fixed: row counts, group counts, value ranges. Include at least one
degenerate case (wp-0001's is a single SKU across all blocks).

Hidden cases are readable in this public repo. That is deliberate
(open-solutions posture, 2026-07-18): "Accepted" means *generalizes*, not
*unseen* — surprise is pedagogy, not security. Do not advertise them on any
rendered surface; `site/build.mjs` and the API boundary already redact them.

## Comparison policy

Implemented knobs, from `src/compare.ts`:

- `numbers.epsilon` — relative comparison, denominator
  `max(|expected|, |actual|, 1)`.
- `rowOrder` — `exact` or `any`. `any` sorts both sides canonically; numeric
  sort keys are rounded just beyond epsilon so float noise can't reorder rows.
  The community sheets' sort-both-sides self-checks map to `any`.

Fixed behavior, not knobs: blank cells equal empty strings; trailing blank
rows/columns are trimmed before the shape check; any error cell in the output
when none is expected fails as `error-in-output`; errors are matched by
rendered prefix (the API renders them as `#N/A (message…)`).

The spec sketches more knobs (date serial-vs-rendered, text case, error
class). They are unimplemented — add one when a problem needs it, not
speculatively.

## Lint

`lint.ban` classes, from `src/judge.ts`:

- `volatile` — NOW, TODAY, RAND, RANDBETWEEN, RANDARRAY.
- `import` — the IMPORT* family.
- `external` — IMAGE, GOOGLEFINANCE, GOOGLETRANSLATE, DETECTLANGUAGE. These
  are an exfiltration channel, and IMAGE errors `#REF!` in API-created sheets
  regardless.

Default all three on. An unknown class name throws at judge time, so typos
fail loudly. Lint rejects cost zero API writes — they are also the abuse
filter, so don't loosen bans casually.

## Dialect traps

Found while authoring the first seven problems; check reference formulas
against these before blaming the judge:

- Array `/` (and other elementwise operators) don't broadcast without
  ARRAYFORMULA.
- Scalar functions over array arguments (MID, LEFT, IF…) don't vectorize
  inside FILTER conditions or LET bindings either — and can fail *silently*
  with plausible-looking output rather than erroring (cost ld-0006 an oracle
  run of wrong RLE encodings). Wrap the expression in ARRAYFORMULA.
- LET rejects binding names that parse as cell references: `c1`, `A`, `B`,
  `I`, `V` all fail with "not a valid name". Worse, names that merely *look*
  ref-shaped — impossible refs like `d0`/`fr0` (row zero) or real addresses
  like `nb1` — kill the whole formula with a bare "Formula parse error".
  Use pure words, no trailing digits.
- An unbalanced paren also surfaces only at evaluation time, as the same
  unhelpful "Formula parse error" (one missing closer cost a six-probe
  hunt). `oracle --check` lints paren balance for `reference` and
  `selftest.alt` offline — run it before blaming anything else.
- CHAR of a control code returns an *empty string* — `LEN(CHAR(30)) = 0` —
  so control characters can't be marker delimiters (SPLIT then errors with
  "parameter 2 value should be non-empty"). Use printable glyphs the data
  can't contain (`◆`, `◇`).
- SUMIF/COUNTIF require real ranges; passing computed arrays errors.
- `values.get` renders errors with an appended message; the judge
  prefix-matches, but anything string-comparing against error text must too.
