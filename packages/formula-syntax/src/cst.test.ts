import assert from "node:assert/strict";
import test from "node:test";
import {
  functionCalls,
  googleSheetsSyntax,
  parseLossless,
  printNodes,
  referencedIdentifiers,
  type CallNode,
} from "./index.js";

test("roundtrips classic formula syntax byte for byte", () => {
  const formulas = [
    '="DOUBLE(1),)"&"He said ""DOUBLE(2)"""',
    "='O''Brien (Q1)'!$A$1+Sheet2!A:A",
    "=F((1+2)*3,{1,2;3,4},[Amount],G(5,6))",
    '=LET(x,1, LAMBDA(y, IF(y="x,);{}[]", x+y))(2))',
    '=IF(A1="""quoted""",,NA())',
    '=#N/A&"#REF!"&IFERROR(#DIV/0!,0)',
    "=SUM( Sheet1!A:A )",
    '=F(1;2;"3;4")',
    "=@F(%A1)+1.25e-4",
  ];

  for (const formula of formulas) {
    const tokens = googleSheetsSyntax.tokenize(formula);
    assert.equal(tokens.map((token) => token.value).join(""), formula);
    assert.equal(printNodes(parseLossless(tokens)), formula);
    tokens.forEach((token, index) => {
      assert.equal(token.value, formula.slice(token.start, token.end));
      assert.equal(token.start, index === 0 ? 0 : tokens[index - 1].end);
    });
  }
});

test("keeps function-like text in strings and references opaque", () => {
  const formula =
    '=N("DOUBLE(1)")&"INPUT"&"escaped ""TABLE1(2)"""+\'DOUBLE\'!A1+Table1[DOUBLE]+DOUBLE(3)';
  assert.deepEqual([...functionCalls(formula, googleSheetsSyntax)], ["N", "DOUBLE"]);
  assert.deepEqual(
    [...referencedIdentifiers(formula, googleSheetsSyntax, ["DOUBLE", "INPUT", "TABLE1"])],
    ["DOUBLE"],
  );
});

test("splits call arguments only at their own delimiter depth", () => {
  const formula = '=F((1,2),{1,2;3,4},"x,y";G(1;2))';
  const call = parseLossless(googleSheetsSyntax.tokenize(formula)).find(
    (node): node is CallNode => node.kind === "call",
  );
  assert.equal(call?.name.token.value, "F");
  assert.equal(call?.args.length, 4);
  assert.equal(printNodes(call?.args[0] ?? []), "(1,2),");
  assert.equal(printNodes(call?.args[1] ?? []), "{1,2;3,4},");
  assert.equal(printNodes(call?.args[2] ?? []), '"x,y";');
  assert.equal(printNodes(call?.args[3] ?? []), "G(1;2)");
  assert.equal(printNodes([call!]), formula.slice(1));
});

test("rejects an unclosed call instead of producing a partial tree", () => {
  assert.throws(
    () => parseLossless(googleSheetsSyntax.tokenize("=SUM(A1,IF(B1,2,3)")),
    /Unclosed call to SUM/,
  );
});
