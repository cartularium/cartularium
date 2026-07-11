const fs = require("fs");
const C = JSON.parse(fs.readFileSync(__dirname + "/stat-distributions-clusters.json", "utf8"));
const meta = (conf, ev, probe = []) => ({ batch: "stat-distributions", confidence: conf, evidence: ev, wants_probe: probe });
const ann = [
  {
    content: "Across this suite the five engines that implement the function (excel, formulas, gsheets, ironcalc, lattice) agree on the value; their split into multiple numeric agreement classes is floating-point last-place rounding only (relative gaps <=1e-9) plus the fact that lattice and, on some cases, ironcalc record fewer significant digits (e.g. 0.000976562 vs 0.0009765625) — no semantic difference. The fork here is coverage: these are the 2010-era dotted names (NORM.DIST, BETA.DIST, CHISQ.DIST, F.DIST, T.DIST, POISSON.DIST, GAMMA.DIST, HYPGEOM.DIST, NEGBINOM.DIST, LOGNORM.DIST, WEIBULL.DIST, EXPON.DIST, BINOM.DIST and matching .INV) which hyperformula does not register and pycel does not implement, so both return #NAME? (missing function). ironcalc DOES implement the dotted names (confirmed live: =NORM.DIST(1,0,1,TRUE) -> 0.841344746, =BETA.DIST(0.5,2,2,TRUE,0,1) -> 0.5). libreoffice recorded a blank cell for every case in this suite, which is a recording/harness gap for the libreoffice fixture (a sibling CHISQ.TEST case in DV-0004 shows libreoffice emitting #NAME?, so libreoffice is not silently returning empty), not an engine behavior.",
    cause: "missing-function",
    scope: [{ kind: "ref-set", refs: C.A }],
    _meta: meta("high", "live hyperformula/ironcalc/pycel probe (stat-distributions-probe1) + recorded fixtures + DV-0004"),
  },
  {
    content: "These modern (dotted) statistical functions are implemented by every engine in the corpus EXCEPT pycel: excel, formulas, gsheets, hyperformula, ironcalc and lattice all compute the value and agree to within floating-point last-place rounding (multiple numeric agreement classes reflect ULP noise and reduced-precision recording by lattice/ironcalc, not disagreement). pycel returns #NAME? because its function library does not implement the statistical-distribution family (confirmed live). libreoffice recorded blank across the whole suite, a recording/harness gap in the libreoffice fixture rather than an engine result. This cluster is the modern names hyperformula HAS implemented — the right-tail and inverse variants and a few specials: CHISQ.DIST.RT, CHISQ.INV.RT, CHISQ.INV, F.DIST.RT, F.INV.RT, F.INV, BETA.INV, CONFIDENCE.NORM, GAMMA.INV, GAUSS, PHI, FISHER, NORM.INV, NORM.S.INV, T.DIST.RT (confirmed live: =CHISQ.DIST.RT(4,4) -> 0.40600584971 on hyperformula).",
    cause: "missing-function",
    scope: [{ kind: "ref-set", refs: C.B }],
    _meta: meta("high", "live pycel/hyperformula probe (stat-distributions-probe1) + recorded fixtures"),
  },
  {
    content: "These are the legacy (pre-2010, dotless) function aliases — BETAINV, CHIDIST, CHIINV, FDIST, FINV, GAMMAINV, NORMINV, NORMSINV, TDIST, TINV. hyperformula still registers and computes them (confirmed live: =CHIDIST(4,4) -> 0.40600584971, =TDIST(1.812,10,1) -> 0.050037630918), as do excel, formulas, gsheets and lattice — so the computing engines agree up to floating-point last-place rounding. ironcalc does NOT implement the legacy aliases (only the modern dotted names), returning #NAME? (confirmed live: =BETADIST(0.5,2,2) -> #NAME? but =BETA.DIST(...) computes). pycel implements none of this family and also returns #NAME?. Note hyperformula uses a lower-accuracy algorithm for several inverses (=NORMINV(0.95,0,1) -> 1.644853627 vs 1.6448536269514715; =TINV(0.05,10) -> 2.2281388425 vs 2.2281388519862744), a ~1e-8 relative difference — still within the value-agreement class here but see the precision notes. libreoffice blank is a suite-wide recording gap.",
    cause: "missing-function",
    scope: [{ kind: "ref-set", refs: C.C }],
    _meta: meta("high", "live hyperformula/ironcalc/pycel probe (stat-distributions-probe1) + recorded fixtures"),
  },
  {
    content: "These legacy (dotless) aliases — BINOMDIST, EXPONDIST, GAMMADIST, NORMDIST, POISSON, WEIBULL, plus GAMMAINV roundtrip — are implemented by excel, formulas, gsheets and lattice (agreeing to floating-point last-place rounding) but by NEITHER hyperformula NOR ironcalc, and not by pycel. hyperformula returns #NAME? for these specific legacy names (confirmed live: =NORMDIST(0,0,1,FALSE) -> #NAME?, =BINOMDIST(2,5,0.5,TRUE) -> #NAME?, =GAMMADIST(2,2,1,TRUE) -> #NAME?, =POISSON(5,3,TRUE) -> #NAME?, =WEIBULL(2,2,1,TRUE) -> #NAME?, =EXPONDIST(2,0.5,TRUE) -> #NAME?) — i.e. hyperformula implements only a subset of the legacy aliases (it has CHIDIST/FDIST/TDIST/NORMINV but not these). ironcalc lacks all legacy aliases and pycel lacks the whole family, both #NAME?. libreoffice blank is a suite-wide recording gap.",
    cause: "missing-function",
    scope: [{ kind: "ref-set", refs: C.D }],
    _meta: meta("high", "live hyperformula/ironcalc/pycel probe (stat-distributions-probe1) + recorded fixtures"),
  },
  {
    content: "For a specific set of legacy (dotless) names — BETADIST, HYPGEOMDIST, LOGNORMDIST, NEGBINOMDIST, NORMSDIST, LOGINV — hyperformula surfaces its lack of implementation with #N/A rather than #NAME?, which is what distinguishes this cluster from the plain-#NAME? legacy cluster. This is an error-code quirk: hyperformula recognizes these names enough to route them but has no working implementation, so it yields #N/A (confirmed live: =BETADIST(0.5,2,2) -> #N/A, =HYPGEOMDIST(1,4,8,20) -> #N/A, =LOGNORMDIST(2,0,1) -> #N/A, =NEGBINOMDIST(0,5,0.5) -> #N/A, =NORMSDIST(1.96) -> #N/A). BETADIST with explicit lower/upper bounds (=BETADIST(5,2,3,0,10)) is special-cased further: hyperformula returns #NUM! (confirmed live), evaluating the extra-argument form and rejecting it, rather than #N/A. excel, formulas, gsheets and lattice compute all of these and agree to floating-point last-place rounding; ironcalc and pycel do not implement the legacy names and return #NAME?; libreoffice blank is a suite-wide recording gap. Extends DV-0072, which recorded the same hyperformula #N/A behavior for other test cases of LOGNORMDIST/NORMSDIST.",
    cause: "missing-function",
    scope: [{ kind: "ref-set", refs: C.E }],
    _meta: meta("high", "live hyperformula probe (stat-distributions-probe1) confirming #N/A vs #NUM! + DV-0072"),
  },
  {
    content: "lattice cannot parse the two-tailed Student-t function names T.DIST.2T and T.INV.2T, returning #PARSE! (a parser-level rejection, distinct from a missing-function #NAME?). The other dotted t-distribution names parse and compute fine on lattice (T.DIST, T.DIST.RT, T.INV all return numbers in the corpus), so the failure is specific to the .2T name form — most likely lattice tokenizes the trailing .2T (a dot followed by a digit) incorrectly. On these same cases excel, formulas, gsheets, hyperformula and ironcalc all compute and agree to floating-point last-place rounding; pycel returns #NAME? (family not implemented); libreoffice blank is a suite-wide recording gap. Cannot be reproduced on the pure-engine harness (lattice is not runnable here) — see probe request for a lattice maintainer confirmation.",
    cause: "missing-function",
    scope: [{ kind: "ref-set", refs: C.F }],
    _meta: meta("medium", "recorded fixtures (lattice #PARSE!); lattice not runnable in this harness — needs a lattice-side fix, not an excel/gsheets probe"),
  },
  {
    content: "CHISQ.TEST / CHITEST return the p-value of a chi-square test of independence over an observed range and an expected range. excel, formulas, gsheets, hyperformula and (for CHISQ.TEST) ironcalc all use the Excel degrees-of-freedom rule for a contingency table: df = (rows-1)*(cols-1) — so for the 2x3 table df=2 (p ~= 0.000308) and for the 2x2 table df=1 (p ~= 0.31488). lattice instead uses df = (number of cells - 1) = rows*cols - 1, i.e. it treats the two ranges as flat lists: df=5 for the 2x3 table and df=3 for the 2x2 table. This was confirmed by back-solving the chi-square statistic from the Excel p-value on hyperformula: chi2=16.169575 for the 2x3 table gives CHISQ.DIST.RT(16.169575, 5)=0.0063762422145 which matches the lattice recorded 0.0063762422150, and chi2=1.0101 for the 2x2 table gives CHISQ.DIST.RT(1.0101, 3)=0.79880782885 matching the lattice 0.798807828845659. This is a genuine algorithmic divergence in the degrees-of-freedom interpretation, not floating-point noise. ironcalc computes CHISQ.TEST (Excel df) but does not implement the legacy CHITEST alias (#NAME?); pycel does not implement either (#NAME?); libreoffice blank is a suite-wide recording gap.",
    cause: "arg-semantics",
    scope: [{ kind: "ref-set", refs: C.G }],
    _meta: meta("high", "live hyperformula df back-solve (stat-distributions-probe2): both lattice values reproduced to full precision"),
  },
  {
    content: "=GAMMA(0.5) is the one case in this suite that pycel implements (=GAMMA(0.5) -> 1.7724538509055159, confirmed live), unlike the rest of the distribution family which pycel returns #NAME? for. All computing engines agree that GAMMA(0.5)=sqrt(pi)~=1.7724538509. The split into agreement classes is a precision difference: hyperformula returns 1.7724538559 — a lower-accuracy result off in the 8th significant digit (~5e-9 absolute), the least accurate of the engines — while excel/formulas/gsheets/ironcalc/lattice/pycel agree to ~1e-15 (some record fewer digits, e.g. lattice 1.772453851). libreoffice blank is a suite-wide recording gap. Related: DV-0225 already records a gsheets/lattice GAMMA precision divergence on a different argument.",
    cause: "precision",
    scope: [{ kind: "ref-set", refs: C.H }],
    _meta: meta("high", "live probe (stat-distributions-probe1): pycel computes GAMMA, hyperformula least accurate + DV-0225"),
  },
];
let tot = 0;
for (const a of ann) tot += a.scope[0].refs.length;
fs.writeFileSync("/Users/jaegun/personal/cartularium/.claude/worktrees/wiki-deep-dive/deep-dive-2026-07-11/batches/stat-distributions/annotations.json", JSON.stringify(ann, null, 2));
console.log("annotations:", ann.length, "refs covered:", tot);
