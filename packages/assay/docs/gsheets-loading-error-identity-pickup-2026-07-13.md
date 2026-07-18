# Google Sheets `LOADING` identity: Assay pickup note

**Date:** 2026-07-13  
**Status:** queued driver/schema/comparison follow-up  
**Trigger:** address when Assay driver/value-fidelity work is next picked up

## Measured gap

Google Sheets emitted this raw in-flight value during a controlled streaming
`IMPORTDATA` probe:

```text
effectiveValue.errorValue.type = LOADING
effectiveValue.errorValue.message = Loading data…
formattedValue = Loading...
ISERROR = TRUE
IFNA = LOADING
TYPE = 16
ERROR.TYPE = 10
```

The current driver maps Sheets `LOADING` to the Excel-shaped sentinel
`#GETTING_DATA`. Excel documents `ERROR.TYPE(#GETTING_DATA) = 8`. The mapping is
therefore not a lossless identity mapping: it merges errors that are analogous
in role but measurably distinct under formula observation.

The nearby driver comment saying this switch is a 1:1 mapping is also no longer
accurate for `LOADING`.

## Pickup requirements

The follow-up should:

1. Preserve the raw Sheets Error identity through the driver/value contract.
   Do not choose a new public sentinel spelling without reviewing the shared
   value schema and downstream fixture format.
2. Represent “in-flight external data” as comparison-role metadata if a shared
   cross-engine concept is useful. Do not use that role to erase the raw
   platform identity in exact comparison.
3. Make any cross-engine normalization between Sheets `LOADING` and Excel
   `#GETTING_DATA` explicitly lossy and opt-in.
4. Add a permanent Sheets fixture for the measured observer row, including
   `ERROR.TYPE = 10`, `IFNA`, `ISERROR`, and `TYPE`.
5. Add or extend the Excel transient battery before claiming behavioral parity;
   documentation establishes code `8`, but Assay has not yet measured Excel's
   in-flight catchability and invalidation behavior.
6. Correct the evidence labels in the driver comments, Sheets fidelity docs,
   and sheets.wiki Error page. The old `IMPORTHTML` Probe 8 captured spill
   `#REF!`, not `LOADING`, and should be labeled as a failed loading attempt.

## Acceptance checks

- Exact Sheets output retains raw `LOADING` identity and its formula-observed
  code `10`.
- Exact Excel output retains `#GETTING_DATA` and does not become a Sheets Error.
- A role-aware comparison can relate both as in-flight external-data states
  only when the selected comparison mode requests that abstraction.
- Classic Error mappings remain unchanged.
- Raw wire data remains available in evidence artifacts even if a compact
  scalar view is also produced.
- Documentation distinguishes schema admission, runtime measurement, official
  documentation, and inference.

## Evidence and reproducibility

- Probe:
  `packages/assay/scripts/probes/gsheets-loading-inflight-observability.mjs`
- Corrected controlled run:
  `/Users/jaegun/personal/lattice-audit-fable/audit-output/fixtures/deferred-error-authorization/inflight-drip-run3.json`
- Fixture README:
  `/Users/jaegun/personal/lattice-audit-fable/audit-output/fixtures/deferred-error-authorization/README.md`
- Review:
  `/Users/jaegun/personal/lattice-audit-fable/audit-output/deferred-error-authorization-model-review.md`
- Lattice assay synthesis:
  `/Users/jaegun/personal/lattice/spec/sandbox/gsheets-deferred-error-authorization-assay-2026-07-13.md`

The measured code `10` is established for this `IMPORTDATA` case. Its breadth
across `IMPORTRANGE`, `IMPORTHTML`, `IMPORTXML`, `IMPORTFEED`,
`GOOGLEFINANCE`, accounts, and locales remains an assay target rather than an
assumed invariant.
