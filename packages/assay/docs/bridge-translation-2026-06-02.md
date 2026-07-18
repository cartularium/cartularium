# Bridge / translation foundations — 2026-06-02

Re-grounding the assay·interleaf·lattice architecture **from the deliverable end**,
not from the parts we already have. Companion to
[`architecture-map-2026-05-31.md`](./architecture-map-2026-05-31.md) (the grounded
parts-map this session deliberately stepped back from),
[`comparison-model-design-2026-05-30.md`](./comparison-model-design-2026-05-30.md),
and [`value-model-foundations-2026-05-30.md`](./value-model-foundations-2026-05-30.md).

This session did **not** decide to build anything. It re-derived the goals, located
the one real architectural bet, argued that bet is **premature**, and bottomed out
at a sober doubt about whether the whole translation direction is worth it. Read §0
first — it's the resume point.

---

## 0. The resume point — the sober doubt (start here tomorrow)

The honest value proposition of cross-platform formula translation may be weak:

> "Use this to make your formula several times longer and unreadable, but more
> likely to survive a copy-paste across platforms."

And we can offer **no strong guarantees**. The ground (Excel, Sheets) is foreign,
opaque, unspecified, and *moving* — so we can **test but never prove**, and tests
**expire** when the engines update. Before committing to any of the structure
below, tomorrow should confront: *is this juice worth the squeeze, and for whom?*

The de-risking move that does **not** require resolving that doubt — and is valuable
on every path — is the **divergence measurement** (§7). Do that first regardless.

---

## 1. The goals, re-derived

1. **A better platform = lattice.** (the product)
2. **Still work with Excel & Google Sheets, and improve those experiences where we
   can.** A *separable* goal.
3. **Build bridges** — share/manage logic, both lattice↔others and others↔others.

