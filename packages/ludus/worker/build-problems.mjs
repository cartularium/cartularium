// Bundle the YAML corpus into a JSON module for the Worker (wrangler bundles
// JSON imports; it has no YAML loader). Hidden cases are INCLUDED here — this
// file ships only to the judge service, never to the static site.
import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "yaml"

const PKG = join(dirname(fileURLToPath(import.meta.url)), "..")
const problems = {}
for (const f of readdirSync(join(PKG, "problems"))) {
  if (!f.endsWith(".yaml")) continue
  const p = parse(readFileSync(join(PKG, "problems", f), "utf8"))
  problems[p.id] = p
}
writeFileSync(join(PKG, "worker", "problems.gen.json"), JSON.stringify(problems))
console.log(`bundled ${Object.keys(problems).length} problem(s) → worker/problems.gen.json`)
