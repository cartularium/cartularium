import { runProbes, type Probe } from "./calclim-lib.mts";

// Section A part 1: HOF overhead constants (each pinned by a boundary pair N / N+1).
// Boundary claim: value=N at the limit, #ERROR! at N+1.
const probes: Probe[] = [
  // MAP overhead 7, body x (cost 1) -> 1,999,993
  { id: "A-map7-N", formula: "=rows(map(sequence(1999993),lambda(x,x)))", expectation: "1999993 (MAP overhead 7)" },
  { id: "A-map7-N1", formula: "=rows(map(sequence(1999994),lambda(x,x)))", expectation: "#ERROR! (over)" },
  // REDUCE overhead 8, empty init pass-through, body b (cost 1) -> 1,999,992
  { id: "A-red8-N", formula: "=reduce(,sequence(1999992),lambda(a,b,b))", expectation: "1999992 (REDUCE overhead 8)" },
  { id: "A-red8-N1", formula: "=reduce(,sequence(1999993),lambda(a,b,b))", expectation: "#ERROR! (over)" },
  // SCAN overhead 9, empty init, body b -> 1,999,991
  { id: "A-scan9-N", formula: "=rows(scan(,sequence(1999991),lambda(a,b,b)))", expectation: "1999991 (SCAN overhead 9)" },
  { id: "A-scan9-N1", formula: "=rows(scan(,sequence(1999992),lambda(a,b,b)))", expectation: "#ERROR! (over)" },
  // BYROW overhead 7 with sequence(n) -> 1,999,993
  { id: "A-byrow7-N", formula: "=rows(byrow(sequence(1999993),lambda(r,r)))", expectation: "1999993 (BYROW overhead 7, seq(n))" },
  { id: "A-byrow7-N1", formula: "=rows(byrow(sequence(1999994),lambda(r,r)))", expectation: "#ERROR! (over)" },
  // BYROW overhead 8 with sequence(n,1) -> 1,999,992
  { id: "A-byrow8-N", formula: "=rows(byrow(sequence(1999992,1),lambda(r,r)))", expectation: "1999992 (BYROW overhead 8, seq(n,1))" },
  { id: "A-byrow8-N1", formula: "=rows(byrow(sequence(1999993,1),lambda(r,r)))", expectation: "#ERROR! (over)" },
  // MAKEARRAY overhead 8, cols=1, body r -> 1,999,992
  { id: "A-mkarr8-N", formula: "=rows(makearray(1999992,1,lambda(r,c,r)))", expectation: "1999992 (MAKEARRAY overhead 8)" },
  { id: "A-mkarr8-N1", formula: "=rows(makearray(1999993,1,lambda(r,c,r)))", expectation: "#ERROR! (over)" },
  // MAP 2-array overhead 10, body a -> 1,999,990
  { id: "A-map10-N", formula: "=rows(map(sequence(1999990),sequence(1999990),lambda(a,b,a)))", expectation: "1999990 (MAP 2-array overhead 10)" },
  { id: "A-map10-N1", formula: "=rows(map(sequence(1999991),sequence(1999991),lambda(a,b,a)))", expectation: "#ERROR! (over)" },
];

await runProbes(probes, { tag: "A-overheads", batchSize: 4 });
