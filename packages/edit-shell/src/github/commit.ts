import { userClient } from "./client"

type GhClient = ReturnType<typeof userClient>

export interface WriteFileParams {
  token: string
  owner: string
  repo: string
  branch: string
  baseBranch: string
  path: string
  content: string
  message: string
}

export interface WriteResult {
  commit_sha: string
  content_sha: string
}

// after createRef the new ref is eventually consistent across GitHub's APIs.
// the ref API typically catches up first; getContent and the PUT can still
// 404 / 422 on the same branch for hundreds of ms after.
async function waitForBranchRef(
  gh: GhClient,
  owner: string,
  repo: string,
  branch: string,
  attempts = 6,
  delayMs = 300,
): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await gh.git.getRef({ owner, repo, ref: `heads/${branch}` })
      return
    } catch (e: unknown) {
      const status = (e as { status?: number } | null)?.status
      if ((status === 404 || status === 409) && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs))
        continue
      }
      throw e
    }
  }
}

// retry the write itself on transient 404/422 — the contents API can lag
// the ref API on freshly-created branches even after waitForBranchRef succeeds.
async function retryOnTransientWrite<T>(
  fn: () => Promise<T>,
  attempts = 4,
  delayMs = 400,
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (e: unknown) {
      const status = (e as { status?: number } | null)?.status
      const message = (e as { message?: string } | null)?.message ?? ""
      // 404 = branch not yet visible to contents API.
      // 422 with "not found" / "does not exist" / "did not match" is the same
      //   race surfaced as a validation error. plain 422s (sha mismatch, bad
      //   content) won't match these substrings and propagate normally.
      const transient =
        status === 404 ||
        (status === 422 && /not found|does not exist|did not match/i.test(message))
      if (transient && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs))
        continue
      }
      throw e
    }
  }
  throw new Error("unreachable")
}

export async function writeFileToBranch(p: WriteFileParams): Promise<WriteResult> {
  const gh = userClient(p.token)

  let branchExists = true
  try {
    await gh.git.getRef({ owner: p.owner, repo: p.repo, ref: `heads/${p.branch}` })
  } catch (e: any) {
    if (e?.status !== 404) throw e
    branchExists = false
  }

  if (!branchExists) {
    const base = await gh.git.getRef({
      owner: p.owner,
      repo: p.repo,
      ref: `heads/${p.baseBranch}`,
    })
    await gh.git.createRef({
      owner: p.owner,
      repo: p.repo,
      ref: `refs/heads/${p.branch}`,
      sha: base.data.object.sha,
    })
    await waitForBranchRef(gh, p.owner, p.repo, p.branch)
  }

  // a fresh branch inherits content identical to baseBranch, but reads against
  // it can race propagation; baseBranch is stable. fall back to baseBranch in
  // that case so fileSha is correct (avoids the 422 "did not match null sha"
  // when getContent missed an inherited file).
  const readRef = branchExists ? p.branch : p.baseBranch
  let fileSha: string | undefined
  try {
    const existing = await gh.repos.getContent({
      owner: p.owner,
      repo: p.repo,
      path: p.path,
      ref: readRef,
    })
    if (!Array.isArray(existing.data) && existing.data.type === "file") {
      fileSha = existing.data.sha
    }
  } catch (e: any) {
    if (e?.status !== 404) throw e
  }

  const r = await retryOnTransientWrite(() =>
    gh.repos.createOrUpdateFileContents({
      owner: p.owner,
      repo: p.repo,
      path: p.path,
      branch: p.branch,
      message: p.message,
      content: utf8ToBase64(p.content),
      sha: fileSha,
    }),
  )
  return {
    commit_sha: r.data.commit?.sha ?? "",
    content_sha: r.data.content?.sha ?? "",
  }
}

function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}
