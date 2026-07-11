# DBCS byte functions (FINDB / LEFTB / LENB / MIDB / REPLACEB / RIGHTB / SEARCHB) — cross-engine deep dive

**Batch:** text-regex · **Refs:** FINDB/findb-dbcs, LEFTB/leftb-dbcs, LENB/lenb-dbcs, MIDB/midb-dbcs, REPLACEB/replaceb-dbcs, RIGHTB/rightb-dbcs, SEARCHB/searchb-dbcs · **Confidence:** medium

## Behavior summary

The `*B` functions are the byte-oriented twins of `FIND`/`LEFT`/`LEN`/`MID`/`REPLACE`/`RIGHT`/`SEARCH`. In Microsoft's spec they only count a character as **2 bytes when the host system locale is a DBCS language** (Japanese, Chinese, Korean); in a single-byte (Western) locale they behave exactly like their non-B counterparts. This makes their results **locale-dependent**, which is the root of the divergence. All test inputs use the hiragana string `"あいう"` (three CJK characters).

Three implementations exist, plus three engines that lack the family entirely:

- **excel, formulas** → single-unit (Western-locale) model: each character counts as 1.
- **lattice** → always-DBCS model: each CJK character counts as 2 bytes.
- **gsheets** → **inconsistent**: DBCS for counting/positional functions, single-unit for extraction/replacement.
- **hyperformula, ironcalc, pycel** → not implemented → `#NAME?` (confirmed live).
- **libreoffice** → blank (whole-suite recording artifact).

## Divergences

Compact result table (`✗` = `#NAME?`; libreoffice omitted, all blank/artifact):

| Formula                       | excel / formulas | lattice   | gsheets       | hf / ic / pycel |
| ----------------------------- | ---------------- | --------- | ------------- | --------------- |
| `=LENB("あ")`                 | `1`              | `2`       | `2`           | ✗               |
| `=LEFTB("あいう",2)`          | `"あい"`         | `"あ"`    | `"あ"`        | ✗               |
| `=RIGHTB("あいう",2)`         | `"いう"`         | `"う"`    | `"う"`        | ✗               |
| `=FINDB("い","あいう")`       | `2`              | `3`       | `3`           | ✗               |
| `=SEARCHB("い","あいう")`     | `2`              | `3`       | `3`           | ✗               |
| `=MIDB("あいう",3,2)`         | `"う"`           | `"い"`    | **`"う"`**    | ✗               |
| `=REPLACEB("あいう",3,2,"X")` | `"あいX"`        | `"あXう"` | **`"あいX"`** | ✗               |

The excel/formulas column was **confirmed live** for `formulas` (which mirrors Excel): `LENB("あ")=1`, `LEFTB="あい"`, `RIGHTB="いう"`, `FINDB=2`, `MIDB="う"`, `REPLACEB="あいX"`. The `#NAME?` column was confirmed live for hyperformula/ironcalc/pycel.

**Mechanism:**

- **excel / formulas (single-unit):** the recording environment is a Western locale, so `*B` == `*` — each character is one unit. `LENB("あ")=1`, and byte offsets are really character offsets.
- **lattice (always-DBCS):** treats every CJK character as 2 bytes, so `LENB("あ")=2`, `LEFTB(…,2)` takes 1 CJK char, `FINDB("い",…)=3` (byte position of the 2nd char), `MIDB(…,3,2)` starts at byte 3 = start of char 2 = `"い"`, `REPLACEB(…,3,2,"X")` replaces char 2 = `"あXう"`.
- **gsheets (split personality):** matches lattice's 2-byte model for **LENB, LEFTB, RIGHTB, FINDB, SEARCHB** (the counting/positional functions), but matches Excel's single-unit model for **MIDB and REPLACEB** (`"う"` and `"あいX"`, i.e. treating the byte offsets as character offsets). This inconsistency is engine-internal, not locale-driven.

## Edges explored beyond the corpus

Live probe confirmed `formulas` reproduces the full Excel single-unit column exactly, and that hyperformula/ironcalc/pycel have none of the seven `*B` functions (uniform `#NAME?`). The gsheets and lattice columns are recorded-fixture-only (cannot run those engines here).

## Wiki-facing notes

- **These functions are locale-dependent by design.** The _same_ `LENB("あ")` returns 1 in an English-locale Excel and 2 in a Japanese-locale Excel. Any cross-engine or cross-locale comparison of `*B` results is inherently fragile.
- **Portability:** the `*B` family is absent from hyperformula, ironcalc, and pycel (`#NAME?`). Avoid it in workbooks that must run on those engines; prefer the non-B functions unless you specifically need DBCS byte counting.
- **gsheets is internally inconsistent:** its `LENB`/`FINDB` treat CJK as 2 bytes, but its `MIDB`/`REPLACEB` treat positions as characters. A formula pairing `FINDB` with `MIDB` (a common "find the byte, then slice" idiom) will use mismatched offset conventions in Google Sheets and misbehave on CJK text.
- lattice implements a consistent always-DBCS model, closest to a Japanese-locale Excel.

## Open questions

- **text-regex-002:** Confirm on live Excel (Western locale) that the whole `*B` family collapses to single-unit results (`LENB("あ")=1`, `MIDB("あいう",3,2)="う"`), i.e. our formulas-mirror assumption about the recording locale is correct.
- **text-regex-003:** Confirm on live Google Sheets the MIDB/REPLACEB vs LENB/FINDB inconsistency (`MIDB("あいう",3,2)="う"` but `LENB("あ")=2`) is real and not a fixture transcription error — this is the most surprising claim in this note.
