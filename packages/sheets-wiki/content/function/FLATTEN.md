---
name: FLATTEN
category: array
syntax: '=FLATTEN(range1, [range2, …])'
status: imported
description: Flattens all the values from one or more ranges into a single column.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/10307761?hl=en).

Flattens all the values from one or more ranges into a single column.

### Sample Usage

```gse
=FLATTEN(A1:B2)
=FLATTEN("top", A1:B2, "middle", B3:B4, "bottom")
```

### Syntax

```gse
=FLATTEN(range1, [range2, …])
```

| Part   | Description                                          |
| ------ | ---------------------------------------------------- |
| range1 | The first range to flatten.                          |
| range2 | [optional] repeatable  Additional ranges to flatten. |

### Notes

* Values are ordered by argument, then row, then column. So, the entire first row of an input is added before the second row (also known as **row-major order**).
* Empty values are not skipped; the FILTER function can be used to remove those.

### Examples

[Make a copy](https://docs.google.com/spreadsheets/d/1hfr9gx1BAaq5RjPc1VpSfgajJ2sWkrPxrErgPIwiBR4/copy)

Flatten will append arguments in the order they are included in the formula. Arguments need not be range references.

| A     | B   | C   | D                                                               |               |
| ----- | --- | --- | --------------------------------------------------------------- | ------------- |
| **1** | 1   | 2   | **Formula in D1:**  **=FLATTEN(A1:B2, "sample middle", B3:B4)** | 1             |
| **2** | 3   | 4   |                                                                 | 2             |
| **3** |     | 5   |                                                                 | 3             |
| **4** |     | 6   |                                                                 | 4             |
| **5** |     |     |                                                                 | sample middle |
| **6** |     |     |                                                                 | 5             |
| **7** |     |     |                                                                 | 6             |

A more complex example, using the CONCAT (&) operator and SPLIT to do a simple **cross join** or **Cartesian product** on two lists.

| A     | B   | C   | D                                                      | E                        |       |     |     |
| ----- | --- | --- | ------------------------------------------------------ | ------------------------ | ----- | --- | --- |
| **1** | A   | 1   | **Formula in D1: =ArrayFormula(SPLIT(FLATTEN(A1:A3 & " | " & TRANSPOSE(B1:B2)), " | "))** | A   | 1   |
| **2** | B   | 2   |                                                        | A                        | 2     |     |     |
| **3** | C   |     |                                                        | B                        | 1     |     |     |
| **4** |     |     |                                                        | B                        | 2     |     |     |
| **5** |     |     |                                                        | C                        | 1     |     |     |
| **6** |     |     |                                                        | C                        | 2     |     |     |

### History

The `FLATTEN` function was originally #undocumented and was first discovered on March 15, 2020 by a user named Andy on the [Google Docs Editors Help Community forum](https://support.google.com/docs/thread/33715001). It has since been [officially recognized](https://support.google.com/docs/answer/10307761), although it has been mostly deprecated by [[TOCOL]].

[[Matt King]]'s sheet, which was escalated to Google, can be found [here](https://docs.google.com/spreadsheets/d/196NDPUZ-p2sPiiiYlYsJeHD6F_eJq7CWO_hP7rFqGpc/edit?gid=0#gid=0).

### Engine compatibility

FLATTEN is a **Google Sheets proprietary** function — Microsoft Excel has never added it. In the tracked engines only Google Sheets and Lattice compute a value; Excel, `formulas`, HyperFormula, IronCalc, and pycel all return `#NAME?` (assay: FLATTEN forks; live probe, 2026-07-11). This is a sharper portability edge than the rest of the reshape family: because Excel itself lacks the name, a Google Sheets workbook using FLATTEN will not open cleanly in Excel at all, not merely in the open-source engines. To port to Excel 365, rewrite with [[TOCOL]] — but note TOCOL is itself unavailable in HyperFormula, IronCalc, and pycel. The row-major ordering (argument, then row, then column) is consistent on the two engines that support it.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; row-major single-column output. |
| Excel | Not implemented; returns `#NAME?`. |
| HyperFormula | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| IronCalc | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| formulas | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported; row-major single-column output. |

### Related functions

* [[SPLIT]]
* [[TRANSPOSE]]
* [[SORT]]
* [[UNIQUE]]
* [[FILTER]]
