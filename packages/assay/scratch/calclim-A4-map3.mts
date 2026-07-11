import { runProbes, type Probe } from "./calclim-lib.mts";
// MAP 3-array overhead 13 (+3 per extra array beyond the base 7 for 1 array):
// limit = floor((2,000,000 - 13)/1) = 1,999,987 for body cost 1.
const probes: Probe[] = [
  { id: "A-map13-N", formula: "=rows(map(sequence(1999987),sequence(1999987),sequence(1999987),lambda(a,b,c,a)))", expectation: "1999987 (MAP 3-array overhead 13)" },
  { id: "A-map13-N1", formula: "=rows(map(sequence(1999988),sequence(1999988),sequence(1999988),lambda(a,b,c,a)))", expectation: "#ERROR! (over)" },
  // Also confirm per-cell budget independence (Section E): two near-2M formulas in ONE batch
  // (co-tiled onto shared host cells) both return their value -> each cell has its own budget.
  { id: "E-indep-a", formula: "=rows(map(sequence(1999993),lambda(x,x)))", expectation: "1999993 (cell 1 near-limit)" },
  { id: "E-indep-b", formula: "=rows(map(sequence(1999993),lambda(x,x)))", expectation: "1999993 (cell 2 near-limit, same host)" },
];
await runProbes(probes, { tag: "A-map3-E", batchSize: 4 });
