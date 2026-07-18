# Interleaf

> Formula text transpilation between spreadsheet dialects.

Interleaf is a Cartularium package for translating spreadsheet formula text between host dialects. The first scope is Google Sheets <-> Excel formula text only.

Workbook context is out of scope for v0. Named functions, named ranges, package installation, locale settings, and Lattice integration are future work.

Interleaf owns Excel and Google Sheets surface syntax. Lattice can later validate or evaluate the shared formula IR, but dialect-specific parsing and printing stays here.

## Development

```sh
pnpm --filter @cartularium/interleaf test
pnpm --filter @cartularium/interleaf check
pnpm --filter @cartularium/interleaf build
```

## API

```ts
import { transpileFormula } from "@cartularium/interleaf"

const result = transpileFormula("=sum( 1 , a1 )", {
  from: "gsheets",
  to: "gsheets",
})
```

`transpileFormula` returns canonical target formula text when translation is safe. Unsupported constructs return structured diagnostics instead of guessed output.

The lower-level printer API accepts formula IR directly:

```ts
import { call, cell, printExcelFormula, range } from "@cartularium/interleaf"

const result = printExcelFormula(call("SUM", [range(cell("A1"), cell("A3"))]))
```

Excel reference intersection is represented as an explicit IR node, not whitespace trivia. Excel printers may render it with a space; Google Sheets printers return an unsupported-operator diagnostic unless a deliberate lowering exists.

Excel `@` implicit intersection is represented separately from reference intersection. Interleaf owns that host spelling; future Lattice integration should only need the semantic IR node.

Excel structured references are also Interleaf-owned surface syntax. Basic forms such as `Table1[Amount]` and selector forms such as `Table1[[#Headers],[Amount]]` round-trip for Excel targets; Google Sheets targets return an unsupported-reference diagnostic until workbook-aware lowering exists.

Boolean literals and spreadsheet error literals are explicit IR atoms so they do not get confused with names or references during later semantic validation.

Sheet references support quoted and unquoted names. Excel 3D references such as `Sheet1:Sheet3!A1` round-trip for Excel targets and produce unsupported-reference diagnostics for Google Sheets targets.

Bare names are represented as named references rather than cells, preserving name spelling until workbook context can resolve whether they point to ranges, functions, or other host-defined bindings.

Whole-row and whole-column ranges, omitted function arguments, Excel spill references, and common numeric literal forms are represented explicitly enough to round-trip without workbook context.

Excel reference unions are parsed only in parenthesized reference positions, such as `(A:A,C:C)`, so ordinary function argument commas remain unambiguous. Google Sheets targets return an unsupported-reference diagnostic for union references.

Reference unions are provisional. Interleaf currently recognizes comma unions only inside explicit parentheses, for example `(A:A,C:C)`, and rejects them for Google Sheets targets until assay can prove a safe behavior.

Function compatibility is represented as Interleaf-local metadata only as a temporary seed. The seed set is intentionally small and informed by Assay capability data: Google Sheets external I/O functions such as `IMPORTXML` and `GOOGLEFINANCE` return unsupported-function diagnostics when targeting Excel instead of being printed as plausible but broken text. The long-term source of truth should be an Assay-generated compatibility feed described in [`@cartularium/contracts`](../contracts/INTERLEAF-COMPATIBILITY.md).
