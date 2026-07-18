// dev script: npx tsx quartz/util/functionData.verify.ts
// spot-checks aggregator output against known cases. not a unit test.

import { resolve } from "node:path"
import { homedir } from "node:os"
import { loadFunctionData } from "./functionData.js"

const HOME = homedir()
const data = loadFunctionData({
  latticePath: process.env.CARTULARIUM_LATTICE ?? resolve(HOME, "sandbox/current/lattice"),
  assayPath: process.env.CARTULARIUM_ASSAY ?? resolve(HOME, "sandbox/current/assay"),
})

console.log(`loaded ${data.size} functions`)
console.log()

const probes = [
  "SUM",
  "VLOOKUP",
  "QUERY",
  "INDEX",
  "BAHTTEXT",
  "SUMX2MY2",
  "ABS",
  "DAVERAGE",
  "GOOGLEFINANCE",
]
for (const name of probes) {
  const entry = data.get(name)
  if (!entry) {
    console.log(`${name}: <not found>`)
    continue
  }
  console.log(`${name}:`)
  if (entry.category) console.log(`  category: ${entry.category}`)
  if (entry.syntax) console.log(`  syntax:   ${entry.syntax}`)
  if (entry.engines) {
    const formatted = Object.entries(entry.engines)
      .map(([e, r]) => `${e}=${r.status}${r.via ? `(${r.via})` : ""}`)
      .join(" ")
    console.log(`  engines:  ${formatted}`)
  }
  if (entry.divergences?.length) console.log(`  divergences: ${entry.divergences.join(", ")}`)
  if (entry.tests?.length)
    console.log(
      `  tests:    ${entry.tests.length} (${entry.tests.slice(0, 3).join(", ")}${entry.tests.length > 3 ? ", ..." : ""})`,
    )
  console.log()
}
