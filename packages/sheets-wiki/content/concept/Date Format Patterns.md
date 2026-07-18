---
tags:
  - formatting
  - date
  - time
---

Custom date and time formatting in Google Sheets uses pattern strings composed of tokens that represent different date/time components. These patterns control display only; values are stored internally as [[Data type#Date and time storage|serial numbers]].

### Pattern Structure

Date and time format patterns combine tokens to create desired displays. Multiple tokens of the same type increase specificity.

### Date Tokens

| Token | Component | Examples |
|-------|-----------|----------|
| `d` | Day of month (1-31) | `d` → `5` |
| `dd` | Day of month, zero-padded | `dd` → `05` |
| `ddd` | Day of week, abbreviated | `ddd` → `Mon` |
| `dddd` | Day of week, full | `dddd` → `Monday` |
| `m` | Month (1-12) | `m` → `3` |
| `mm` | Month, zero-padded | `mm` → `03` |
| `mmm` | Month, abbreviated | `mmm` → `Mar` |
| `mmmm` | Month, full name | `mmmm` → `March` |
| `mmmmm` | Month, first letter | `mmmmm` → `M` |
| `yy` | Year, two digits | `yy` → `24` |
| `yyyy` | Year, four digits | `yyyy` → `2024` |

### Time Tokens

| Token | Component | Examples |
|-------|-----------|----------|
| `h` | Hour (0-23) | `h` → `14` |
| `hh` | Hour, zero-padded | `hh` → `02` |
| `m` | Minute (0-59) | `m` → `5` |
| `mm` | Minute, zero-padded | `mm` → `05` |
| `s` | Second (0-59) | `s` → `8` |
| `ss` | Second, zero-padded | `ss` → `08` |
| `.0` | Fractional seconds | `.000` → `.123` |
| `AM/PM` | 12-hour format indicator | `h:mm AM/PM` → `2:30 PM` |
| `A/P` | 12-hour format, abbreviated | `h:mm A/P` → `2:30 P` |
| `[h]` | Elapsed hours | `[h]:mm` → `26:30` |
| `[m]` | Elapsed minutes | `[m]:ss` → `1590:45` |
| `[s]` | Elapsed seconds | `[s]` → `95445` |

### Context-Sensitive Tokens

**Important**: `m` and `mm` represent **month** when appearing directly after day/year tokens, but represent **minute** when appearing after hour/time tokens:

```
yyyy-mm-dd       → 2024-03-15  (mm = month)
hh:mm:ss         → 14:05:30    (mm = minute)
mm/dd/yyyy       → 03/15/2024  (mm = month)
```

### Common Examples

**Standard date formats:**
```
m/d/yyyy         → 3/15/2024
mm/dd/yyyy       → 03/15/2024
dd/mm/yyyy       → 15/03/2024
yyyy-mm-dd       → 2024-03-15
mmmm d, yyyy     → March 15, 2024
ddd, mmm d       → Fri, Mar 15
dddd             → Friday
```

**Time formats:**
```
h:mm AM/PM       → 2:30 PM
hh:mm:ss         → 14:30:45
h:mm:ss.000      → 14:30:45.123
[h]:mm           → 26:30 (elapsed time)
```

**Combined date/time:**
```
m/d/yyyy h:mm AM/PM          → 3/15/2024 2:30 PM
yyyy-mm-dd hh:mm:ss          → 2024-03-15 14:30:45
ddd mmm d, yyyy h:mm AM/PM   → Fri Mar 15, 2024 2:30 PM
```

**ISO 8601 format:**
```
yyyy-mm-dd"T"hh:mm:ss        → 2024-03-15T14:30:45
```

### Elapsed Time

Use brackets to show time that exceeds 24 hours:

```
[h]:mm:ss        → 26:15:30 (26 hours, 15 minutes, 30 seconds)
[m]:ss           → 1575:30  (1575 minutes, 30 seconds)
[s]              → 94530    (94530 seconds)
```

Without brackets, time wraps at 24 hours:
```
h:mm:ss          → 2:15:30  (same value, shows only 2 hours)
```

### Literal Text

Enclose literal text in quotes or use backslash for single characters:

```
yyyy-mm-dd" at "hh:mm        → 2024-03-15 at 14:30
m/d/yyyy\ \(h:mm\)           → 3/15/2024 (14:30)
```

### Locale Dependency

Actual display depends on the spreadsheet's locale setting:
- Month/day names appear in the spreadsheet's language
- Date separator characters may vary by locale
- First day of week differs by region

### API Reference

For complete documentation, see Google's [Date & Number Formats Guide](https://developers.google.com/workspace/sheets/api/guides/formats).

### See Also
- [[Number Format Patterns]] — numeric formatting
- [[Datetime]] — internal date/time storage
- [[TEXT]] — function that applies formats to values
- [[Data type#Date and time storage]] — serial number format
