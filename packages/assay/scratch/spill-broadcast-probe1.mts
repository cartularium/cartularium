import { createDriver } from "@cartularium/drivers";

// The 57 work-list formulas + grids, plus edge extensions, run across the 4 pure engines.
type Task = { formula: string; grid?: Record<string, unknown>; ref?: string };

const worklist: Task[] = [
  // broadcasting
  { ref: "ABS/abs-over-signed-row", formula: "=ABS({-1, 2, -3})" },
  { ref: "ADD/add-2d-incompatible-shape", formula: "={1,2;3,4}+{1,2,3;4,5,6}" },
  { ref: "ADD/add-2d-same-shape", formula: "={1,2;3,4}+{10,20;30,40}" },
  { ref: "ADD/add-column-broadcast-across-2d", formula: "={1;2}+{10,20,30;40,50,60}" },
  { ref: "ADD/add-column-to-row-outer-product", formula: "={1;2;3}+{10,20,30}" },
  { ref: "ADD/add-column-vectors-mismatched-length", formula: "={1;2;3}+{10;20}" },
  { ref: "ADD/add-column-vectors-same-length", formula: "={1;2;3}+{10;20;30}" },
  { ref: "ADD/add-row-broadcast-across-2d", formula: "={1,2,3}+{10,20,30;40,50,60}" },
  { ref: "ADD/add-row-to-column-outer-product", formula: "={1,2,3}+{10;20;30}" },
  { ref: "ADD/add-row-vectors-mismatched-length", formula: "={1,2,3}+{10,20}" },
  { ref: "ADD/add-row-vectors-same-length", formula: "={1,2,3}+{10,20,30}" },
  { ref: "ADD/add-scalar-to-2d", formula: "=1+{10,20;30,40}" },
  { ref: "ADD/add-scalar-to-column-vector", formula: "=1+{10;20;30}" },
  { ref: "ADD/add-scalar-to-row-vector", formula: "=1+{10,20,30}" },
  { ref: "DIVIDE/divide-row-by-scalar", formula: "={10,20,30}/10" },
  { ref: "DIVIDE/divide-scalar-by-row", formula: "=60/{1,2,3}" },
  { ref: "IF/if-broadcasting-scalar-condition-to-array-branches", formula: "=IF(TRUE, {1,2,3}, {10,20,30})" },
  { ref: "IF/if-with-array-condition", formula: "=IF({TRUE,FALSE,TRUE}, 1, 2)" },
  { ref: "IF/if-with-array-condition-and-array-branches", formula: "=IF({TRUE,FALSE,TRUE}, {10,20,30}, {-1,-2,-3})" },
  { ref: "INDEX/index-wraps-multiplication-over-range", formula: "=INDEX(A1:A3*10)", grid: { A1: 1, A2: 2, A3: 3 } },
  { ref: "INDEX/index-wraps-outer-product", formula: "=INDEX({1,2,3}+{10;20;30})" },
  { ref: "ISNUMBER/isnumber-over-mixed-row", formula: '=ISNUMBER({1,"a",TRUE,3})' },
  { ref: "LEN/range-no-intersection-errors-column-at-off-row", formula: "=LEN(B1:B3)*1", grid: { B1: 100, B2: 200, B3: 300 } },
  { ref: "LEN/virtual-array-top-left-via-implicit-intersection", formula: '=LEN({"a","bb","ccc"})' },
  { ref: "MINUS/subtract-row-from-column-outer", formula: "={10;20;30}-{1,2,3}" },
  { ref: "MINUS/subtract-scalar-from-row", formula: "={10,20,30}-1" },
  { ref: "MULTIPLY/multiply-row-by-column-outer", formula: "={1,2,3}*{1;2;3}" },
  { ref: "MULTIPLY/multiply-scalar-by-row", formula: "=3*{1,2,3}" },
  { ref: "POW/exponent-row-elementwise", formula: "={1,2,3}^2" },
  { ref: "POW/exponent-scalar-over-row", formula: "=2^{0,1,2,3}" },
  { ref: "SQRT/sqrt-over-row", formula: "=SQRT({1, 4, 9, 16})" },
  { ref: "UPPER/upper-over-string-column", formula: '=UPPER({"a";"bc";"def"})' },
  // spill
  { ref: "FILTER/filter-spill", formula: "=FILTER({1;2;3;4;5}, {1;0;1;0;1})" },
  { ref: "HSTACK/hstack-arrays", formula: "=HSTACK(A1:A2, B1:B2)", grid: { A1: 1, A2: 2, B1: 3, B2: 4 } },
  { ref: "HSTACK/hstack-scalars", formula: "=HSTACK(1, 2, 3)" },
  { ref: "INDEX/index-from-spilled-source", formula: "=INDEX(A1:A3, 2)", grid: { A1: 10, A2: 20, A3: 30 } },
  { ref: "MAP/map-spill", formula: "=MAP({1;2;3}, LAMBDA(x, x*2))" },
  { ref: "SEQUENCE/sequence-2d-spill", formula: "=SEQUENCE(3, 2)" },
  { ref: "SEQUENCE/sequence-column-spill", formula: "=SEQUENCE(3)" },
  { ref: "SEQUENCE/sequence-row-spill", formula: "=SEQUENCE(1, 3)" },
  { ref: "SORT/sort-spill", formula: "=SORT({3;1;2})" },
  { ref: "SUM/single-cell-result-no-spill", formula: "=SUM(1, 2, 3)" },
  { ref: "UNIQUE/unique-spill", formula: "=UNIQUE({1;2;1;3;2})" },
  { ref: "VSTACK/vstack-arrays", formula: "=VSTACK(A1:B1, A2:B2)", grid: { A1: 1, B1: 2, A2: 3, B2: 4 } },
  { ref: "VSTACK/vstack-scalars", formula: "=VSTACK(1, 2, 3)" },
  // spill-edge
  { ref: "FILTER/filter-of-sequence", formula: "=FILTER(SEQUENCE(5), SEQUENCE(5)>2)" },
  { ref: "HSTACK/hstack-two-sequences", formula: "=HSTACK(SEQUENCE(3), SEQUENCE(3, 1, 10))" },
  { ref: "INDEX/index-into-sequence", formula: "=INDEX(SEQUENCE(5, 5), 3, 4)" },
  { ref: "SORT/sort-descending-unique", formula: "=SORT(UNIQUE({3;1;4;1;5;9;2;6;5;3}), 1, -1)" },
  { ref: "SORT/sort-of-filter", formula: "=SORT(FILTER({5;3;1;4;2}, {TRUE;TRUE;FALSE;TRUE;FALSE}))" },
  { ref: "SORT/sort-of-sequence-ascending", formula: "=SORT(SEQUENCE(5), 1, 1)" },
  { ref: "SORT/sort-of-sequence-descending", formula: "=SORT(SEQUENCE(5), 1, -1)" },
  { ref: "TOCOL/tocol-of-2d-sequence", formula: "=TOCOL(SEQUENCE(2,3))" },
  { ref: "TRANSPOSE/transpose-of-sequence", formula: "=TRANSPOSE(SEQUENCE(3))" },
  { ref: "UNIQUE/unique-of-repeated-column", formula: "=UNIQUE({1;2;1;3;2;3})" },
  { ref: "UNIQUE/unique-on-single-value", formula: "=UNIQUE({5;5;5})" },
  { ref: "VSTACK/vstack-two-sequences", formula: "=VSTACK(SEQUENCE(1, 3), SEQUENCE(1, 3, 10))" },
];

