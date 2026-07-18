// copy + compile non-ts assets into the build tree alongside the compiled js.
// run after `tsc`. responsibilities:
//   - compile catalogue-site/assets/styles.scss → build/.../assets/styles.css
//     (pulls @cartularium/brand tokens + @cartularium/chrome layer via @use)
//   - copy js assets verbatim
//   - copy chrome.js from @cartularium/chrome so the topbar/drawer/theme
//     toggle wires up at runtime
//   - copy templates verbatim

import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import * as sass from "sass";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = resolve(HERE, "..");
const SRC_ASSETS = join(PKG, "src/catalogue-site/assets");
const SRC_TEMPLATES = join(PKG, "src/catalogue-site/templates");
const OUT_ASSETS = join(PKG, "build/catalogue-site/assets");
const OUT_TEMPLATES = join(PKG, "build/catalogue-site/templates");

const require = createRequire(pathToFileURL(join(PKG, "package.json")));

mkdirSync(OUT_ASSETS, { recursive: true });

// JS assets copy 1:1
for (const name of ["compare.js", "filter.js", "history.js"]) {
  cpSync(join(SRC_ASSETS, name), join(OUT_ASSETS, name));
}

// chrome runtime: same script the wiki + cartularium-org load. owns the
// drawer trigger, theme toggle, and active-section tracking.
cpSync(require.resolve("@cartularium/chrome/scripts/chrome.js"), join(OUT_ASSETS, "chrome.js"));

// styles.scss: brand tokens + chrome layer + assay-domain rules → one css file.
// loadPaths lets `@use "@cartularium/..."` resolve via the workspace symlinks.
const cssResult = sass.compile(join(SRC_ASSETS, "styles.scss"), {
  loadPaths: [join(PKG, "node_modules"), resolve(PKG, "../../node_modules")],
  style: "compressed",
});
writeFileSync(join(OUT_ASSETS, "styles.css"), cssResult.css);

cpSync(SRC_TEMPLATES, OUT_TEMPLATES, { recursive: true });
