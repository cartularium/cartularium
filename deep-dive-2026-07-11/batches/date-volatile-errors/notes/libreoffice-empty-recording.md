# libreoffice — empty recording artifact (cross-cutting)

**Batch:** date-volatile-errors · **Refs:** the libreoffice branch of nearly every fork in the batch · **Confidence:** high

## Finding

The libreoffice fixture is **uniformly blank** across all four of my suites. Every recorded
libreoffice result is `[[null]]`:

| suite          | entries | non-`[[null]]` results |
| -------------- | ------- | ---------------------- |
| date           | 89      | 0                      |
| volatile       | 22      | 0                      |
| error-handling | 45      | 0                      |
| divergences    | 8       | 0                      |

No functional engine returns blank for `=DATE(2025,3,15)` or `=IFERROR(1/0,"err")`; libreoffice does
here only because the whole recording carries no values. This is an empty/failed capture (fixture
`generatedAt` 2026-05-11), not a semantic behavior.

## Implication

In this batch libreoffice appears as an outlier in ~40 forks purely because it is blank while every
other engine agrees or diverges on real values. Those libreoffice branches should be read as **"not
recorded,"** and the fork's real story (if any) lives entirely among the other engines. For the
~21 refs where the _only_ split is "everyone agrees vs libreoffice blank," there is no genuine
divergence at all — see the `cause: TODO` empty-recording annotation.

## Wiki-facing notes

- Do not cite libreoffice compatibility from these suites — the data is absent, not negative.
- A re-run of the libreoffice driver is needed before libreoffice can be included in date / volatile /
  error-handling comparisons.

## Open questions

- Why the 2026-05-11 libreoffice run produced all-null output (headless conversion returning cached
  zeros / read-back failure) is a harness question, not a wiki one. No excel/gsheets probe required.
