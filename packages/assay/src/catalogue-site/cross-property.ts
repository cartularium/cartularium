// Cross-property URL helper. Mirrors `@cartularium/chrome`'s
// `crossPropertyUrls()` (assay has no chrome workspace dep). Defaults track
// `packages/brand/data/properties.json`; if those change, update here.

export interface CrossPropertyUrls {
  home: string;
  wiki: string;
  assay: string;
}

const PROD: CrossPropertyUrls = {
  home: "https://cartularium.org",
  wiki: "https://sheets.wiki",
  assay: "https://assay.sheets.wiki",
};

export function crossPropertyUrls(): CrossPropertyUrls {
  return {
    home: process.env.CARTULARIUM_HOME_URL || PROD.home,
    wiki: process.env.CARTULARIUM_WIKI_URL || PROD.wiki,
    assay: process.env.CARTULARIUM_ASSAY_URL || PROD.assay,
  };
}
