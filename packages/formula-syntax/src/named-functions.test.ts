import assert from "node:assert/strict";
import test from "node:test";
import {
  createNamedFunctionInliner,
  googleSheetsSyntax,
  inlineNamedFunctions,
  NamedFunctionInlineError,
  printNodes,
  parseLossless,
} from "./index.js";

const inline = (
  formula: string,
  definitions: Array<{ name: string; definition: string }>,
  options: Parameters<typeof inlineNamedFunctions>[3] = {},
) => inlineNamedFunctions(formula, definitions, googleSheetsSyntax, options);

test("Google Sheets syntax roundtrips opaque references and unfamiliar tokens", () => {
  const formulas = [
    "=Input!A1+'Input data'!$B$2",
    "=Table1[Amount]+[@Quantity]",
    '=IFERROR(#N/A,"a,b")',
    "={1,2;3,4}",
  ];
  for (const formula of formulas) {
    assert.equal(printNodes(parseLossless(googleSheetsSyntax.tokenize(formula))), formula);
  }
});

test("inlines direct calls as immediately invoked lambdas", () => {
  assert.deepEqual(inline("=DOUBLE(A1)", [{ name: "DOUBLE", definition: "LAMBDA(num,num*2)" }]), {
    formula: "=LAMBDA(num,num*2)(A1)",
    inlinedFunctions: ["DOUBLE"],
  });
});

test("inlines a bare named function passed to a lambda helper", () => {
  assert.equal(
    inline("=MAP(A1:A3, double)", [{ name: "DOUBLE", definition: "LAMBDA(x,x*2)" }]).formula,
    "=MAP(A1:A3, LAMBDA(x,x*2))",
  );
});

test("expands transitive dependencies before their callers", () => {
  const result = inline("=TWICE_PLUS_ONE(A1)", [
    { name: "ADD_ONE", definition: "LAMBDA(x,x+1)" },
    { name: "TWICE_PLUS_ONE", definition: "LAMBDA(x,ADD_ONE(x)*2)" },
  ]);
  assert.equal(result.formula, "=LAMBDA(x,LAMBDA(x,x+1)(x)*2)(A1)");
  assert.deepEqual(result.inlinedFunctions, ["ADD_ONE", "TWICE_PLUS_ONE"]);
});

test("reuses compiled definitions across formulas without leaking usage", () => {
  const inliner = createNamedFunctionInliner(
    [
      { name: "F", definition: "LAMBDA(x,x+1)" },
      { name: "G", definition: "LAMBDA(x,F(x)*2)" },
    ],
    googleSheetsSyntax,
  );
  assert.deepEqual(inliner.inline("=G(A1)").inlinedFunctions, ["F", "G"]);
  assert.deepEqual(inliner.inline("=F(A2)").inlinedFunctions, ["F"]);
});

test("respects LET and LAMBDA shadowing case-insensitively", () => {
  const definitions = [{ name: "DOUBLE", definition: "LAMBDA(x,x*2)" }];
  assert.equal(
    inline("=LET(double,LAMBDA(x,x+10),DOUBLE(A1))", definitions).formula,
    "=LET(double,LAMBDA(x,x+10),DOUBLE(A1))",
  );
  assert.equal(
    inline("=LAMBDA(DOUBLE,DOUBLE+1)(4)", definitions).formula,
    "=LAMBDA(DOUBLE,DOUBLE+1)(4)",
  );
});

test("does not rewrite sheet qualifiers or structured references", () => {
  assert.equal(
    inline("=Input!A1+'Input'!A2+INPUT(2)", [
      { name: "INPUT", definition: "LAMBDA(x,x+1)" },
    ]).formula,
    "=Input!A1+'Input'!A2+LAMBDA(x,x+1)(2)",
  );
  assert.equal(
    inline("=Table1[Amount]+TABLE1(2)", [
      { name: "TABLE1", definition: "LAMBDA(x,x+1)" },
    ]).formula,
    "=Table1[Amount]+LAMBDA(x,x+1)(2)",
  );
  assert.equal(
    inline("=$A$1+A:A+A(2)", [{ name: "A", definition: "LAMBDA(x,x+1)" }]).formula,
    "=$A$1+A:A+LAMBDA(x,x+1)(2)",
  );
});

test("rejects collisions with named ranges supplied as protected identifiers", () => {
  assert.throws(
    () =>
      inline(
        "=TOTAL(A1)",
        [{ name: "TOTAL", definition: "LAMBDA(x,x+1)" }],
        { protectedIdentifiers: ["total"] },
      ),
    (error) => error instanceof NamedFunctionInlineError && error.code === "ambiguous-name",
  );
});

