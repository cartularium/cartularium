// MATCH probe family — the lookup sibling to VLOOKUP.
//
// Same locus structure (syntactic match-type + encoding; data-borne key
// type/present/sortedness), so it tests whether the lookup neighborhood shares
// VLOOKUP's found-ness interaction and coercion residual. Returns a position
// (number) or #N/A.

import type { CellValue } from "../../format/values.js";
import type { Assignment, ProbeFamily } from "../family.js";

const SORTED: Record<string, CellValue> = { A1: 1, A2: 2, A3: 3 };
const UNSORTED: Record<string, CellValue> = { A1: 3, A2: 1, A3: 2 };
const KEY_CELL = "E1";

function matchTypeArg(setting: string): string | null {
  switch (setting) {
    case "zero": return "0"; // exact
    case "one": return "1"; // largest ≤ key (ascending)
    case "omitted": return null; // defaults to 1
    default: throw new Error(`bad match_type: ${setting}`);
  }
}

export const matchFamily: ProbeFamily = {
  subject: "MATCH",
  axes: [
    { name: "match_type", locus: "syntactic", settings: [{ label: "zero" }, { label: "one" }, { label: "omitted" }] },
    { name: "key_encoding", locus: "syntactic", settings: [{ label: "literal" }, { label: "ref" }] },
    { name: "key_type", locus: "data-borne", runtimeCheckable: true, settings: [{ label: "number" }, { label: "numstr" }] },
    { name: "key_present", locus: "data-borne", runtimeCheckable: false, settings: [{ label: "present" }, { label: "absent" }] },
    { name: "range_sorted", locus: "data-borne", runtimeCheckable: false, settings: [{ label: "sorted" }, { label: "unsorted" }] },
  ],
  constraint(a: Assignment): boolean {
    if (a.key_type === "numstr" && a.key_encoding !== "ref") return false; // non-number only via ref
    if (a.key_present === "absent" && a.key_type !== "number") return false; // present/absent only for number
    return true;
  },
  build(a: Assignment) {
    const grid: Record<string, CellValue> = { ...(a.range_sorted === "unsorted" ? UNSORTED : SORTED) };
    let keyText: string;
    if (a.key_encoding === "ref") {
      keyText = KEY_CELL;
      // numstr seeded via formula → genuine text on both engines (avoids the
      // USER_ENTERED-coerces-vs-openpyxl-preserves input-seeding confound).
      grid[KEY_CELL] = a.key_type === "numstr" ? '="2"' : a.key_present === "absent" ? 9 : 2;
    } else {
      keyText = a.key_type === "numstr" ? '"2"' : String(a.key_present === "absent" ? 9 : 2);
    }
    const mt = matchTypeArg(a.match_type);
    const args = [keyText, "A1:A3", ...(mt !== null ? [mt] : [])].join(", ");
    return { formula: `=MATCH(${args})`, grid };
  },
};
