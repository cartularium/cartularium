import { Hono } from "hono"
import * as v from "valibot"
import type { Env } from "../env"
import { readFile } from "../github/tree"
import { writeFileToBranch } from "../github/commit"
import { findOrCreateFork } from "../github/fork"
import { updateSession } from "../auth/session"
import { pathToBranchSlug } from "../util/slug"

const app = new Hono<{ Bindings: Env }>()

const PutBody = v.object({
  content: v.string(),
  branch: v.optional(v.pipe(v.string(), v.regex(/^[A-Za-z0-9._\-/]+$/))),
  message: v.optional(v.string()),
})

// reject absolute or dotted paths; pathToBranchSlug normalizes .. otherwise.
function isSafeRelativePath(p: string): boolean {
  if (!p || p.startsWith("/")) return false
  return p.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..")
}

app.get("/:path{.+}", async (c) => {
  const path = decodeURIComponent(c.req.param("path"))
  if (!isSafeRelativePath(path)) return c.json({ error: "bad_path" }, 400)

  const fromFork = c.req.query("fork") === "true"
  let owner: string
  let repo: string
  if (fromFork) {
    const forkRepo = c.var.session.fork_repo
    if (!forkRepo) return c.json({ error: "no_fork" }, 404)
    const [forkOwner, forkRepoName] = forkRepo.split("/")
    if (!forkOwner || !forkRepoName) return c.json({ error: "bad_fork_repo" }, 500)
    owner = forkOwner
    repo = forkRepoName
  } else {
    owner = c.env.CANONICAL_OWNER
    repo = c.env.CANONICAL_REPO
  }

  const file = await readFile({
    token: c.var.session.user_token,
    owner,
    repo,
    path,
    ref: c.req.query("ref"),
  })
  if (!file) return c.json({ error: "not_found" }, 404)
  return c.json(file)
})

app.put("/:path{.+}", async (c) => {
  const path = decodeURIComponent(c.req.param("path"))
  if (!isSafeRelativePath(path)) return c.json({ error: "bad_path" }, 400)
  const parsed = v.safeParse(PutBody, await c.req.json())
  if (!parsed.success) return c.json({ error: "bad_body" }, 400)

  let forkRepo = c.var.session.fork_repo
  if (!forkRepo) {
    const fork = await findOrCreateFork({
      token: c.var.session.user_token,
      forkOwner: c.var.session.user_login,
      canonical: { owner: c.env.CANONICAL_OWNER, repo: c.env.CANONICAL_REPO },
    })
    forkRepo = fork.full_name
    await updateSession(c.env.SESSIONS, c.var.sessionId, { fork_repo: forkRepo })
  }

  const [forkOwner, forkRepoName] = forkRepo.split("/")
  if (!forkOwner || !forkRepoName) return c.json({ error: "bad_fork_repo" }, 500)
  const branch =
    parsed.output.branch ??
    `draft/${c.var.session.user_login}/${pathToBranchSlug(path)}`
  const message = parsed.output.message ?? `edit ${path}`

  let result
  try {
    result = await writeFileToBranch({
      token: c.var.session.user_token,
      owner: forkOwner,
      repo: forkRepoName,
      branch,
      baseBranch: "main",
      path,
      content: parsed.output.content,
      message,
    })
  } catch (e: unknown) {
    // 422 from createRef = ref already exists (concurrent-edit race).
    if (typeof e === "object" && e !== null && (e as { status?: unknown }).status === 422) {
      return c.json({ error: "branch_conflict" }, 409)
    }
    throw e
  }
  return c.json({ branch, commit_sha: result.commit_sha, content_sha: result.content_sha })
})

export default app
