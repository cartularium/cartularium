---
tags:
  - technique
author: Astral Café
---
The QUERY function is able to process arithmetic functions by default, being processed on the same level as other data manipulation functions. As such, it allows for arithmetic processing via strings.

### Syntax

```gse
INDEX(QUERY(, "select "&expression, ), 2)
```

Code golf syntax for non-array-enabled formulae:

```gse
+SORT(QUERY(, "select "&expression, ))
```

`expression` should be an arithmetic expression using only +, -, \*, %, and /. It should be submitted as a string.