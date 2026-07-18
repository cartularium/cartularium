// @cartularium/chrome — public exports.
// templates are read at module-load time (sync) so consumers can use them
// directly. ESM-only.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import IMPRINTS from "./data/imprints.json" with { type: "json" };
import ENGINES from "@cartularium/brand/data/engines.json" with { type: "json" };
import PROPERTIES from "@cartularium/brand/data/properties.json" with { type: "json" };

const HERE = dirname(fileURLToPath(import.meta.url));

function loadTemplate(name) {
  return readFileSync(join(HERE, "templates", name), "utf8");
}

export const TOPBAR_TEMPLATE = loadTemplate("topbar.html");
export const DRAWER_TEMPLATE = loadTemplate("drawer.html");
export const FOOTER_TEMPLATE = loadTemplate("footer.html");
export const RELATED_TEMPLATE = loadTemplate("related.html");
export const TOC_RAIL_TEMPLATE = loadTemplate("toc-rail.html");
export const TOC_GUTTER_TEMPLATE = loadTemplate("toc-gutter.html");
export const TOC_FAB_TEMPLATE = loadTemplate("toc-fab.html");
export const ERROR_404_TEMPLATE = loadTemplate("error-404.html");

export { IMPRINTS, ENGINES };
export { render } from "./scripts/render.js";

/**
 * Look up a host in the imprints registry. Returns undefined for unknown hosts.
 * @param {string} host
 * @returns {{label: string, slug: string} | undefined}
 */
export function imprintFor(host) {
  return IMPRINTS.imprints[host];
}

/**
 * Decide which sigil applies for a link from `currentHost` to `targetHost`.
 * Returns "int" for cross-imprint, "ext" for fully external, null for same-host.
 * @param {string} currentHost
 * @param {string} targetHost
 * @returns {"int" | "ext" | null}
 */
export function sigilFor(currentHost, targetHost) {
  if (!targetHost || targetHost === currentHost) return null;
  return IMPRINTS.imprints[targetHost] ? "int" : "ext";
}

/**
 * Imprints other than the given host, in registry order.
 * Used by the mobile drawer's "other cartularium volumes" list.
 * @param {string} host
 * @returns {Array<{host: string, label: string, slug: string, href: string}>}
 */
export function imprintsExcluding(host) {
  return Object.entries(IMPRINTS.imprints)
    .filter(([h]) => h !== host)
    .map(([h, info]) => ({
      host: h,
      label: info.label,
      slug: info.slug,
      href: urlForHost(h),
    }));
}

/**
 * Filter the engines registry to a tier.
 * @param {"primary" | "comparison"} tier
 * @returns {Array<{name: string, label: string, tier: string, order: number}>}
 */
export function enginesByTier(tier) {
  return Object.entries(ENGINES.engines)
    .filter(([, e]) => e.tier === tier)
    .map(([name, e]) => ({ name, ...e }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Cross-property URLs. Reads `CARTULARIUM_{HOME,WIKI,ASSAY}_URL` env vars
 * with production defaults. Use at build time for cross-property links so
 * `pnpm dev` can retarget them at localhost ports.
 * @returns {{home: string, wiki: string, assay: string}}
 */
export function crossPropertyUrls() {
  return {
    home: process.env.CARTULARIUM_HOME_URL || PROPERTIES.urls.home,
    wiki: process.env.CARTULARIUM_WIKI_URL || PROPERTIES.urls.wiki,
    assay: process.env.CARTULARIUM_ASSAY_URL || PROPERTIES.urls.assay,
  };
}

// production hostnames for the three properties we serve. unmapped hostnames
// (formulary.dev, latlang.org) fall through to https://<host>
const HOST_TO_PROPERTY_KEY = {
  "cartularium.org": "home",
  "sheets.wiki": "wiki",
  "assay.sheets.wiki": "assay",
};

/**
 * URL for a given imprint host. Returns the env-overridden URL for the
 * three served properties, or `https://<host>` for the rest.
 * @param {string} host
 * @returns {string}
 */
export function urlForHost(host) {
  const key = HOST_TO_PROPERTY_KEY[host];
  if (!key) return `https://${host}`;
  return crossPropertyUrls()[key];
}