test("preserves lazy branches and single argument binding", () => {
  const result = inline("=SAFE(EXPENSIVE())", [
    { name: "SAFE", definition: "LAMBDA(x,IF(FALSE,x+x,0))" },
  ]);
  assert.equal(result.formula, "=LAMBDA(x,IF(FALSE,x+x,0))(EXPENSIVE())");
  assert.equal(result.formula.match(/EXPENSIVE/g)?.length, 1);
});

test("preserves arrays, errors, strings, and anchored references", () => {
  assert.equal(
    inline('=WRAP($A$1,"F(1)",#N/A)', [
      { name: "WRAP", definition: '=_xlfn.LAMBDA(ref,label,err,{ref,label;err,"ok"})' },
      { name: "F", definition: "LAMBDA(x,x)" },
    ]).formula,
    '=LAMBDA(ref,label,err,{ref,label;err,"ok"})($A$1,"F(1)",#N/A)',
  );
});

test("never rewrites function-like text inside strings", () => {
  assert.equal(
    inline('=IF(A1="DOUBLE(1)",DOUBLE(2),"escaped ""DOUBLE(3)""")', [
      { name: "DOUBLE", definition: "LAMBDA(x,x*2)" },
    ]).formula,
    '=IF(A1="DOUBLE(1)",LAMBDA(x,x*2)(2),"escaped ""DOUBLE(3)""")',
  );
  assert.equal(
    inline("=TEXT_ONLY(1)", [
      { name: "TEXT_ONLY", definition: 'LAMBDA(x,"HELPER(x)")' },
      { name: "HELPER", definition: "LAMBDA(x,x+1)" },
    ]).formula,
    '=LAMBDA(x,"HELPER(x)")(1)',
  );
});

test("accepts fixed references and rejects context-dependent references", () => {
  assert.equal(
    inline("=F(1)", [{ name: "F", definition: "LAMBDA(x,x+$A$1+'Input data'!$B$2+RATE)" }]).formula,
    "=LAMBDA(x,x+$A$1+'Input data'!$B$2+RATE)(1)",
  );
  for (const reference of ["A1", "$A1", "A$1", "A:A", "$A:B", "1:1", "$1:2", "Table1[Amount]"]) {
    assert.throws(
      () => inline("=F(1)", [{ name: "F", definition: `LAMBDA(x,x+${reference})` }]),
      (error) =>
        error instanceof NamedFunctionInlineError && error.code === "context-dependent-reference",
      reference,
    );
  }
});

test("rejects direct and mutual recursion", () => {
  assert.throws(
    () => inline("=F(1)", [{ name: "F", definition: "LAMBDA(x,F(x-1))" }]),
    (error) => error instanceof NamedFunctionInlineError && error.code === "recursive-definition",
  );
  assert.throws(
    () =>
      inline("=F(1)", [
        { name: "F", definition: "LAMBDA(x,G(x))" },
        { name: "G", definition: "LAMBDA(x,F(x))" },
      ]),
    (error) => error instanceof NamedFunctionInlineError && error.code === "recursive-definition",
  );
});

test("rejects prohibited calls reached through a dependency", () => {
  assert.throws(
    () =>
      inline(
        "=PUBLIC(A1)",
        [
          { name: "PUBLIC", definition: "LAMBDA(x,PRIVATE(x))" },
          { name: "PRIVATE", definition: 'LAMBDA(x,IMPORTRANGE("id",x))' },
        ],
        { prohibitedFunctions: ["IMPORTRANGE"] },
      ),
    (error) => error instanceof NamedFunctionInlineError && error.code === "prohibited-call",
  );
  assert.throws(
    () => inline('=IMPORTRANGE("id","A1")', [], { prohibitedFunctions: ["IMPORTRANGE"] }),
    (error) => error instanceof NamedFunctionInlineError && error.code === "prohibited-call",
  );
});

test("rejects invalid definitions and bounded expansion overflow", () => {
  assert.throws(
    () => inline("=F(1)", [{ name: "F", definition: "SUM(x)" }]),
    (error) => error instanceof NamedFunctionInlineError && error.code === "invalid-definition",
  );
  assert.throws(
    () =>
      inline("=F(1)", [{ name: "F", definition: "LAMBDA(x,x+x+x+x)" }], {
        maxFormulaLength: 10,
      }),
    (error) => error instanceof NamedFunctionInlineError && error.code === "expansion-limit",
  );
});
