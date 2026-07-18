// Post-deploy check: the live index must list exactly as many problems as
// the corpus holds. Retries briefly because Pages edge propagation lags.
import { readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const PKG = join(dirname(fileURLToPath(import.meta.url)), "..")
const LIVE = process.env.LUDUS_LIVE_URL ?? "https://ludus.sheets.wiki/"
const want = readdirSync(join(PKG, "problems")).filter((f) => f.endsWith(".yaml")).length

for (let attempt = 1; attempt <= 6; attempt++) {
  const html = await fetch(LIVE, { headers: { "cache-control": "no-cache" } }).then((r) => r.text())
  const got = (html.match(/prob-card/g) ?? []).length
  if (got === want) {
    console.log(`live check: ${LIVE} lists ${got}/${want} problems`)
    process.exit(0)
  }
  console.log(`live check: ${got}/${want} problems (attempt ${attempt}/6, waiting for edge)`)
  await new Promise((r) => setTimeout(r, 10_000))
}
console.error(`live check FAILED: ${LIVE} does not list ${want} problems`)
process.exit(1)
