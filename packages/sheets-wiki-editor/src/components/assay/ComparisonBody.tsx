import { useMemo, useState } from "preact/hooks"
import {
  compareAssayGrids,
  type AssayCompareVerdict,
  type AssayGridValue,
  type AssayPreviewPlatformInspection,
} from "@cartularium/contracts"
import { formatCell } from "./format"

interface Props {
  platforms: AssayPreviewPlatformInspection[]
}

const TARGET_EXPECTED = "expected"

export function ComparisonBody({ platforms }: Props) {
  const platformsWithData = platforms.filter((p) => p.result)
  const hasExpected = platformsWithData.some((p) => p.expected)
  const expectedGrid = platformsWithData.find((p) => p.expected)?.expected

  const [target, setTarget] = useState<string>(
    hasExpected ? TARGET_EXPECTED : (platformsWithData[0]?.platform ?? ""),
  )
  const [refs, setRefs] = useState<string[]>(() =>
    platformsWithData.filter((p) => p.platform !== target).map((p) => p.platform),
  )

  function changeTarget(next: string) {
    setRefs((prev) => {
      const filtered = prev.filter((r) => r !== next)
      if (target !== next && target !== TARGET_EXPECTED && !filtered.includes(target)) {
        filtered.push(target)
      }
      return filtered
    })
    setTarget(next)
  }

  function toggleRef(name: string) {
    setRefs((prev) =>
      prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name],
    )
  }

  const rows = useMemo(() => {
    const targetGrid: AssayGridValue | null =
      target === TARGET_EXPECTED
        ? (expectedGrid ?? null)
        : (platformsWithData.find((p) => p.platform === target)?.result ?? null)
    const refGrids: Record<string, AssayGridValue | null> = {}
    for (const name of refs) {
      refGrids[name] = platformsWithData.find((p) => p.platform === name)?.result ?? null
    }
    // when target is a platform (not 'expected'), prepend the synthetic
    // 'expected' row so reviewers can see how each ref compares to expected.
    const options =
      target !== TARGET_EXPECTED && expectedGrid ? { expected: expectedGrid } : undefined
    return compareAssayGrids(targetGrid, refGrids, options).rows
  }, [target, refs, platformsWithData, expectedGrid])

  // the synthetic 'expected' row is never folded
  const visible = rows.filter((r) => r.verdict !== "match" || r.address === "expected")
  const matching = rows.length - visible.length

  return (
    <div class="comparison-body">
      <div class="comparison-pickers">
        <label class="comparison-picker">
          <span>target</span>
          <select
            aria-label="target"
            value={target}
            onChange={(e) => changeTarget((e.target as HTMLSelectElement).value)}
          >
            {hasExpected && <option value={TARGET_EXPECTED}>expected</option>}
            {platformsWithData.map((p) => (
              <option key={p.platform} value={p.platform}>
                {p.platform}
              </option>
            ))}
          </select>
        </label>
        <fieldset class="comparison-refs">
          <legend>refs</legend>
          {platformsWithData
            .filter((p) => p.platform !== target)
            .map((p) => (
              <label key={p.platform} class="comparison-ref-checkbox">
                <input
                  type="checkbox"
                  checked={refs.includes(p.platform)}
                  onChange={() => toggleRef(p.platform)}
                />
                <span class={`eng-mini eng-${p.platform}`}>{p.platform}</span>
              </label>
            ))}
        </fieldset>
      </div>

      <table class="comparison-table">
        <thead>
          <tr>
            <th>cell</th>
            <th>target</th>
            <th>refs ({refs.length})</th>
            <th>verdict</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.address} class={`comparison-row verdict-${row.verdict}`}>
              <td class="cell-addr">
                <span class="cp-pill">{row.address}</span>
              </td>
              <td class="cell-target">{formatCell(row.targetValue).display}</td>
              <td class="cell-refs">
                <div class="ref-vals-inner">
                  {refs.map((name) => (
                    <span key={name} class="ref-val">
                      <span class={`chip eng eng-${name}`}>{name}</span>
                      {formatCell(row.refValues[name] ?? null).display}
                    </span>
                  ))}
                </div>
              </td>
              <td class="cell-verdict">
                <span class={`verdict-tag verdict-tag-${row.verdict}`}>
                  {verdictLabel(row.verdict)}
                </span>
              </td>
            </tr>
          ))}
          {matching > 0 && (
            <tr class="comparison-row comparison-row-folded">
              <td colSpan={4}>
                + {matching} matching {matching === 1 ? "cell" : "cells"} (collapsed)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function verdictLabel(v: AssayCompareVerdict): string {
  return v
}
