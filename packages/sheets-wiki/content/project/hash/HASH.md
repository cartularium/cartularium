---
tags:
  - hash
---

`HASH` is a [hashing function](https://en.wikipedia.org/wiki/Hash_function). Inputs are hashed to an eight-digit [base-36](https://en.wikipedia.org/wiki/Base36) string.

### Collision

Hashes, by nature of mapping an infinite input domain to a restricted output, have a probability of [collision](https://en.wikipedia.org/wiki/Hash_collision).

The expected number of collisions can be calculated as:

$$
E[\text{collisions}] = \frac{k^2}{2n}
$$

For example, with $2{,}000{,}000$ items:
$$
E[\text{collisions}] = \frac{2{,}000{,}000^2}{2 \times 36^8} = \frac{4{,}000{,}000{,}000{,}000}{5{,}642{,}219{,}814{,}912} \approx 709
$$

| $k$ (Number of items) | Expected Collisions |
| --------------------- | ------------------- |
| 1000                  | ~0.000177           |
| 10000                 | ~0.0177             |
| 100000                | ~1.77               |
| 1000000               | ~177                |
| 2000000               | ~709                |
| 5000000               | ~4431               |

This approximation only holds as long as the hash function follows a [continuous uniform distribution](https://en.wikipedia.org/wiki/Continuous_uniform_distribution).

### Empirical Performance

The hash function demonstrates near-optimal collision resistance across different data types:

| Data Type | Test Size | Observed Collisions | Expected Collisions | Performance |
| --------- | --------- | ------------------- | ------------------- | ----------- |
| Integers | $2{,}000{,}000$ | 0 | ~710 | Excellent |
| Floats | $100{,}000$ | 3.53 (avg) | ~1.8 | Near-optimal |
| Strings | $370{,}105$ | 34 | ~24 | Near-optimal |

**Notes:**
- Integer test: Sequential integers from $0$ to $2{,}000{,}000$ showed zero collisions, significantly outperforming the theoretical expectation due to the deterministic nature of the input set.
- Float test: Average of 15 runs using `RANDARRAY` to generate $100{,}000$ random floats. Result is close to the theoretical minimum of $\sim1.8$ collisions.
- String test: Dictionary of $370{,}105$ unique words. $34$ collisions is within acceptable variance of the theoretical $24$ for a random hash function.

### Implementation

The hash function uses different algorithms optimized for each data type:

#### Numbers (Integers and Floats)

Uses multiplicative hashing with XOR mixing:

1. Separate integer and fractional parts
2. Hash integer part: $\text{mod}(\text{abs}(\text{num}) \times 2654435761, 2^{31})$
3. Hash fractional part: $\text{mod}(\text{round}(\text{frac} \times 10^9) \times 1597334677, 2^{31})$
4. XOR the parts together with sign handling
5. Final multiply by $668265261$ and mod by $36^8$

The use of $2^{31}$ as intermediate modulo (instead of $36^8$) preserves entropy during accumulation, preventing collision clusters.

Inspired by Knuth's multiplicative hash (prime $2654435761$) and MurmurHash finalizer patterns.

#### Strings

Uses FNV-1a inspired algorithm with large intermediate range:

1. Initialize accumulator to FNV offset basis: $2166136261$
2. For each character:
   - Multiply accumulator by FNV prime ($16777619$)
   - Mod by $2^{31}$ to keep in range
   - XOR with character code
   - Mod by $2^{31}$ again
3. Final multiply by $668265261$ and mod by $36^8$

The two-stage approach ($2^{31}$ during accumulation, $36^8$ at finalization) ensures uniform distribution across the output space.

Inspired by [FNV-1a hash](http://www.isthe.com/chongo/tech/comp/fnv/) with modifications for Google Sheets' numeric constraints.

#### Design Constraints

Google Sheets imposes several constraints that influenced the design:

- **MOD limitations**: `MOD(dividend, divisor)` fails when $divisor \times 1125900000000 \leq dividend$
- **BITXOR requires integers**: Float operands must be wrapped with `int()`
- **No bitshift operators**: Used division by powers of 2 instead
- **Numeric precision**: JavaScript float precision (53-bit mantissa) limits calculation size

These constraints led to the two-stage modulo approach, which balances collision resistance with computational safety.
