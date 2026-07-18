import { userClient } from "./client"

export interface OpenPrParams {
  token: string
  forkOwner: string
  canonical: { owner: string; repo: string }
  branch: string
  baseBranch: string
  title: string
  body: string
}

export interface OpenPrResult {
  number: number
  url: string
  mergeable: boolean | null
}

// mergeable is computed async by GitHub; create-PR always returns null.
// poll pulls.get once after a short delay; if still null, ship optimistically.
const MERGEABLE_POLL_DELAY_MS = 700

function isPrAlreadyExists(e: unknown): boolean {
  if (!e || typeof e !== "object") return false
  const err = e as { status?: number; message?: string }
  if (err.status !== 422) return false
  return typeof err.message === "string" && /pull request already exists/i.test(err.message)
}

export async function openPullRequest(p: OpenPrParams): Promise<OpenPrResult> {
  const gh = userClient(p.token)
  let prNumber: number
  let prUrl: string

  try {
    const r = await gh.pulls.create({
      owner: p.canonical.owner,
      repo: p.canonical.repo,
      head: `${p.forkOwner}:${p.branch}`,
      base: p.baseBranch,
      title: p.title,
      body: p.body,
      maintainer_can_modify: true,
    })
    prNumber = r.data.number
    prUrl = r.data.html_url
  } catch (e) {
    if (!isPrAlreadyExists(e)) throw e
    // re-submit: an open PR for this head already exists. autosaves already
    // landed on the draft branch (squashed by the route handler), so the PR
    // is up-to-date with current content; treat as success.
    const existing = await gh.pulls.list({
      owner: p.canonical.owner,
      repo: p.canonical.repo,
      head: `${p.forkOwner}:${p.branch}`,
      state: "open",
    })
    const pr = existing.data[0]
    if (!pr) throw e
    prNumber = pr.number
    prUrl = pr.html_url
    // honor the user's typed title/body if they differ from the existing PR.
    if (pr.title !== p.title || (pr.body ?? "") !== p.body) {
      await gh.pulls.update({
        owner: p.canonical.owner,
        repo: p.canonical.repo,
        pull_number: prNumber,
        title: p.title,
        body: p.body,
      })
    }
  }

  await new Promise((resolve) => setTimeout(resolve, MERGEABLE_POLL_DELAY_MS))
  const detail = await gh.pulls.get({
    owner: p.canonical.owner,
    repo: p.canonical.repo,
    pull_number: prNumber,
  })
  const mergeable = detail.data.mergeable ?? null

  return { number: prNumber, url: prUrl, mergeable }
}
