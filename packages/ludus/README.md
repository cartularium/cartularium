# ludus

> Practice problems for spreadsheets, with automated judging. Working name; pre-alpha.

Spec: `internal/specs/ludus/product-and-judge.md` (DRAFT — nothing here is settled).

## W0 spike: rehydration fidelity

The judge's primary design extracts a user's workbook as data (every cell's entered
value) and rehydrates it into a judge-owned scratch sheet. Whether that round-trip is
faithful on real-world sheets is the project's top technical risk. This spike measures
it: extract → rehydrate → diff computed outputs against the original, and catalogue what
doesn't survive.

Maintainer commands use Ludus's judge identity. Authenticate it with
`pnpm --filter @cartularium/ludus run login`; the token lives in
`~/.ludusrc.json`.

```
pnpm --filter @cartularium/ludus gnarly
# creates a fixture spreadsheet of known-nasty cases, prints its id + URL

pnpm --filter @cartularium/ludus roundtrip <spreadsheet-id-or-url>
# extract → rehydrate → diff; human summary to stdout, full JSON to results/
```

## Vertical slice: one problem, judged end-to-end

`src/` holds the slice (first run 2026-07-17): problem YAML → template sheet → oracle →
judge. `problems/wp-0001-combine-skus.yaml` is the first problem, adapted from the
astral.cafe Community Practice Problems sheet.

```
pnpm --filter @cartularium/ludus oracle   problems/wp-0001-combine-skus.yaml
# runs the reference solution over every case, writes computed `expected` back

pnpm --filter @cartularium/ludus template problems/wp-0001-combine-skus.yaml
# creates the user-facing template (About/Input/Answer, INPUT+OUTPUT named ranges)

pnpm --filter @cartularium/ludus judge    problems/wp-0001-combine-skus.yaml <sheet-id-or-url>
# extract → lint → rehydrate → hidden cases → verdict (exit 0 = accepted)
```

Verdicts: accepted · wrong-answer · lint-reject · unsupported-feature ·
sheet-inaccessible · template-damaged. Sample-case failures print full diffs;
hidden cases show only a coarse category.

Accepted submissions show formula length, formula-cell count, and functions used.
Anonymous cohort comparisons appear after three accepted solutions have been recorded;
only accepted programs enter the aggregate.

Any link-readable sheet id works — UI-authored and wild sheets are better evidence than
the API-authored fixture (API authoring biases toward round-trip success).

### Known extraction gaps (v1 — by design, catalogue before fixing)

Extraction captures `userEnteredValue` + `userEnteredFormat.numberFormat`, sheet
structure, spreadsheet locale/timeZone, and named ranges. XLSX metadata inspection
detects named functions; the judge returns `unsupported-feature` until a validated
inliner can preserve them. Extraction does **not** yet capture data validation
(including checkboxes), conditional formats, protected ranges, iterative calc settings,
filters, charts, or pivots. Diffs caused by these land in the report as evidence, which
is the point of the spike.
