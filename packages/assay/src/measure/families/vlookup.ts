// VLOOKUP probe family — the pilot.
//
// VLOOKUP is the champion divergence case: it spans all three discriminator
// loci and a wide argument surface. The axes below sweep:
//  - range_lookup arg-form  (FALSE / 0 / TRUE / omitted)        [syntactic]
//  - key encoding           (literal in formula vs cell ref)    [syntactic]
//  - key type               (number / string-coercion / blank)  [data-borne via ref]
//  - key present vs absent  (the not-found #N/A edge)           [data-borne, outcome]
//  - range sorted vs not    (approx-match on unsorted data)     [data-borne, outcome]
//  - col-index form         (in-bounds / out-of-bounds / array) [syntactic]
//  - gsheets null kind      (untouched / "" / runtime-null)     [data-borne]
//  - array mode             (dynamic — pinned; live drivers fix it) [environment]
//
// Loci note (per docs/archive/divergence-measurement): a key's *type/value* is
// syntactic when written as a literal and data-borne when written as a cell
// ref. We resolve this cleanly by carving non-number key types so they appear
// only via `key_encoding=ref` (constraint c1) — making `key_type` unambiguously
// data-borne — while `key_encoding` itself stays the syntactic literal-vs-ref
// axis. Deferred to a later sweep / Environment-configured run: numeric approx
// `1`, boolean/error key types, the `@` / ARRAYFORMULA force-scalar context,
// and legacy-CSE array mode (here `array_mode` is pinned to `dynamic`).

import type { CellValue } from "../../format/values.js";
import type { Assignment, ProbeFamily } from "../family.js";

// 3×3 lookup table at A1:C3. First column is the lookup key column.
const SORTED: Record<string, CellValue> = {
  A1: 1, B1: "a", C1: "x",
  A2: 2, B2: "b", C2: "y",
  A3: 3, B3: "c", C3: "z",
};
// First column not ascending — breaks the precondition for approx match.
const UNSORTED: Record<string, CellValue> = {
  A1: 3, B1: "c", C1: "z",
  A2: 1, B2: "a", C2: "x",
  A3: 2, B3: "b", C3: "y",
};

const KEY_CELL = "E1";

// The literal/value of the search key, by (type, present). number→2/9,
// string→"2" (a numeric-looking string, to probe string↔number coercion).
function keyNumberValue(present: string): number {
  return present === "absent" ? 9 : 2;
}

// The 4th-argument text for the range_lookup setting (empty = 3-arg form).
function rangeLookupArg(setting: string): string | null {
  switch (setting) {
    case "false": return "FALSE";
    case "zero": return "0";
    case "true": return "TRUE";
    case "omitted": return null;
    default: throw new Error(`bad range_lookup: ${setting}`);
  }
}

function colIndexText(setting: string): string {
  switch (setting) {
    case "inb": return "2"; // in-bounds
    case "oob": return "5"; // out of a 3-column table → error
    case "arr": return "{2,3}"; // array col-index → 1×2 array/spill result
    default: throw new Error(`bad col_index_form: ${setting}`);
  }
}

// The grid cell content for a referenced blank/null key, by gsheets_null_kind.
function nullKindCell(kind: string): CellValue {
  switch (kind) {
    case "empty": return '=""'; // empty-string formula (wire-ambiguous)
    case "runtimenull": return "=IF(,,)"; // runtime Null
    default: throw new Error(`bad gsheets_null_kind: ${kind}`);
  }
}

export const vlookupFamily: ProbeFamily = {
  subject: "VLOOKUP",

  axes: [
    {
      name: "range_lookup",
      locus: "syntactic",
      settings: [{ label: "false" }, { label: "zero" }, { label: "true" }, { label: "omitted" }],
    },
    {
      name: "key_encoding",
      locus: "syntactic",
      settings: [{ label: "literal" }, { label: "ref" }],
    },
    {
      name: "key_type",
      locus: "data-borne",
      runtimeCheckable: false,
      settings: [{ label: "number" }, { label: "string" }, { label: "blank" }],
    },
    {
      name: "key_present",
      locus: "data-borne",
      runtimeCheckable: false,
      settings: [{ label: "present" }, { label: "absent" }],
    },
    {
      name: "range_sorted",
      locus: "data-borne",
      runtimeCheckable: false,
      settings: [{ label: "sorted" }, { label: "unsorted" }],
    },
    {
      name: "col_index_form",
      locus: "syntactic",
      settings: [{ label: "inb" }, { label: "oob" }, { label: "arr" }],
    },
    {
      name: "gsheets_null_kind",
      locus: "data-borne",
      runtimeCheckable: false,
      settings: [{ label: "plain" }, { label: "empty" }, { label: "runtimenull" }],
    },
    {
      name: "array_mode",
      locus: "environment",
      settings: [{ label: "dynamic" }],
    },
  ],

  constraint(a: Assignment): boolean {
    // c1: non-number key types only via a cell ref (so key_type is purely data-borne).
    if (a.key_type !== "number" && a.key_encoding !== "ref") return false;
    // c2: present/absent only meaningful for a number key; others are always "present".
    if (a.key_present === "absent" && a.key_type !== "number") return false;
    // c3: the null/empty distinction only applies to a referenced blank key.
    if (a.gsheets_null_kind !== "plain" && !(a.key_type === "blank" && a.key_encoding === "ref")) {
      return false;
    }
    // bound the sweep: for non-number key types, pin the orthogonal data axes to
    // their simple setting (the type/coercion/null question is independent of
    // sortedness and col-index). Keeps the product ~84 probes.
    if (a.key_type !== "number") {
      if (a.range_sorted !== "sorted") return false;
      if (a.col_index_form !== "inb") return false;
    }
    return true;
  },

  build(a: Assignment) {
    const grid: Record<string, CellValue> = {
      ...(a.range_sorted === "unsorted" ? UNSORTED : SORTED),
    };

    // search key text in the formula
    let keyText: string;
    if (a.key_encoding === "ref") {
      keyText = KEY_CELL;
      if (a.key_type === "number") {
        grid[KEY_CELL] = keyNumberValue(a.key_present);
      } else if (a.key_type === "string") {
        // formula-seed → genuine text on both engines (raw "2" is coerced to a
        // number by gsheets' USER_ENTERED write; see docs/archive/divergence-measurement-breadth)
        grid[KEY_CELL] = '="2"';
      } else {
        // blank: untouched (plain) leaves E1 out of the grid; empty/runtime-null
        // seed a formula whose result is ""/Null.
        if (a.gsheets_null_kind !== "plain") grid[KEY_CELL] = nullKindCell(a.gsheets_null_kind);
      }
    } else {
      // literal (number or string only; blank is forced to ref by c1)
      keyText = a.key_type === "string" ? '"2"' : String(keyNumberValue(a.key_present));
    }

    const col = colIndexText(a.col_index_form);
    const rl = rangeLookupArg(a.range_lookup);
    const args = [keyText, "A1:C3", col, ...(rl !== null ? [rl] : [])].join(", ");

    return { formula: `=VLOOKUP(${args})`, grid };
  },
};
