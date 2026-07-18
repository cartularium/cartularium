---
tags:
  - function
  - datatype
---

Creates a **Dictionary**, a key-value store.

### Syntax

```gse
DICT(key, value)...
```

### Arguments

-   `key`: The key (string or number).
-   `value`: The value.

### Return Value

A DICT object.

### Usage

Create dictionaries by chaining key-value pairs:

```gse
=let(
  d, DICT({"a", 1})({"b", 2}),
  d("a")
)
```

Result: `1`

You can also create dictionaries from arrays:

```gse
=let(
  keys, {"name"; "age"; "city"},
  values, LIST("Alice")("@push")(30)("NYC"),
  d, DICT("@from_list")(keys, values),
  d("age")
)
```

Result: `30`

Note how we need to use `@push` to add a number to a list.

### Methods

Dicts support the following methods:

-   `@help`: Display help for DICT.
-   `@kind`: Returns `"dict"`.
-   `@update(key, value)`: Updates or adds a key-value pair.
-   `@get(key)`: Gets the value for a key.
-   `@remove(key)`: Removes a key-value pair.
-   `@keys`: Returns an array of all keys.
-   `@items`: Returns the underlying [[LIST]] of values.
-   `@from_list(keys, list)`: Creates a DICT from an array of keys and a [[LIST]] of values.
-   `@repr`: Returns a string representation like `#dict{"key1", value1; "key2", value2}`.

### See Also

- [[LIST]] - Dynamic sequence container
- [[RECORD]] - Uses DICT for data storage
- [[REPR]] - Display dict representations
