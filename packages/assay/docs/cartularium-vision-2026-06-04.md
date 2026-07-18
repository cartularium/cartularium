# Cartularium vision & architecture — re-grounding, 2026-06-04

A step-back from the measurement work to nail the relationship between the projects and the core
architecture bets. Companion to [`bridge-translation-2026-06-02.md`](./bridge-translation-2026-06-02.md)
(which this supersedes as the *strategic* frame; that doc remains the measurement-method record) and the
empirical passes (`archive/divergence-measurement-*-2026-06-03.md`).

## 1. The vision (the core branch)

A **centralized, cross-platform hub for logic and knowledge-sharing.** Leapfrog platform-local; go
directly to cross-platform. The product is a chain of questions, each answered by a project:

- **Share knowledge** → **sheets.wiki**
- **Share work** → **formulary** (registry for Sheets named functions; `formulary.dev`)
- **Make shared work run everywhere** → **interleaf** (cross-dialect translation)
- **Guarantee that guarantee** → **assay** (compatibility evidence)
- **Find stuff** → formulary.dev / discovery (later)

**lattice is future** — a months-to-years bet, deliberately separate. The current branch is
assay/formulary/interleaf/sheets.wiki.

## 2. The parts (full map)

- **Monorepo packages:** assay, interleaf, contracts (owns the cross-property **schema**, incl. the
  compatibility-feed shape — see `packages/contracts/INTERLEAF-COMPATIBILITY.md`), sheets-wiki,
  sheets-wiki-editor, edit-shell (Cloudflare worker for inline contribution; **hosts the `assay-runner`
  job queue**), chrome, brand, cartularium-org.
- **Sibling repos:** lattice (engine; site latlang.org), formulary (registry; formulary.dev).
- **Properties:** cartularium.org · sheets.wiki · assay.sheets.wiki · formulary.dev · latlang.org.
- **The star:** assay produces evidence → contracts defines the feed (`FormulaCompatibilityManifest`:
  function → per-platform `native/absent/partial/external-service/context-required` + evidence refs) →
  consumed by interleaf (translation), formulary (distribution), sheets.wiki (human-readable badges);
  edit-shell+editor are the contribution loop; chrome/brand/cartularium.org are the shared skin.

## 3. The drivers are the floor (the key reframe)

Everything is a **chain of trust** that bottoms out in one capability: *run this on the real engine and
observe.* formulary's "works everywhere" ⟸ interleaf's translation ⟸ the corpus it's tested on ⟸ the
drivers that produced it. So the drivers are not an assay detail — they're the ground truth the whole
stack stands on, which is **why they extend through everything.**

- **Extract + name them as a standalone foundation.** Internal cartularium substrate (not a
  separately-marketed product), but **public by default** (the whole project is public).
- **Likely the broadest-value artifact + the moat:** "run any formula on any real engine and read back
  everything, *including what the official APIs hide*." The **Playwright** direction (drive the actual
  gsheets UI) is exactly this — observe renders/error-forms/recalc/spill the API can't expose.
- **Harden first.** This session's bugs — Excel **batch contamination**, the **type-faithful-seeding**
  confound — are *cracks in the floor*; every guarantee above inherits them. The foundation must be solid
  before anything above it is trustworthy.
- **Build order is bottom-up:** drivers → assay evidence+feed → interleaf → formulary; sheets.wiki
  alongside. lattice plugs in at the bottom later (a new driver spoke + a new interleaf dialect) — it
  doesn't change the ladder.

## 4. The guarantee model

- **Continuously empirically verified, not proven.** Foreign ground (Excel/Sheets unowned, moving) ⇒
  test-not-prove; tests expire on engine updates. Framed right this is a *strength*: a living
  certification that re-runs the real engines and catches the day an update breaks something — which is
  what makes the drivers a *recurring, defensible* asset, not a one-time artifact. Sell as **"certified
  compatible as of <engine versions>, monitored"** — never "proven."
