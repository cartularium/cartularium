# Comparison model — design exploration (2026-05-30)

> **Re-founded 2026-07-18.** This document is design history. Labels such as
> "ratified" or "charter" inside it carry no authority; governing decisions
> live in the internal decisions ledger (see
> `internal/decisions/2026-07-18-assay-refounding.md`). Where this document
> describes the no-verdict frame it remains an accurate description; where it
> conflicts with the re-founding decisions, the decisions win.

**Status: design exploration, NOT built.** This is the captured thinking from a
whiteboard session on assay's comparison/correctness model — milestone 3
("comparing fixtures") on the [assay roadmap](./assay-roadmap.md). It is
deliberately not yet an implementation plan; several load-bearing calls are
still open (flagged below). Recorded so the thinking survives to the next pass.

Builds on milestone 1 (the cell/value model — see
[`cell-value-schema-review-2026-05-30.md`](./cell-value-schema-review-2026-05-30.md)).
The premise: evidence is captured per-engine at maximum fidelity; *comparison*
is a set of read-time lenses over that evidence, not a property baked into a
test.

## 1. Fidelity is a knob — capability / circulating / terminal

> **Terminology — renamed 2026-06-15 (CANONICAL, one set, no duplicates):** the three
> rungs are **capability / circulating / terminal** (formerly Coverage / Behavior /
> Evidence). `circulating`/`terminal` is *also* the charter §1/§2 facet sorter (a facet
> survives `=A1` or it doesn't), so the rung simply *is* how far down that partition you
> compare; `capability` is the prior got-a-result gate. Canonical statement:
> `value-equality-and-fingerprint-2026-06-15.md` §1. The prose below was swept to the
> canonical terms 2026-06-16; the §1 table still names the former Coverage/Behavior/Evidence
> as the mapping, and `Kind/Detail/Evidence` in §5 is the *value-fidelity* ladder, a
> different triple.

Comparison can't be a fixed equivalence, because fidelity is a single knob and
every audience rides its whole length (technical users, non-technical users,
community writers — each wants both a low-fidelity "is there an analogous
function?" view and a high-fidelity "prove the exact semantics" view).

An earlier 5-rung detail-ordered ladder was rejected: it conflated two
different axes. The right organization is by **purpose**, three levels:

| level | question | what it distinguishes |
|---|---|---|
| **capability** (was Coverage) | "Can the engine do this at all?" | missing/unsupported (`#NAME?`, `#N/IMPL!`) vs everything that produced a result (incl. a genuine `#DIV/0!`) |
| **circulating** (was Behavior) | "Does it do the same thing?" | everything that changes *what the value does downstream* — value, type/coercion, `blank` vs `null` (null propagates through `&`), error-vs-value, date-typed vs raw serial |
| **terminal** (was Evidence) | "Can I prove / reproduce it exactly?" | *how it's represented* — `error` vs `extended-error` (same sentinel), `#SPILL!` `sub_type`/geometry, `number_format.pattern`, `value2` bytes, `raw_xml` |

**Slotting rule:** a distinction that changes *what the value does* → **circulating**;
one that only changes *how it's represented / how we know it* → **terminal**;
got-a-result-or-not → **capability**.

Still a monotonic refinement chain (capability ⊆ circulating ⊆ terminal): a split at
a lower level is a split at every higher one. These map to the three audiences'
needs and are the natural home for a reader-facing control (3 presets, likely,
not a raw dial).

## 2. "Green" = relationship stability (assay is descriptive)

Assay has **no oracle by default** — Excel and Sheets genuinely disagree and
the whole premise is to *catalogue* the disagreement, not adjudicate it. So
"output == the right answer" is incoherent as the base model. The unit of truth
is a **relationship**, not a value:

> A test is a claim: *"on this formula, at this fidelity, here is how these
> engines relate — who agrees, who splits."* **Green = the observed relationship
> still matches the documented one.** Red = an engine *moved* (a value drifted,
> a new split appeared, or a documented split vanished).

Consequences:
- Oracle-free; **drift is the degenerate N=1 case** (single-engine
  reproducibility).
- Fidelity-relative (assert the relationship *at* capability / circulating /
  terminal).
- A new test is green by construction; it reddens only when an engine later
  changes — exactly the compatibility-catalogue CI signal.
- `expect:` in its current form **dissolves**: pinning a literal value becomes
  an opt-in strict assertion, not the base model.

## 3. Canon — a set of *typed reference nodes*, where truth is unambiguous

Pure description is too absolute: some functions have unambiguously correct
behavior (`1+1=2`) and an engine that disagrees is *wrong*, not merely
divergent. Canon is folded in as an **optional reference node in the
relationship** — a participant whose value is *declared/derived* (correct)
rather than *observed*. "Correct" = "agrees with the canon node," computed by
the same grouping machinery. Canon lives at **capability and circulating only, never
terminal** (there is no canonically-correct `raw_xml`).

Canon is **not one oracle per function** — it's a *set of typed nodes per case*,
because a function has a core (clear) and edges (contested), from different
sources:

- **`universal`** — objective math/semantics. **Computable** for pure math
  (`SQRT(4)` → assay calculates `2`); zero authoring.
- **`origin:<engine>`** — the inventor defines correct (`FILTER`→Excel,
  `QUERY`/`GOOGLEFINANCE`→Sheets). Canon = the origin engine's *live* evidence;
  others' correctness = "matches origin." Derived from a per-function origin
  map — **per-case authoring is zero**; provenance attaches to the *function*,
  which is mostly already-known/derivable. The large, cheap bucket.
- **`spec:<standard>`** — ECMA-376 / ODF. Available but expensive; selective.
- **`consensus`** — emergent (N majors agree). Derived, computed, and **clearly
  labeled soft** — never promoted to hard canon (the majority can be wrong).

Correctness is therefore not binary — it's *which references an engine aligns
with*. Where references disagree (spec says X, de-facto Excel does Y), **the
disagreement is the documentation** (a documented fork, great pedagogy), not a
problem to resolve. The "define a shared core by committee" option was rejected
as normative-by-fiat; every canon source here is objective, attributed,
published, or emergent — never decided in a room.

Hierarchy: **declared/computed canon > consensus (soft) > pure divergence.**

Nice properties of origin-canon: the origin engine is *tautologically* correct
for its own functions; canon is a *live* reference, so if the owner changes a
function (Excel updates `FILTER`), the canon moves and laggards surface
automatically; and the origin tag also structures the capability map (owner + who
caught up).

## 4. Annotation (`cause`) → mostly derived

Given green = relationship-matches-documentation, the annotation unit is a
**documented divergence** (`{fidelity, partition, why}`), not "a platform's
deviation from a canonical value." And the *category* falls out of the rung
where the split first appears:

- split at **capability** → "missing function" — **mechanically detectable**, no
  annotation needed.
- split at **circulating** → behavioral divergence (coercion / null-semantics /
  error-vs-value) — category derived; only the prose *why* is authored.
- split only at **terminal** → representation divergence — usually self-evident.

So the hand-authored layer shrinks to its irreducible core (prose, only for
non-obvious behavioral splits). Today's flat `overrides[].cause` enum mixed all
three levels and was attached to every override; the principled version is
strictly more principled *and* less authoring. Open question: how much of
`cause` becomes derived vs stays an annotation vocabulary.

## 5. Capture-side dependencies (driver/runner — milestone 2 overlap)

A rung only resolves as high as the driver *captured*; the read-side model has
hard capture-side dependencies:

- **Per-cell volatility flagging — forced by green=drift-free.** A
  `NOW()`/`RAND()`/`TODAY()` cell is perpetually red unless volatility is a
  captured property the comparison can exclude. (We already hand-filtered
  volatile drift out of fixtures — that manual step is exactly this gap.)
  Shovel-ready and self-justifying.
- **Missing-function capture signal** — makes capability *derivable* rather than
  hand-authored (ironcalc `#N/IMPL!`, pycel exceptions expose it; others bury
  it in `#NAME?`/`#REF!`).
- **Function extraction per case** (parse formula → functions invoked) — feeds
  coverage-by-function and the origin-map join.
- **Raise the stub-engine capture ceiling** (the deferred per-engine audits):
  the 6 lifted engines emit only Value-level scalar, so Kind/Detail/Evidence
  are unreachable for them — the audits *raise the top of the knob*, not just
  "add fields."

## Experience sketch (future — sheets.wiki / assay.sheets.wiki)

- **Reader (sheets.wiki function page):** progressive disclosure. Land on
  capability ("✅ Excel/Sheets/Lattice · ❌ ironcalc/pycel"); descend to circulating
  (where the supported ones disagree) → terminal (exact proof). Likely 3 named
  presets ≈ capability / circulating / terminal.
- **Editor (assay.sheets.wiki):** authors capture runs (evidence) and annotate
  only the non-obvious splits; they do not set fidelity.

## Open questions (parked for the milestone-3 pass)

1. **Where does the function→origin map live?** Does sheets.wiki's function
   metadata already encode "introduced by / origin" (→ origin-canon is nearly
   free), or is it a small registry to seed? This is the linchpin for the whole
   canon layer.
2. **Default assertion fidelity** — when an author captures a formula, what does
   a test assert by default: capability, or circulating?
3. **Does `expect:` fully dissolve** into evidence + drift + annotation, or
   survive as an opt-in strict (terminal-level) assertion?
4. **Reader control** — 3 named presets vs a raw rung dial.
5. **Descriptive vs consensus** — keep green purely "stable + documented," with
   consensus only a soft derived hint?
