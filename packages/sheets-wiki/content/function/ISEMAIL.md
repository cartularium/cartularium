---
name: ISEMAIL
category: info
syntax: ISEMAIL(value)
status: imported
description: This function checks if a value is a valid email address against certain 2-letter country or region codes and top-level domains including:.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3256503?hl=en).

This function checks if a value is a valid email address against certain 2-letter country or region codes and top-level domains including:

### Generic top-level domains

- .com
- .org
- .net
- .edu
- .gov
- .info
- .biz
- .name
- .pro

### Sponsored top-level domains

- .aero
- .asia
- .cat
- .coop
- .edu
- .gov
- .int
- .jobs
- .mil
- .museum
- .post
- .tel
- .travel
- .xxx

This list doesn’t include all top-level domains.

If an email is flagged as "False," it may use a top-level domain that isn't on our list.

### Sample Usage

```gse
ISEMAIL("noreply@google.com")
ISEMAIL("johndoe@yourname.com")
```

### Syntax

```gse
ISEMAIL(value)
```

- `value` - The value to be verified as an email address.

### See Also

[[ISURL]]: Checks whether a value is a valid URL.

[[ISERROR]]: Checks whether a value is an error.

[[ISTEXT]]: Checks whether a value is text.

[[ISBLANK]]: Checks whether the referenced cell is empty.