- **Codification, not discovery (the maintainer's key insight).** The divergences are already known to
  the maintainer and the community; they have **never been codified, empirically validated, or persisted
  publicly.** assay's product is the *first reproducible, persistent, public, evidence-backed* record of
  compatibility, tracked across engine versions. (This recontextualized the measurement session as
  somewhat premature — see §9.)
- **assay is descriptive, not normative.** It states what each engine does, with evidence. Carve-ability
  / translatability judgments belong to interleaf, downstream.

## 5. interleaf = thin phrasebook, not a separate semantics component (terminal decision)

The session's central question: does interleaf need *another thing with semantics* to consume, or can it
stay thin (phrasebooks for dialects)? **Answer: stay thin — no separate semantics component.**

- interleaf = an **AST-level rewriter** over its surface grammar (`FormulaExpr`) — node-level rewrite
  rules + caveat emission + a *few targeted light static analyses* (array-context propagation,
  error-flow). NOT a flat text phrasebook (too brittle); NOT a full semantic IR (infeasible vs foreign
  ground).
- **The drivers ARE the semantics oracle** — verify a translation by running both and comparing, not by
  modeling meaning.
- The jobs that truly need *owned, provable* semantics — **vendor-independent/offline execution** and
  **provable optimization** — are **lattice's**, by definition. interleaf consumes lattice *later*, only
  for those payoffs.
- **Empirical support:** every divergence measured is node-level (rewrite-or-flag). The only thing
  pushing past a flat phrasebook is array-context dataflow — and because there are no types, even that
  analysis is bounded (falls back to wrap-always or flag, drivers verify).

## 6. Correctness taxonomy (refined by the maintainer's corrections)

- **No types in Excel/Sheets ⇒ the statically-detectable category is small** — only *literal tokens in
  the formula text* (function names, literal operators/flags, a literal regex string). Anything about
  runtime *values* (a cell's type, found/not-found, what an array contains, a pattern read from a cell)
  is **not** statically knowable. (So earlier "array-of-lambdas is detectable" was wrong — there are no
  types to detect it from.)
- **"Detectable" ≠ "cheaply fixable."** Faithful-fix cost spans trivial (rename `REGEXMATCH`→`REGEXTEST`)
  → intractable (a faithful Sheets translation of an Excel lookahead-regex ≈ *building a lookahead engine
  in RE2-legal formula text*). Past a threshold it collapses into capability-gap territory regardless of
  detectability.
- So the real partition is **cheap-faithful-rewrite (small) vs. best-effort-with-loud-caveats
  (everything else)** — the latter folding together the runtime-undetectable *and* the
  detectable-but-intractable. array-of-lambdas (no faithful target + undetectable) and lookahead-regex
  (intractable fix) both land in best-effort + loud caveats.
- **Cardinal rule: never silently mistranslate.** Cautionary case: `SORT(r,1,-1)` → Excel descending,
  Sheets ascending, *no error*. Silent best-effort converts a visible incompatibility into an invisible
  wrong answer. Detect-and-rewrite the cheap; flag the detectable-but-unfaithful; refuse capability gaps;
  silence is never an option.

## 7. bridge-now vs lattice-first → bridge now, star-shaped

- **Reject lattice-first.** Not just because lattice is years out: its superset AST is the *wrong layer*.
  Excel↔Sheets bridging is overwhelmingly surface-syntax + behavioral-flagging (interleaf's surface
  grammar), NOT lattice's computation/evaluation AST — they're *complementary layers*. Parsing
  Excel/Sheets into lattice's semantic AST is a different, harder, lossier job; lattice-first wouldn't
  even save the work it appears to.
- **Do pairwise Excel↔Sheets now** (n=2; pairwise beats a hub). Insurance against a future overhaul is
  cheap: keep interleaf's per-dialect parse/print/lower modules cleanly separated ⇒ adding lattice later
  is *adding a spoke*, not a rewrite. **Star-shaped architecture, pairwise content, hub deferred.**

## 8. formulary's guarantee is scoped, not binary

Per-package, per-platform: "Excel+Sheets, certified as of X" / "Excel-only (uses arrays-of-lambdas)" /
"works, regex lookahead degraded." Computed bottom-up (interleaf translatability + assay evidence +
drivers ground truth). **The rabbit hole has a floor: honest scoping — detect and disclose, don't solve
every incompatibility.**

## 9. What this means for the measurement work (cart before the horse)

The `assay measure` work was a useful *tool-build* but partly premature: (1) it produced **normative
portability verdicts** (`IRREDUCIBLE`/`EXPLICIT_BRIDGE`) — that's interleaf's downstream call, and pulls
assay out of its descriptive lane; (2) it was framed as *discovery* when the value is *codification*. The
**harness (probe families → run real engines → rich evidence) is the right apparatus** — but it should
feed assay's persistent codified catalogue + the contracts feed, not emit translation judgments. The
bugs found (contamination, seeding) are foundation cracks to fix in the drivers.

## 10. Resume point (morning)

Decided this session (§3–8). The agreed concrete **next move is the drivers as a named, hardened,
standalone foundation** — ahead of more measurement and ahead of interleaf bridge work. Open threads:
1. **Drivers:** extraction target/name; the Playwright integration for gsheets (beyond-API observation);
   fix the contamination + type-faithful-seeding cracks.
2. **Reposition the measurement harness** to feed the codified catalogue/feed (descriptive evidence),
   dropping the normative verdict layer.
3. **The feed schema** (`contracts` `FormulaCompatibilityManifest`): does formulary need more than
   function-level support — scoped per-package guarantees, named-function dependency graphs?
4. Re-confirm prior batched Excel results in isolation (contamination caveat).
