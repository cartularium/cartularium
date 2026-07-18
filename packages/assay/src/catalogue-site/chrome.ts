// renders the cartularium chrome (topbar + mobile drawer + footer) for the
// assay catalogue site. mirrors the wiring in
// packages/sheets-wiki/quartz/components/{TopBar,Footer}.tsx and
// packages/cartularium-org/scripts-build/build.mjs.

import {
  TOPBAR_TEMPLATE,
  DRAWER_TEMPLATE,
  FOOTER_TEMPLATE,
  imprintsExcluding,
  crossPropertyUrls,
  render,
} from "@cartularium/chrome";

const ASSAY_HOST = "assay.sheets.wiki";

interface NavLink {
  label: string;
  // path segment (relative to relPath) — wired into both the topbar and
  // drawer hrefs by joining with relPath
  segment: string;
  // value of `current` from the page template that marks this link active
  current?: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "catalogue", segment: "", current: "index" },
  { label: "compare", segment: "compare", current: "compare" },
  { label: "history", segment: "history", current: "history" },
  { label: "about", segment: "about", current: "about" },
  { label: "github ↗", segment: "https://github.com/cartularium/assay" },
];

function joinHref(relPath: string, segment: string): string {
  if (/^https?:/.test(segment)) return segment;
  if (segment === "") return `${relPath}/`;
  return `${relPath}/${segment}`;
}

function navItems(relPath: string, current: string | undefined) {
  return NAV_LINKS.map((link) => ({
    label: link.label,
    href: joinHref(relPath, link.segment),
    active: link.current !== undefined && link.current === current,
  }));
}

export interface ChromeContext {
  topbar: string;
  drawer: string;
  footer: string;
}

export function renderChrome(relPath: string, current: string | undefined): ChromeContext {
  const items = navItems(relPath, current);
  const topbarData = {
    wordmark: { href: `${relPath}/`, label: "assay" },
    nav: { items },
    theme: { icon: "☾" },
    mobile: true,
  };
  const drawerData = {
    nav: { items },
    search: { placeholder: "search" },
    imprints: imprintsExcluding(ASSAY_HOST),
    theme: { icon: "☾" },
  };
  const footerData = {
    imprint: { href: crossPropertyUrls().home, label: "part of cartularium ↗" },
    links: [
      { href: "https://github.com/cartularium/assay", label: "github ↗" },
      { href: `${relPath}/about`, label: "about" },
    ],
  };
  return {
    topbar: render(TOPBAR_TEMPLATE, topbarData),
    drawer: render(DRAWER_TEMPLATE, drawerData),
    footer: render(FOOTER_TEMPLATE, footerData),
  };
}
