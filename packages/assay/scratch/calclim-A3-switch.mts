import { runProbes, type Probe } from "./calclim-lib.mts";

const mapN = (id: string, n: number, body: string, exp: string): Probe[] => [
  { id: `A-${id}-N`, formula: `=rows(map(sequence(${n}),lambda(x,${body})))`, expectation: `${n} — ${exp}` },
  { id: `A-${id}-N1`, formula: `=rows(map(sequence(${n + 1}),lambda(x,${body})))`, expectation: `#ERROR! — ${exp}` },
];

const probes: Probe[] = [
  // SWITCH 3-arg (overhead 2): expr & val pass-through; case costs 2 (impl no-match)
  ...mapN("sw3-xxx", 333332, "switch(x,x,x)", "SWITCH 3-arg: 2+x(1)+x(2)+x(1)=6"),
  ...mapN("sw3-x1x", 499998, "switch(x,1,x)", "SWITCH 3-arg case literal skip: 2+1+0+1=4"),
  ...mapN("sw3-xx1", 399998, "switch(x,x,1)", "SWITCH 3-arg val literal skip: 2+1+2+0=5"),
  // SWITCH 4-arg (overhead 3): expr & default always called; case & val pass-through
  ...mapN("sw4-xxxx", 285713, "switch(x,x,x,x)", "SWITCH 4-arg: 3+x+x+x+x=7"),
  ...mapN("sw4-x1xx", 333332, "switch(x,1,x,x)", "SWITCH 4-arg case skip: 3+1+0+1+1=6"),
  ...mapN("sw4-xxx1", 285713, "switch(x,x,x,1)", "SWITCH 4-arg default called: 3+1+1+1+1=7"),
  // REDUCE n(0) init boundary — init that must be evaluated costs (overhead 9)
  {
    id: "A-red-n0-N",
    formula: "=reduce(n(0),sequence(1999991),lambda(a,b,b))",
    expectation: "1999991 — n(0) init evaluated -> overhead 9",
  },
  {
    id: "A-red-n0-N1",
    formula: "=reduce(n(0),sequence(1999992),lambda(a,b,b))",
    expectation: "#ERROR! — over",
  },
  // Control: literal init 0 pass-through -> overhead 8 (one MORE element than n(0))
  {
    id: "A-red-lit-N",
    formula: "=reduce(0,sequence(1999992),lambda(a,b,b))",
    expectation: "1999992 — literal init 0 pass-through -> overhead 8",
  },
];

await runProbes(probes, { tag: "A-switch", batchSize: 5 });
