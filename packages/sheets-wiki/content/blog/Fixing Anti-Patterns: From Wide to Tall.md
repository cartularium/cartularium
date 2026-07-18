---
author: Chris Carpenter/Aliafriend
tags:
  - tutorial
  - data-organization
  - google-sheets
---
## Fixing Anti-Patterns: From Wide to Tall

You've seen the pain of "wide" data — time periods, weeks, months, or categories spread across columns instead of living as rows. This makes filtering, sorting, pivoting, charting, and long-term tracking much harder.

A classic example is sales, scores, inventory, or measurements tracked horizontally:

|   | A     | B       | C    | D    | E    | F    | G    | H    |
|---|-------|---------|------|------|------|------|------|------|
| 1 |       |         | 1/1  | 1/2  | 1/3  | 1/4  | 1/5  | 1/6  |
| 2 | Bob   | Apple   | 1    | 2    | 3    | 4    | 5    | 6    |
| 3 | Bob   | Orange  | 7    | 8    | 9    | 10   | 11   | 12   |
| 4 | Sally | Apple   | 1    | 2    | 3    | 4    | 5    | 6    |
| 5 | Steve | Orange  | 1    | 2    | 3    | 4    | 5    | 6    |

This is wide format: dates are column headers, values spread out. Questions like "How many Apples did everyone get in total?" or "Average per person per day?" require awkward formulas or manual work.
Additionally, in this example it wouldn't be too long before we had many many columns!

The fix is **unpivoting** — turn it into tall format.

This is a powerful one-liner that works in Google Sheets without add-ons or scripts:

```excel
=INDEX(SPLIT(TOCOL(A2:A5 & "|" & B2:B5 & "|" & C1:H1 & "|" & C2:H5), "|"))
```

Basically we concat/join each part of the data together to create a string.

```excel
=INDEX(A2:A5&"|"&B2:B5&"|"&C1:H1&"|"&C2:H5)
```
INDEX() enables the array. & concats/join cells together.

```
Bob|Apple|46023|1	Bob|Apple|46024|2	Bob|Apple|46025|3	Bob|Apple|46026|4	Bob|Apple|46027|5	Bob|Apple|46028|6
Bob|Orange|46023|7	Bob|Orange|46024|8	Bob|Orange|46025|9	Bob|Orange|46026|10	Bob|Orange|46027|11	Bob|Orange|46028|12
Sally|Apple|46023|1	Sally|Apple|46024|2	Sally|Apple|46025|3	Sally|Apple|46026|4	Sally|Apple|46027|5	Sally|Apple|46028|6
Steve|Orange|46023|1	Steve|Orange|46024|2	Steve|Orange|46025|3	Steve|Orange|46026|4	Steve|Orange|46027|5	Steve|Orange|46028|6
```

TOCOL() makes them all aligned again
then we split to get the data back.


| Person | Fruit  | Date | Value |
|--------|--------|------|-------|
| Bob    | Apple  | 1/1  | 1     |
| Bob    | Apple  | 1/2  | 2     |
| ...    | ...    | ...  | ...   |
| Bob    | Orange | 1/6  | 12    |
| Sally  | Apple  | 1/1  | 1     |
| ...    | ...    | ...  | ...   |

Now you're back to a scalable solution.
