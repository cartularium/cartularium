import { useCallback, useEffect, useMemo, useState } from "preact/hooks"
import { inspectAssayPreviewResult } from "@cartularium/contracts"
import { Chrome } from "../Chrome"
import { ToastContainer } from "../components/Toast"
import { Palette, type PaletteCommand } from "../components/Palette"
import { MaintainerRefs } from "../components/assay/MaintainerRefs"
import { ResultInspector } from "../components/assay/ResultInspector"
import {
  editShell,
  type AssayCaseCandidate,
  type AssayContractsResponse,
  type AssayPrProposalResponse,
  type AssayPreviewRunResponse,
  type AssayRunnerStatusResponse,
  type AssaySubmittedCaseStatus,
  type AssaySubmittedCaseSummary,
  type SubmittedCaseDetailResponse,
} from "../lib/edit-shell"
import { accountFromLogin } from "../lib/account"

interface Props {
  userLogin: string
}

type StatusFilter = AssaySubmittedCaseStatus | "all"

const STATUS_FILTERS: StatusFilter[] = ["submitted", "draft", "accepted", "rejected", "all"]
const CATEGORIES = ["value", "shape", "error-code", "format", "locale", "interaction", "volatile"]

export function AssayRoute({ userLogin }: Props) {
  const [contracts, setContracts] = useState<AssayContractsResponse | null>(null)
  const [runnerStatus, setRunnerStatus] = useState<AssayRunnerStatusResponse | null>(null)
  const [cases, setCases] = useState<AssaySubmittedCaseSummary[] | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SubmittedCaseDetailResponse | null>(null)
  const [latestRun, setLatestRun] = useState<AssayPreviewRunResponse | null>(null)
  const [proposal, setProposal] = useState<AssayPrProposalResponse["proposal"] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const [subject, setSubject] = useState("SUM")
  const [name, setName] = useState("")
  const [category, setCategory] = useState("value")
  const [formula, setFormula] = useState("")
  const [expected, setExpected] = useState("")
  const [grid, setGrid] = useState("")
  const [features, setFeatures] = useState("")
  const [tags, setTags] = useState("")
  const [platforms, setPlatforms] = useState("")
  const [canonicalCaseId, setCanonicalCaseId] = useState("")
  const [rejectCode, setRejectCode] = useState("maintainer_rejected")
  const [rejectMessage, setRejectMessage] = useState("")

  const loadCases = useCallback(async (filter = statusFilter) => {
    const response = await editShell.listSubmittedCases(filter === "all" ? undefined : filter)
    setCases(response.submittedCases)
    setSelectedId((current) => {
      if (current && response.submittedCases.some((it) => it.id === current)) return current
      return response.submittedCases[0]?.id ?? null
    })
  }, [statusFilter])

  const loadDetail = useCallback(async (id: string) => {
    const [detailResponse, runResponse] = await Promise.all([
      editShell.getSubmittedCase(id),
      editShell.getSubmittedCaseLatestRun(id).catch(() => null),
    ])
    setDetail(detailResponse)
    setLatestRun(runResponse)
    setProposal(null)
  }, [])

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      editShell.getAssayContracts(),
      editShell.getAssayRunnerStatus().catch(() => null),
    ]).then(([contractsResponse, runnerResponse]) => {
      if (cancelled) return
      setContracts(contractsResponse)
      setRunnerStatus(runnerResponse)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setCases(null)
    void editShell.listSubmittedCases(statusFilter === "all" ? undefined : statusFilter).then((response) => {
      if (cancelled) return
      setCases(response.submittedCases)
      setSelectedId((current) => {
        if (current && response.submittedCases.some((it) => it.id === current)) return current
        return response.submittedCases[0]?.id ?? null
      })
    }).catch((err) => {
      if (!cancelled) setError(errorText(err))
    })
    return () => {
      cancelled = true
    }
  }, [statusFilter])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      setLatestRun(null)
      return
    }
    let cancelled = false
    void Promise.all([
      editShell.getSubmittedCase(selectedId),
      editShell.getSubmittedCaseLatestRun(selectedId).catch(() => null),
    ]).then(([detailResponse, runResponse]) => {
      if (cancelled) return
      setDetail(detailResponse)
      setLatestRun(runResponse)
      setProposal(null)
    }).catch((err) => {
      if (!cancelled) setError(errorText(err))
    })
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const selected = detail?.submittedCase.id === selectedId ? detail.submittedCase : null
  const activeDetail = selected ? detail : null
  const defaultPlatforms = contracts?.platforms.defaultReview.join(", ") ?? "excel, gsheets"

  const inspection = useMemo(() => {
    if (!latestRun?.result || !selected) return null
    return inspectAssayPreviewResult(latestRun.result, {
      requestedPlatforms: selected.requestedPlatforms,
    })
  }, [latestRun?.result, selected?.requestedPlatforms])

  const runAction = async (fn: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    setError(null)
    setActionMessage(null)
    try {
      await fn()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const buildCandidate = (): AssayCaseCandidate => {
    const cleanName = name.trim()
    if (!cleanName) throw new Error("name is required")
    const cleanSubject = subject.trim()
    if (!cleanSubject) throw new Error("subject is required")
    const cleanFormula = formula.trim()
    if (!cleanFormula.startsWith("=")) throw new Error("formula must start with =")
    const slug = slugPart(cleanName)
    const candidate: AssayCaseCandidate = {
      id: `submitted/${slug}-${Date.now()}`,
      subject: cleanSubject,
      name: cleanName,
      category,
      formula: cleanFormula,
    }
    const parsedExpected = parseOptionalValue(expected)
    if (parsedExpected !== undefined) candidate.expect = parsedExpected
    const parsedGrid = parseOptionalObject(grid, "grid")
    if (parsedGrid) candidate.grid = parsedGrid
    const parsedFeatures = csvList(features)
    if (parsedFeatures.length > 0) candidate.features = parsedFeatures
    const parsedTags = csvList(tags)
    if (parsedTags.length > 0) candidate.tags = parsedTags
    return candidate
  }

  const createDraft = async () => {
    const candidate = buildCandidate()
    const requestedPlatforms = csvList(platforms)
    const created = await editShell.createSubmittedCase({
      contractVersion: 1,
      draftId: `draft/${userLogin}/assay-${slugPart(candidate.name ?? candidate.subject)}`,
      requestedPlatforms: requestedPlatforms.length > 0 ? requestedPlatforms : undefined,
      case: candidate,
    })
    setStatusFilter("draft")
    setSelectedId(created.submittedCase.id)
    await loadDetail(created.submittedCase.id)
    await loadCases("draft")
    setActionMessage(`stored draft ${created.submittedCase.id}`)
  }

  const submitAndPreview = async () => {
    const candidate = buildCandidate()
    const requestedPlatforms = csvList(platforms)
    const created = await editShell.createSubmittedCase({
      contractVersion: 1,
      draftId: `draft/${userLogin}/assay-${slugPart(candidate.name ?? candidate.subject)}`,
      requestedPlatforms: requestedPlatforms.length > 0 ? requestedPlatforms : undefined,
      case: candidate,
    })
    await editShell.submitSubmittedCase(created.submittedCase.id)
    const queued = await editShell.previewSubmittedCase(created.submittedCase.id, { priority: 10 })
    setStatusFilter("submitted")
    setSelectedId(created.submittedCase.id)
    await loadDetail(created.submittedCase.id)
    await loadCases("submitted")
    setActionMessage(`queued preview job ${queued.job.id}`)
  }

  const refreshSelected = async () => {
    if (!selectedId) return
    await loadDetail(selectedId)
    await loadCases()
    setActionMessage("refreshed assay state")
  }

  const queuePreview = async () => {
    if (!selectedId) return
    const queued = await editShell.previewSubmittedCase(selectedId, { priority: 10 })
    await refreshSelected()
    setActionMessage(`queued preview job ${queued.job.id}`)
  }

  const acceptSelected = async () => {
    if (!selectedId || !canonicalCaseId.trim()) return
    await editShell.acceptSubmittedCase(selectedId, { canonicalCaseId: canonicalCaseId.trim() })
    setStatusFilter("accepted")
    await loadDetail(selectedId)
    await loadCases("accepted")
    setActionMessage(`accepted as ${canonicalCaseId.trim()}`)
  }

  const rejectSelected = async () => {
    if (!selectedId) return
    await editShell.rejectSubmittedCase(selectedId, {
      errorCode: rejectCode.trim() || "maintainer_rejected",
      errorMessage: rejectMessage.trim() || "Rejected during maintainer review.",
    })
    setStatusFilter("rejected")
    await loadDetail(selectedId)
    await loadCases("rejected")
    setActionMessage("rejected submitted case")
  }

  const loadProposal = async () => {
    if (!selectedId) return
    const response = await editShell.getAssayPrProposal(selectedId)
    setProposal(response.proposal)
  }

  const commands = useMemo<PaletteCommand[]>(() => [
    {
      id: "refresh-assay",
      label: "refresh assay",
      run: () => void runAction(refreshSelected),
    },
    {
      id: "go-drafts",
      label: "go to drafts",
      run: () => window.location.assign("/edit/drafts"),
    },
    {
      id: "sign-out",
      label: "sign out",
      run: async () => {
        await editShell.logout()
        window.location.reload()
      },
    },
  ], [refreshSelected])

  return (
    <Chrome account={accountFromLogin(userLogin)} hasChanges={false}>
      <div class="lineage-strip lineage-strip-assay">
        <span>edit</span>
        <span class="lineage-sep">·</span>
        <span>assay workbench</span>
        <span class="lineage-sep">·</span>
        <span>{runnerStatus ? `runner ${runnerStatus.status}` : "runner status unavailable"}</span>
      </div>

      <section class="assay-host">
        <header class="assay-head">
          <div>
            <h1>assay workbench</h1>
          </div>
          <div class="assay-runner">
            <span class={`assay-dot status-${runnerStatus?.status ?? "unknown"}`} />
            <span>{runnerStatus?.status ?? "unknown"}</span>
            <code>{defaultPlatforms}</code>
          </div>
        </header>

        {error && <div class="assay-alert error">{error}</div>}
        {actionMessage && <div class="assay-alert success">{actionMessage}</div>}

        <div class="assay-layout">
          <form
            class="assay-panel assay-form"
            onSubmit={(e) => {
              e.preventDefault()
              void runAction(submitAndPreview)
            }}
          >
            <header class="assay-panel-head">
              <h2>new case</h2>
              <span>contract v1</span>
            </header>

            <label>
              <span>subject</span>
              <input value={subject} onInput={(e) => setSubject((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              <span>name</span>
              <input value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              <span>category</span>
              <select value={category} onChange={(e) => setCategory((e.target as HTMLSelectElement).value)}>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span>formula</span>
              <input value={formula} onInput={(e) => setFormula((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              <span>expected</span>
              <textarea rows={3} value={expected} onInput={(e) => setExpected((e.target as HTMLTextAreaElement).value)} />
            </label>
            <label>
              <span>grid json</span>
              <textarea rows={3} value={grid} onInput={(e) => setGrid((e.target as HTMLTextAreaElement).value)} />
            </label>
            <label>
              <span>features</span>
              <input value={features} onInput={(e) => setFeatures((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              <span>tags</span>
              <input value={tags} onInput={(e) => setTags((e.target as HTMLInputElement).value)} />
            </label>
            <label>
              <span>platforms</span>
              <input
                placeholder={defaultPlatforms}
                value={platforms}
                onInput={(e) => setPlatforms((e.target as HTMLInputElement).value)}
              />
            </label>
            <footer class="assay-actions">
              <button type="button" onClick={() => void runAction(createDraft)} disabled={busy}>store draft</button>
              <button type="submit" class="primary" disabled={busy}>submit + preview</button>
            </footer>
          </form>

          <section class="assay-panel assay-queue">
            <header class="assay-panel-head">
              <h2>review queue</h2>
              <button type="button" onClick={() => void runAction(() => loadCases())} disabled={busy}>refresh</button>
            </header>
            <div class="assay-tabs">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  class={statusFilter === status ? "active" : ""}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
            {cases === null && <p class="assay-loading">loading cases...</p>}
            {cases?.length === 0 && <p class="assay-empty">no cases in this view.</p>}
            <ol class="assay-case-list">
              {cases?.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    class={selectedId === item.id ? "selected" : ""}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span class="case-title">{item.canonicalCaseId ?? item.localCaseId}</span>
                    <span class="case-meta">
                      {item.status} · {item.requestedPlatforms.join(", ")}
                    </span>
                    <span class="case-state">
                      job {item.latestJob?.state ?? "none"} · result {item.latestResult?.state ?? "none"}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section class="assay-panel assay-detail">
            <header class="assay-panel-head">
              <h2>case detail</h2>
              {selectedId && <button type="button" onClick={() => void runAction(refreshSelected)} disabled={busy}>refresh</button>}
            </header>
            {!selected && <p class="assay-empty">select a submitted case.</p>}
            {selected && activeDetail && (
              <>
                <div class="assay-detail-header">
                  <div class="case-title-line">
                    <code>{selected.localCaseId}</code>
                    <span class={`status-chip status-${selected.status}`}>{selected.status}</span>
                  </div>
                  <div class="case-meta-line">
                    <span>owner {selected.ownerId}</span>
                    <span>
                      platforms <code>{selected.requestedPlatforms.join(", ")}</code>
                    </span>
                  </div>
                </div>

                {!latestRun?.result && (
                  <div class="no-result-placeholder">
                    no preview run yet
                    <button
                      type="button"
                      onClick={() => void runAction(queuePreview)}
                      disabled={busy}
                    >
                      queue preview
                    </button>
                  </div>
                )}

                {latestRun?.result && inspection && (
                  <ResultInspector
                    inspection={inspection}
                    rawPayload={latestRun.result}
                    rawDiagnostics={latestRun.result.diagnostics ?? []}
                  />
                )}

                <MaintainerRefs
                  references={activeDetail.reviewReferences}
                  latestResult={activeDetail.latestResult}
                />

                <div class="assay-review-actions">
                  <button type="button" onClick={() => void runAction(queuePreview)} disabled={busy}>queue preview</button>
                  <label>
                    <span>canonical ref</span>
                    <input
                      value={canonicalCaseId}
                      placeholder="SUM/sum-proof"
                      onInput={(e) => setCanonicalCaseId((e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <button
                    type="button"
                    class="primary"
                    onClick={() => void runAction(acceptSelected)}
                    disabled={busy || !canonicalCaseId.trim() || activeDetail.latestResult?.state !== "completed"}
                  >
                    accept
                  </button>
                  <label>
                    <span>reject code</span>
                    <input value={rejectCode} onInput={(e) => setRejectCode((e.target as HTMLInputElement).value)} />
                  </label>
                  <label>
                    <span>reject message</span>
                    <input value={rejectMessage} onInput={(e) => setRejectMessage((e.target as HTMLInputElement).value)} />
                  </label>
                  <button type="button" onClick={() => void runAction(rejectSelected)} disabled={busy}>reject</button>
                  {selected.status === "accepted" && (
                    <button type="button" onClick={() => void runAction(loadProposal)} disabled={busy}>proposal</button>
                  )}
                </div>

                {proposal && (
                  <section class="assay-proposal">
                    <h3>{proposal.prTitle}</h3>
                    <p><code>{proposal.suggestedPath}</code></p>
                    <pre>{proposal.yaml}</pre>
                  </section>
                )}
              </>
            )}
          </section>
        </div>
      </section>

      <ToastContainer />
      <Palette commands={commands} />
    </Chrome>
  )
}

function csvList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseOptionalValue(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  try {
    return JSON.parse(trimmed)
  } catch {
    return trimmed
  }
}

function parseOptionalObject(value: string, field: string): Record<string, unknown> | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = JSON.parse(trimmed) as unknown
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${field} must be a JSON object`)
  }
  return parsed as Record<string, unknown>
}

function slugPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "case"
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : "unknown error"
}
