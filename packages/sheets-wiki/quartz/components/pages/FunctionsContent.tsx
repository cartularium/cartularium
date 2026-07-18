import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { FunctionRow } from "../../plugins/emitters/functionsPage"
import { enginesByTier } from "@cartularium/chrome"
import type { EnginesMap } from "../../util/functionData"
import style from "../styles/functionsPage.scss"

const PRIMARY = enginesByTier("primary")

function dotClass(engine: string, status: "available" | "partial" | "missing"): string {
  // available → solid color; partial → half-filled; missing/absent → outlined
  if (status === "available") return `dot eng-${engine}`
  return `dot ${status} eng-${engine}`
}

function dotTitle(label: string, engineStatus: EnginesMap[string] | undefined): string {
  if (!engineStatus) return `${label}: missing`
  return engineStatus.via
    ? `${label}: ${engineStatus.status} (${engineStatus.via})`
    : `${label}: ${engineStatus.status}`
}

const FunctionsContent: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  // payload stashed by FunctionsPage emitter
  const payload = fileData.functionsPayload
  if (!payload) return null
  const { byCategory, orderedCategories, totalCount } = payload

  return (
    <div class="fnpage">
      <p class="dek">
        the complete catalogue of spreadsheet functions documented on sheets.wiki, grouped by
        category. {totalCount} entries.
      </p>

      <p class="data-meta">
        data: <a href="functions.tsv">tsv</a> · <a href="functions.json">json</a> ·{" "}
        <a href="functions">permalink</a>
      </p>

      <p class="legend">
        engines:
        {PRIMARY.map((e) => (
          <span class="legend-item">
            <span class={`dot eng-${e.name}`}></span> {e.name}
          </span>
        ))}
        <span class="legend-item">
          <span class="dot state-partial"></span> partial
        </span>
        <span class="legend-item">
          <span class="dot state-missing"></span> missing
        </span>
      </p>

      <nav class="category-bar" aria-label="categories">
        {orderedCategories.map((cat) => (
          <a href={`#${cat}`}>{cat}</a>
        ))}
      </nav>

      {orderedCategories.map((cat) => (
        <section id={cat} class="category-section">
          <h2>{cat}</h2>
          <table class="fn-table">
            <thead>
              <tr>
                <th class="col-name">name</th>
                <th>description</th>
                <th class="col-engines">engines</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.get(cat)!.map((row: FunctionRow) => (
                <tr>
                  <td>
                    <a class="fn-name" href={row.href}>
                      {row.name}
                    </a>
                  </td>
                  <td class="fn-summary">{row.description}</td>
                  <td>
                    <span class="fn-engines">
                      {PRIMARY.map((e) => {
                        const rec = row.engineStatus[e.name]
                        const status = rec?.status ?? "missing"
                        return (
                          <span class={dotClass(e.name, status)} title={dotTitle(e.label, rec)} />
                        )
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}

export default (() => {
  FunctionsContent.css = style
  return FunctionsContent
}) satisfies QuartzComponentConstructor
