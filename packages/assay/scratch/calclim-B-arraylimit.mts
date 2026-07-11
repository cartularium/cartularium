import { runProbes, type Probe } from "./calclim-lib.mts";

// Section B: the array limit (empty lambda body -> body cost 0, so the call limit
// never binds; the array size limit does). Claim: 10,000,000. Run one-at-a-time
// (batchSize 1) because a 10M-element MAP is the heaviest probe in the suite.
const probes: Probe[] = [
  { id: "B-arr-5M", formula: "=rows(map(sequence(5000000),lambda(x,)))", expectation: "5000000 (calibrate: empty body, well under array limit)" },
  { id: "B-arr-9999999", formula: "=rows(map(sequence(9999999),lambda(x,)))", expectation: "9999999 (just under 10M)" },
  { id: "B-arr-10M", formula: "=rows(map(sequence(10000000),lambda(x,)))", expectation: "10000000 (array limit, inclusive?)" },
  { id: "B-arr-10M1", formula: "=rows(map(sequence(10000001),lambda(x,)))", expectation: "#ERROR! (over array limit)" },
  // Cross-check: empty body with a sequence bigger than the CALL limit but under the
  // array limit still works -> proves the call limit does not bind for a cost-0 body.
  { id: "B-arr-3M-emptybody", formula: "=rows(map(sequence(3000000),lambda(x,)))", expectation: "3000000 (>2M call limit but empty body -> only array limit applies)" },
];

await runProbes(probes, { tag: "B-arraylimit", batchSize: 1 });
