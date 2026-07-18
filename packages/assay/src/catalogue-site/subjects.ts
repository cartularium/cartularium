// shared helper for rendering test/DV subject pills.
// function subjects link out to sheets.wiki; non-function subjects (op:*,
// feature:*, literals) keep the in-index search-jump since no sheets.wiki
// page covers them. indexHref must be the relative path from the calling page
// back to the catalogue root (e.g. "../.." from a DV page, "../../.." from a
// test page) — it varies by URL depth.

import { isFunctionName } from "../format/catalogue.js";
import { crossPropertyUrls } from "./cross-property.js";

export function subjectHref(subject: string, indexHref: string): string {
  return isFunctionName(subject)
    ? `${crossPropertyUrls().wiki}/${subject}`
    : `${indexHref}/#search=${encodeURIComponent(subject)}`;
}
