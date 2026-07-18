import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"
import { resolve } from "node:path"
import { homedir } from "node:os"

// quartz transpiles this config into .quartz-cache/, so import.meta.url here
// would resolve to the cache. process.cwd() is the package dir under
// `pnpm --filter sheets-wiki run build`, which is what we want.
const HERE = process.cwd()
const HOME = homedir()
const cartulariumPaths = {
  // assay sibling package; manifest preferred when assay catalogue has been built
  assayPath: process.env.CARTULARIUM_ASSAY ?? resolve(HERE, "../assay"),
  manifestPath:
    process.env.CARTULARIUM_ASSAY_MANIFEST ?? resolve(HERE, "../assay/build/site/manifest.json"),
  // lattice has its own repo; expect a sibling sandbox checkout
  latticePath: process.env.CARTULARIUM_LATTICE ?? resolve(HOME, "sandbox/current/lattice"),
}

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "sheets.wiki",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "sheets.wiki",
    ignorePatterns: ["private", "templates", ".obsidian", "README.md"],
    defaultDateType: "modified",
    // colors and fonts mapped to cartularium brand kernel (see @cartularium/brand).
    // Quartz's slot names are kept; values point at kernel paper-and-ink palette.
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Fraunces",
        body: "IBM Plex Sans",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#faf5e8", // paper
          lightgray: "#f4eee0", // paper-2
          gray: "#6e655a", // ink-3 (muted)
          darkgray: "#3d3530", // ink-2 (secondary text)
          dark: "#1a1614", // ink (primary text)
          secondary: "#1f4040", // accent (teal)
          tertiary: "#2d5959", // accent-2
          highlight: "rgba(31, 64, 64, 0.08)", // accent-tint
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#161310", // paper
          lightgray: "#1f1b16", // paper-2
          gray: "#948b78", // ink-3
          darkgray: "#c8c0ad", // ink-2
          dark: "#f0e9d8", // ink
          secondary: "#6ba0a0", // accent
          tertiary: "#4d8585", // accent-2
          highlight: "rgba(107, 160, 160, 0.12)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.SheetsWikiSlugs(),
      Plugin.FrontMatter(),
      // Assay feed disconnected per the surface-pull decision
      // (internal decisions/2026-07-18-assay-pull-compatibility-surfaces.md):
      // V4 verdict data does not reach the wiki; lattice reference TSVs
      // (function existence) still load. Compatibility sections return when
      // the re-founded, verdict-free data exists.
      Plugin.CartulariumData({ latticePath: cartulariumPaths.latticePath }),
      Plugin.AssayRefs({ mode: "degraded" }),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.Sidenotes(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.FunctionsPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.EditIndex(),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