Bridges have **two separable problems**:
- **Translation** — dialects are often incompatible. (this session's subject)
- **Distribution** — there is *no delivery mechanism to share/manage logic even
  within one platform*, let alone across.

**Distribution is later**, because you can't distribute *incompatible* logic (or if
you do, it's expensive to walk back). So **certified bridges are the prerequisite
asset**, which makes bridge *correctness/testing* — not translation-as-a-feature —
the real near-term gate.

## 2. The one real bet: a translation hub (interlingua), and why it's premature

Point-to-point translation is O(n²): to translate A↔B you unravel A's semantics,
match to B, print back — both directions — and a third language makes 6 such
relationships. The standard escape is a **hub/interlingua**: each language ↔ one
hub = O(n). This is the LLVM / narrow-waist / MT-pivot pattern.

**Two independent reasons the hub is premature right now:**

1. **It doesn't pay at current scale.** The genuinely *foreign* engines are **Excel
   and Sheets** — lattice is ours (we define what it emits/consumes). So today's
   foreign translation surface is essentially **one bidirectional bridge:
   Excel↔Sheets.** A hub for one pair is pure overhead. Pairwise wins at n=3; the
   hub only beats pairwise somewhere around 5–7+ fully-supported dialects. The hub
   is a bet on *future dialect proliferation* we may never need.
2. **The foreign ground raises the break-even further.** LLVM's hub is cheap to
   justify because its ground is **owned, specified, and co-designed to reduce** —
   the IR is authoritative and targets verifiably conform. Our ground is foreign /
   unspecified / moving / opaque: the *targets* are authoritative and our IR must
   conform to *them*, discoverable only by observation. That inflates the hub's
   fixed cost (a *trusted* core semantics), pushing the break-even n even higher.

## 3. The liberating reframe — engines as oracle (science, not compiler)

Two ambitions hide inside "the hub"; only the cheap one is needed:

- **(a) A canonical hub semantics that *is* the ground** — an LLVM-style spec
  everything reduces to, trivially verifiable. Needs an *owned* ground. We can't
  afford it. Don't attempt it.
- **(b) Behavior-preserving translation validated by *running the real engines*.**
  The IR is an internal economy for organizing lowering rules; "correct" = "same
  observed output on a corpus"; the **engines themselves are the oracle.**

We don't own the ground — but we can **run** it. That's enough for (b). The model is
**empirical science** (IR-as-conjecture, corroborated against foreign engines,
revised when falsified), not **compiler** (IR-as-spec, proven). assay is already
that apparatus. Consequence: you **never reimplement Excel's `+` — you call Excel.**
The per-dialect work is parse/print + lowering *data*, with real engines as oracle.

Epistemic ceiling to accept: you can **test, not prove**; tests **expire** on engine
updates. So the durable long-term asset is the **runner** (cheap, continuous, broad
execution of the real engines = the only access to truth), not the IR.

## 4. lattice is a spoke, not the hub

Separate **lattice the platform** (rich, *evolving*, AST not frozen — and it
*should* keep moving) from **any hub IR** (must be small and *frozen*). Like Swift's
own AST vs. the separate stable LLVM IR. lattice is the **richest spoke** and a
reference evaluator for no-divergence cases — **not the arbiter**. Supersetting
Excel ∪ Sheets *forces a choice at every divergence* (one / the other / neither);
electing lattice's choices as "truth" violates "assay is descriptive." Demote
lattice to **one engine among N**.

(Grounded this session: lattice now lives at `~/personal/lattice`
— the path in `packages/assay/CLAUDE.md` is **stale**. `ExprKind` = 32-variant
functional-language AST at `src/ast.rs:51`; `ValueKind` = 18 variants at
`src/value.rs:376`; evaluator löb/lazy/memoized at `src/eval.rs:235`;
`value_to_json` at `src/main.rs:533` **collapses all rich values — Dict/Lambda/
List/Reference/Range/Table — to Display strings**, confirming rich values exist in
the language but collapse at the assay seam; the `lattice assay` subcommand
[`src/main.rs:446`] is **text-in/text-out** over stdin. Critically, **cell
references are NOT in `ExprKind`** — they're bare `Reference(String)` resolved at
eval; interleaf's `FormulaExpr`, by contrast, is ~half reference grammar. The two
ASTs are **complementary layers**, not competitors: interleaf = surface/reference
grammar, lattice = computation/evaluation.)

## 5. The hub-IR construction — agreement-based and subtractive

(Maintainer's framing, which corrected an earlier additive "small primitive basis +
sugar" sketch.)

- **Membership criterion = *agreement*, not *primitiveness*.** A function belongs in
  the IR iff it behaves identically across the engines — high-level or not.
  `XLOOKUP`, if it agreed everywhere, could be a node.
- **Construction = *subtractive*.** Start from the **intersection of agreeing
  functions** as baseline; **carve down** — remove a function and re-express it
  through surviving IR parts — only when a divergence is *detected*. The IR's shape
  is **discovered by evidence**, not designed from a basis. Keeps the IR as
  high-level as the evidence permits (don't shred `SUM` just because you *could*).
- "Maximal vs frozen" reconciles as **span vs vocabulary**: the surviving atoms span
  everything (lossless by decomposition, small, freezable); the open *vocabulary*
  (every dialect function) lives as **data** in a registry, each entry = a lowering
  to surviving parts.

## 6. The wall this session hit — static discriminator detection

The tempting refinement (carve by **function × input-domain**: keep a function's
node on its *agreeing subdomain*, decompose only its divergent *edges*) **does not
work statically**, because the discriminator for most edges is a **runtime cell
value** the translator can't see (e.g. `VLOOKUP(A1,B:C,2,FALSE)` diverges on
"not found" — data-dependent). Sound static analysis must then assume *any* such
call *might* hit the edge → flag/decompose all → collapses back to whole-function
removal.

**The precise line — carve-ability depends on *where the discriminator lives*:**
- **Syntactic / literal discriminator** (function identity, *literal* mode flags,
  literal arg types, structure) → **statically carve-able**. (The earlier XLOOKUP
  regex-mode example was secretly this easy kind — the mode is usually a literal.)
- **Data discriminator** (cell values, found/not-found, runtime type) → **not**
  carve-able statically → falls back to whole-function handling.

**For data-discriminated edges there are only three honest options** (the general
law: a static decision about a dynamic property has no fourth option):
1. **Conservative total decomposition** — reproduce source behavior across the
   *whole* input domain with agreeing atoms; **needs no domain detection** (correct
   on every input by construction). This *vindicates* whole-function removal. Cost:
   gnarly form even when the call would've been fine; only possible if it bottoms
   out at agreeing atoms (else: non-portable).
2. **Runtime guard** — `IF(shape-check, clean-fn, fallback)` — only where the
   discriminator is cheaply checkable at runtime (arg shape/type/wildcard chars);
   **not** for outcome edges like not-found.
3. **Author-facing diagnostic** — surface the edge + conditions and let the author
   (who *knows* their data shape) decide. Fits interleaf's existing
   `TranspileDiagnostic` channel; best-fit for spreadsheets (the human has the
   runtime knowledge the analyzer lacks).

## 7. The unconditional next step — measure the divergence *locus*

Independent of whether the hub is ever built (pairwise, hub, and distribution all
need it; it's pure assay; it de-risks everything; it delivers immediate author
value as a portability classification):

> Pick a candidate function/feature set, write **differential probes**, run them
> across **Excel / Sheets / lattice** (assay already drives all three), and **profile
> each divergence**: *where* in the input space it diverges **and** whether its
> **discriminator is syntactic (literal/structural) or data-borne** — because that
> bit decides static-carve vs. total-decompose / guard / flag.

Outputs:
- a **portability classification** per function/feature: *agrees everywhere*
  (implicit bridge, already portable) · *diverges with a known rewrite* (explicit
  bridge) · *diverges irreducibly* (flag);
- the size and shape of the **irreducible incompatibility surface** — run the
  subtraction to the floor and it terminates at *agreeing atoms* (portable) or
  *divergent atoms that can't decompose further* = the minimal set of operations
  Excel & Sheets unreconcilably disagree on. **Its size is the magnitude question**,
  and it's empirical. If large → much is non-portable → the hub is *less* valuable,
  and the §0 doubt sharpens.

Maintainer's prior (unverified): primitives **agree on the happy path**, diverge at
the **edges** (blank/empty coercion, string↔number rules, error-precedence, precision-
as-displayed, locale/collation, date epoch — the last is *Environment config*, not a
core node). A lot of functions have edges, so the surface may be larger than a quick
look suggests — hence "measure, don't guess."

## 8. Two structural notes folded in this session

- **Environment ≠ `address → cell`.** It also carries **execution-model config**
  (iterative-calc on/off + limits, date epoch 1900/1904, precision-as-displayed,
  R1C1/A1…). Those knobs are themselves divergence sources → divergence lives in
  *sugar lowerings* **or** in *Environment config*, never in the core's structure
  (aspiration; stress-test against nasty cases).
- **Comparison repositions from N×N to star.** assay stops being a pairwise
  "divergence encyclopedia" and becomes the **measurement apparatus that certifies
  spokes**: compare each platform ↔ the hub (or ↔ its profile), with pairwise
  divergence a *derived* readout. assay also *defines the sharing structure* — where
  it finds no divergence, the bridge is *implicit*; where it does, *explicit and
  scrutinized*. So assay's divergence data **is** the bridges' work-list and oracle.

## 9. Loose ends

- **Uncommitted, green** on `feat/interleaf-ownership`: the `format/types.ts` →
  `values.ts` + `catalogue.ts` split (the driver-extraction seam, see
  driver-extraction memory). Left uncommitted by choice this session. Build + 112
  tests green.
- **Stale path:** `packages/assay/CLAUDE.md` points lattice at `/Users/astral/...`;
  it's now `~/personal/lattice`. Not fixed (no unprompted code edits);
  fix tomorrow if desired.
- The keystone in `architecture-map-2026-05-31.md` §5/§7 ("lattice `ExprKind` as the
  candidate shared vocabulary") was **re-derived from goals and reversed** here:
  lattice = spoke, hub deferred, measure first.