// Edge extensions to characterize pure-engine behavior beyond the corpus.
const edges: Task[] = [
  { ref: "EDGE/bare-array-literal", formula: "={1,2,3}" },
  { ref: "EDGE/sum-of-array-literal", formula: "=SUM({1,2,3})" },
  { ref: "EDGE/pycel-sqrt-scalar-literal", formula: "=SQRT({4,9})" },
  { ref: "EDGE/pycel-abs-literal", formula: "=ABS({-5,-6})" },
  { ref: "EDGE/pycel-upper-literal", formula: '=UPPER({"x","y"})' },
  { ref: "EDGE/hf-if-scalar-cond-scalar-branch", formula: "=IF(TRUE, 5, 6)" },
  { ref: "EDGE/hf-array-arith-plain", formula: "={1,2}+{3,4}" },
  { ref: "EDGE/hf-sumproduct-array", formula: "=SUMPRODUCT({1,2,3},{1,1,1})" },
  { ref: "EDGE/formulas-sequence", formula: "=SEQUENCE(3)" },
  { ref: "EDGE/formulas-index-of-array", formula: "=INDEX({10;20;30})" },
  { ref: "EDGE/mismatched-2d-broadcast-hf", formula: "={1,2,3}+{10,20}" },
];

const all = [...worklist, ...edges];

for (const engine of ["hyperformula", "ironcalc", "formulas", "pycel"] as const) {
  const d = createDriver(engine);
  await d.init();
  const results = await d.evaluateBatch(all.map((t) => ({ formula: t.formula, grid: t.grid })));
  console.log(`\n========== ${engine} ==========`);
  results.forEach((r, i) => {
    console.log(`${all[i].ref}\t${all[i].formula}\t=> ${JSON.stringify((r as any).outcome ?? r)}`);
  });
  if (typeof (d as any).dispose === "function") await (d as any).dispose();
}
