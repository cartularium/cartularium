import { runProbes, type Probe } from "./calclim-lib.mts";

// Section A part 2: body-cost rules via MAP (overhead 7). Boundary pair N / N+1.
// limit N = floor((2,000,000 - 7) / body_cost)
const mapN = (n: number, body: string, exp: string): Probe[] => [
  { id: `A-${exp.replace(/[^a-z0-9]/gi, "").slice(0, 12)}-N`, formula: `=rows(map(sequence(${n}),lambda(x,${body})))`, expectation: `${n} — ${exp}` },
  { id: `A-${exp.replace(/[^a-z0-9]/gi, "").slice(0, 12)}-N1`, formula: `=rows(map(sequence(${n + 1}),lambda(x,${body})))`, expectation: `#ERROR! — ${exp}` },
];

const probes: Probe[] = [
  ...mapN(666664, "x+x", "operator desugar add=1 (B3)"),
  ...mapN(399998, "x+x+x", "left-assoc chaining (B5)"),
  ...mapN(999996, "n(1)", "literal called costs 1 (B2)"),
  ...mapN(399998, "if(x,x,x)", "IF cost 2 + cond + 2 branches (B5)"),
  ...mapN(499998, "if(x,1,x)", "IF branch literal skipped (B4)"),
  ...mapN(399998, "if(false,x+x+x+x+x,x)", "IF non-taken branch root only (B5)"),
  ...mapN(399998, "let(y,1,y)", "LET binding pass-through (B5)"),
  ...mapN(333332, "let(y,x,y)", "LET binding value called (B6)"),
  ...mapN(666664, "iferror(x,1)", "IFERROR cost 1, fallback called (B3)"),
  ...mapN(333332, "lambda(y,y)(x)", "LAMBDA call overhead 2 (B6)"),
];

await runProbes(probes, { tag: "A-body", batchSize: 6 });
