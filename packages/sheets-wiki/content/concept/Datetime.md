---
tags:
  - datatype
  - date
---

Strictly speaking, datetimes are not a distinct [[Data type|data type]]. They are [[Number|numbers]] formatted to display as dates and/or times.

### Serial numbers

Datetimes are stored as *serial numbers*: the number of days since December 30, 1899. The integer part represents the date; the fractional part represents the time of day as a fraction of 24 hours.

| Serial | Represents |
| --- | --- |
| `0` | December 30, 1899 |
| `1` | December 31, 1899 |
| `2` | January 1, 1900 |
| `0.5` | 12:00:00 (noon) |
| `0.25` | 06:00:00 |
| `45292.5` | January 1, 2024 at noon |

Because datetimes are numbers, date arithmetic is numeric arithmetic:

```gse
DATE(2024,1,5) - DATE(2024,1,1)  → 4   (days between dates)
A1 + 7                            → date seven days after A1
```

### The 1900 quirk

Google Sheets inherited a historical bug from Lotus 1-2-3 (via Excel) in which 1900 is incorrectly treated as a leap year. As a result, serial numbers for dates in early 1900 do not correspond to what arithmetic from the epoch would predict:

| Serial | Date in Sheets |
| --- | --- |
| `59` | February 27, 1900 |
| `60` | February 28, 1900 |
| `61` | March 1, 1900 |

The phantom February 29, 1900 (which never existed) shifts serial numbers for pre-March 1900 dates. For practical purposes this only affects date arithmetic involving dates from early 1900.

### Negative serial numbers

> [!INFO]
> The display behavior of negative serial numbers (dates before December 30, 1899) has not been fully verified. Contributions welcome.

Negative serial numbers represent dates before the epoch and appear to display correctly, but edge cases have not been thoroughly tested.

### Timezones

> [!INFO]
> Timezone handling has not been fully verified. Contributions welcome.

Spreadsheet locale determines the timezone used for functions like [[NOW]] and [[TODAY]]. Whether locale is the only mechanism affecting timezone behavior is not fully documented.

### See Also

- [[Number]] — datetimes are stored as numbers.
- [[Number Format Patterns]], [[Date Format Patterns]] — custom display formatting.
- [[NOW]], [[TODAY]], [[DATE]], [[TIME]], [[DATEVALUE]], [[TIMEVALUE]] — date and time functions.
