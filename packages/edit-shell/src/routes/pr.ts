import { Hono } from "hono"
import * as v from "valibot"
import type { Env } from "../env"
import { openPullRequest } from "../github/pr"
import { squashDraftBranch } from "../github/squash"

const app = new Hono<{ Bindings: Env }>()

const Body = v.object({
  branch: v.pipe(v.string(), v.regex(/^[A-Za-z0-9._\-/]+$/)),
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  body: v.pipe(v.string(), v.maxLength(10_000)),
})

app.post("/", async (c) => {
  const fork = c.var.session.fork_repo
  if (!fork) return c.json({ error: "no_fork" }, 400)
  const parsed = v.safeParse(Body, await c.req.json())
  if (!parsed.success) return c.json({ error: "bad_body" }, 400)

  const [forkOwner, forkRepoName] = fork.split("/")
  if (!forkOwner || !forkRepoName) return c.json({ error: "bad_fork_repo" }, 500)

  await squashDraftBranch({
    token: c.var.session.user_token,
    forkOwner,
    forkRepo: forkRepoName,
    branch: parsed.output.branch,
    baseBranch: "main",
    message: parsed.output.body
      ? `${parsed.output.title}\n\n${parsed.output.body}`
      : parsed.output.title,
  })

  const result = await openPullRequest({
    token: c.var.session.user_token,
    forkOwner,
    canonical: { owner: c.env.CANONICAL_OWNER, repo: c.env.CANONICAL_REPO },
    branch: parsed.output.branch,
    baseBranch: "main",
    title: parsed.output.title,
    body: parsed.output.body,
  })

  // mergeable null = still computing; falls through to success on purpose.
  if (result.mergeable === false) {
    return c.json(
      {
        error: "conflict",
        pr_url: result.url,
        pr_number: result.number,
        message:
          "draft conflicts with main; resolve via github web ui then re-submit",
      },
      409,
    )
  }

  return c.json(result)
})

export default app
