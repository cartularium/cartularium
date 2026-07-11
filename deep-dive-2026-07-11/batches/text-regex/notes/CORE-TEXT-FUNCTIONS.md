# Core text functions (CONCATENATE / FIND / LEFT / RIGHT / MID / LEN / LOWER / UPPER / SUBSTITUTE / VALUE) — cross-engine deep dive

**Batch:** text-regex · **Refs:** the 25 "artifact-only" forks (CONCATENATE, FIND×4, LEFT×2, LEN×3, LOWER, MID basic/beyond/from-start, RIGHT×2, SUBSTITUTE×3, UPPER×2, VALUE×4) · **Confidence:** high

## Behavior summary

These are the mainstream string functions, and the headline finding is **portability**: across all seven engines that actually record values — excel, formulas, gsheets, hyperformula, ironcalc, lattice, pycel — every one of these cases returns the **identical** result. There is no real semantic divergence. The only reason each appears in the fork list at all is the libreoffice blank-recording artifact (see `libreoffice-blank-artifact.md`).

## Agreed results (all 7 non-libreoffice engines identical)

| Formula                                                               | result                           |
| --------------------------------------------------------------------- | -------------------------------- |
| `=CONCATENATE(A1,A2,A3,"!")` with A1..A3 = "Hello","my","World" seeds | `"Hello my World!"`              |
| `=FIND("M","Miriam McGovern")`                                        | `1`                              |
| `=FIND("m","Miriam McGovern")`                                        | `6` (case-sensitive)             |
| `=FIND("B","Miriam McGovern")`                                        | `#VALUE!` (not found)            |
| `=FIND("M","Miriam McGovern",3)`                                      | `8` (start offset)               |
| `=LEFT("Sweden")`                                                     | `"S"` (default count 1)          |
| `=LEFT("Sale Price",4)`                                               | `"Sale"`                         |
| `=LEN("Phoenix, AZ")`                                                 | `11`                             |
| `=LEN("")`                                                            | `0`                              |
| `=LEN("        One")`                                                 | `11` (leading spaces counted)    |
| `=LOWER("E. E. Cummings")`                                            | `"e. e. cummings"`               |
| `=MID("Romain",3,4)`                                                  | `"main"`                         |
| `=MID("Romain",3,6)`                                                  | `"main"` (count past end clamps) |
| `=MID("Romain",1,2)`                                                  | `"Ro"`                           |
| `=RIGHT("Stock Number")`                                              | `"r"`                            |
| `=RIGHT("Sale Price",5)`                                              | `"Price"`                        |
| `=SUBSTITUTE("hello world","world","earth")`                          | `"hello earth"`                  |
| `=SUBSTITUTE("abcabc","a","x")`                                       | `"xbcxbc"` (all occurrences)     |
| `=SUBSTITUTE("abcabc","a","x",2)`                                     | `"abcxbc"` (nth occurrence)      |
| `=UPPER("total")`                                                     | `"TOTAL"`                        |
| `=UPPER("Yield")`                                                     | `"YIELD"`                        |
| `=VALUE("3.14")`                                                      | `3.14`                           |
| `=VALUE("42")`                                                        | `42`                             |
| `=VALUE("-100")`                                                      | `-100`                           |
| `=VALUE("hello")`                                                     | `#VALUE!`                        |

Spot-confirmed live on hyperformula/ironcalc/formulas/pycel: `LEN("")=0`, `LEFT("Sweden")="S"`, `VALUE("3.14")=3.14` all agree.

## Wiki-facing notes

- **These functions are fully portable.** `FIND` (case-sensitive), `LEFT`/`RIGHT`/`MID` (including the count-past-end clamp and the default count of 1), `LEN` (spaces counted), `LOWER`/`UPPER`, `SUBSTITUTE` (all-occurrences and nth-occurrence forms), `CONCATENATE`, and `VALUE` (including the `#VALUE!` on non-numeric text) behave identically across Excel, Google Sheets, hyperformula, ironcalc, lattice, formulas, and pycel. The wiki pages for these can state broad cross-engine agreement with confidence.
- `FIND` is case-sensitive on all engines (contrast `SEARCH`, which is case-insensitive). `FIND` of a missing substring is `#VALUE!` everywhere.
- The only edge in this group that _does_ diverge is `MID` with a **negative** count and `REPT`/`ROMAN`/`ASC` degenerate inputs — covered in `EMPTY-AND-ZERO-EDGES.md`, not here.

## Open questions

- None on the semantics. The only open item is the libreoffice re-recording (probe **text-regex-005**) that would collapse these 25 spurious forks back to full agreement.
