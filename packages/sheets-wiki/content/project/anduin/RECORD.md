---
tags:
  - function
  - datatype
---

Creates a **Record**, a flexible data structure that supports [[PROTOCOL]]s.

### Syntax

```gse
RECORD(kind)
```

### Arguments

-   `kind`: A string representing the kind of record (e.g., `"ANIMAL"`).

### Return Value

A constructor for the record.

### Usage

Records are instantiated by providing field names, then implementing protocols, then providing values in order:

```gse
=let(
  Animal, RECORD("ANIMAL")({"name"; "species"; "age"}),
  
  dog, Animal("Spot")("dog")(5),
  cat, Animal("Whiskers")("cat")(3),
  
  dog("name")
)
```

Result: `"Spot"`

To update fields after creation, use the `@update` trait:

```gse
=let(
  Animal, RECORD("ANIMAL")({"name"; "species"}),
  dog, Animal("Spot")("dog"),
  updated_dog, dog("@update")("breed", "Golden Retriever"),
  updated_dog("breed")
)
```

Result: `"Golden Retriever"`

### Protocols

Records can implement [[PROTOCOL]]s to define shared behavior. Protocols are defined first, then implemented during record construction:

```gse
=let(
  repr_protocol, PROTOCOL({"repr"}),
  speak_protocol, PROTOCOL({"speak"}),
  
  Animal, RECORD("ANIMAL")
    ({"name"; "species"; "sound"})
    
    (repr_protocol)
    ("repr")
    (lambda(self, 
      self("name") & " the " & self("species")
    ))
    
    (speak_protocol)
    ("speak")
    (lambda(self, self("sound") & "!")),
  
  dog, Animal("Spot")("dog")("woof"),
  cat, Animal("Whiskers")("cat")("meow"),
  
  {REPR(dog); cat("@speak")}
)
```

Result: `{"Spot the dog"; "meow!"}`

### Built-in Traits

Records support the following built-in traits:

-   `@help`: Display help for RECORD.
-   `@update(key, value)`: Updates a field value (returns a new record).
-   `@repr`: Returns a string representation like `#record:KIND<@trait1, @trait2>{...}`.
-   `@items`: Returns the underlying [[DICT]] containing the data.
-   `@traits`: Returns the [[DICT]] containing the implemented traits/protocols.
-   Access fields directly by key (string or number).

### See Also

- [[PROTOCOL]] - Define interfaces for records
- [[DICT]] - Used to store record data and protocol implementations
- [[REPR]] - Display record representations
