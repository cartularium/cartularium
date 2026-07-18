// shared eta engine pointed at this directory's templates/
// renderPage wraps a page template in layout.html with the cartularium chrome
// (topbar + drawer + footer) injected from @cartularium/chrome.

import { Eta } from "eta";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderChrome } from "./chrome.js";

const TEMPLATES_DIR = join(dirname(fileURLToPath(import.meta.url)), "templates");
const ASSET_VERSION = process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "dev";

export const eta = new Eta({ views: TEMPLATES_DIR });

export interface PageLayout {
  title: string;
  relPath: string;
  // identifier matching one of the topbar nav `current` values; undefined
  // means no nav item is highlighted (used by detail pages like dv/test/suite)
  current?: string;
  scripts?: string[];
}

export function renderPage(name: string, layout: PageLayout, data: Record<string, unknown>): string {
  const body = eta.render(name + ".html", data);
  const chrome = renderChrome(layout.relPath, layout.current);
  return eta.render("layout.html", { ...layout, body, chrome, assetVersion: ASSET_VERSION });
}
