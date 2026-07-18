---
tags:
  - formatting
  - number
---

Custom number formatting in Google Sheets uses pattern strings to control how numeric values are displayed. These patterns do not change the underlying value, only its visual representation.

### Pattern Structure

A number format pattern can contain up to four section separated by semicolons:

```
[POSITIVE];[NEGATIVE];[ZERO];[TEXT]
```

Each section controls formatting for a specific type of value:
1. **Positive numbers** — first section
2. **Negative numbers** — second section  
3. **Zero values** — third section
4. **Text** — fourth section

### Section Rules

**One section**: Applied to all numeric values
```
#,##0.00
```

**Two sections**: First for positive/zero, second for negative
```
#,##0.00;[Red](#,##0.00)
```

**Three sections**: Separate formats for positive, negative, and zero
```
#,##0.00;(#,##0.00);"-"
```

**Four sections**: Last section is text format, others shift down
```
#,##0.00;(#,##0.00);"-";@
```

### Number Format Tokens

| Token | Meaning | Example |
|-------|---------|---------|
| `0` | Digit placeholder (shows zero if no digit) | `00.00` → `01.50` |
| `#` | Digit placeholder (hides if no digit) | `##.##` → `1.5` |
| `.` | Decimal point | `0.00` → `1.50` |
| `,` | Thousands separator | `#,##0` → `1,234` |
| `%` | Multiply by 100 and show percent sign | `0%` → `50%` |
| `E+`, `E-` | Scientific notation | `0.00E+00` → `1.23E+03` |
| `/` | Fraction format | `# ?/?` → `1 1/2` |
| `@` | Text placeholder | `@` → displays text as-is |
| `*` | Repeat next character to fill width | `*-@` → `------Text` |
| `_` | Space equal to width of next character | `_)` → space width of `)` |

### Color Instructions

Enclose color names in square brackets to apply color:

```
[Red]#,##0.00;[Blue](#,##0.00)
```

Supported colors: `[Black]`, `[Blue]`, `[Cyan]`, `[Green]`, `[Magenta]`, `[Red]`, `[White]`, `[Yellow]`

### Conditional Formatting

Use conditional operators in brackets to apply formats based on value:

```
[>=1000]#,##0;[<0][Red](#,##0);0
```

Operators: `=`, `<>`, `<`, `<=`, `>`, `>=`

### Common Examples

**Currency with negatives in parentheses:**
```
$#,##0.00;($#,##0.00)
```

**Percentage with one decimal:**
```
0.0%
```

**Scientific notation:**
```
0.00E+00
```

**Fractions:**
```
# ?/?        → 1 1/2
# ??/??      → 1 15/32
```

**Hide zero values:**
```
#,##0.00;(#,##0.00);""
```

**Phone number format:**
```
(###) ###-####
```

**Conditional coloring:**
```
[>=100][Green]#,##0;[<0][Red]#,##0;#,##0
```

### Escaping Special Characters

To display literal characters, enclose them in quotes:

```
#,##0" units"    → 1,234 units
"$"#,##0.00      → $1,234.50
```

### API Reference

For complete documentation, see Google's [Date & Number Formats Guide](https://developers.google.com/workspace/sheets/api/guides/formats).

### See Also
- [[Date Format Patterns]] — date and time formatting
- [[Data type#Number format types]] — standard format types
- [[TEXT]] — function that applies formats to values
