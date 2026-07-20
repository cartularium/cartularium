# formula-syntax

Lossless spreadsheet-formula syntax for conservative source rewriting.

The package separates tokenization from structure. Each dialect supplies its own
tokenizer. The shared concrete syntax tree preserves source text and adds only the
call and lexical-scope structure needed by refactoring tools. It is not Interleaf's
semantic formula IR.

Google Sheets is the only implemented dialect. Callers must select
`googleSheetsSyntax` explicitly; there is no cross-dialect fallback.

```ts
import {
  googleSheetsSyntax,
  inlineNamedFunctions,
} from "@cartularium/formula-syntax";

const result = inlineNamedFunctions(
  "=DOUBLE(A1)",
  [{ name: "DOUBLE", definition: "LAMBDA(x,x*2)" }],
  googleSheetsSyntax,
);
// result.formula === "=LAMBDA(x,x*2)(A1)"
```

Named functions expand as immediately invoked `LAMBDA` expressions. This preserves
argument binding and lazy branches without beta-reducing parameters. Expansion is
case-insensitive, scope-aware, transitive, and bounded. Recursive definitions,
protected-name collisions, malformed definitions, and configured prohibited calls
fail closed.
