---
tags:
  - function
  - datatype
---

Creates a **Protocol**, which defines a set of traits (methods) that can be implemented by [[RECORD]]s.

### Syntax

```gse
PROTOCOL(traits)
```

### Arguments

-   `traits`: An array of trait names (e.g., `{"greet"; "speak"}`).

### Return Value

A Protocol object that can be passed to [[RECORD]] constructors.

### Usage

Protocols define interfaces that records can implement. Here's a comprehensive example:

```gse
=let(
  repr_protocol, PROTOCOL({"repr"}),
  
  pet_record, RECORD("pet")
    ({"name"; "species"; "age"; "weight"})
    (repr_protocol)
    ("repr")
    (lambda(self,
      self("name") & " is a " & self("species") & 
      " and is " & self("age") & " years old."
    )),
  
  fluffy, pet_record("Fluffy")("cat")(3)(10),
  cpt_arf, pet_record("Cpt. Arf")("dog")(5)(20),
  
  REPR(fluffy)
)
```

Result: `"Fluffy is a cat and is 3 years old."`

Multiple protocols can be implemented by the same record:

```gse
=let(
  repr_protocol, PROTOCOL({"repr"}),
  
  pet_record, RECORD("pet")
    ({"name"; "species"; "age"; "weight"})
    (repr_protocol)
    ("repr")
    (lambda(self,
      self("name") & " is a " & self("species")
    )),
  
  customer_protocol, PROTOCOL({"add_pet"; "get_pet"}),
  
  customer_record, RECORD("customer")
    ({"name"; "pets"})
    (customer_protocol)
    ("add_pet")
    (lambda(self, lambda(pet,
      self("@update")("pets", self("pets")("@update")(pet("name"), pet))
    )))
    ("get_pet")
    (lambda(self, lambda(petname, self("pets")(petname)))),
  
  fluffy, pet_record("Fluffy")("cat")(3)(10),
  customer, customer_record("John Doe")(DICT),
  updated, customer("@add_pet")(fluffy),
  updated("@get_pet")("Fluffy")("name")
)
```

Result: `"Fluffy"`

### Methods

Protocols support the following methods:

-   `@help`: Display help for PROTOCOL.
-   `@kind`: Returns `"protocol"`.
-   `@items`: Returns a sorted array of the trait names.
-   `@repr`: Returns a string representation like `#protocol<@greet, @speak>`.

### See Also

- [[RECORD]] - Create records that implement protocols
- [[DICT]] - Used to define protocol implementations
- [[REPR]] - Display protocol representations
