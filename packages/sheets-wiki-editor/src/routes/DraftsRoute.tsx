import { useEffect, useMemo, useState } from "preact/hooks"
import { Chrome } from "../Chrome"
import { ToastContainer } from "../components/Toast"
import { Palette, type PaletteCommand } from "../components/Palette"
import { editShell, type DraftSummary } from "../lib/edit-shell"
import { shortName, deriveSlug, formatAgo } from "../lib/draft-display"
import { accountFromLogin } from "../lib/account"

interface Props {
  userLogin: string
}

export function DraftsRoute({ userLogin }: Props) {
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null)

  useEffect(() => {
    let cancelled = false
    void editShell.listDrafts().then((r) => {
      if (!cancelled) setDrafts(r.drafts)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const account = useMemo(() => accountFromLogin(userLogin), [userLogin])
  const sorted = useMemo(() => {
    if (!drafts) return []
    return [...drafts].sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  }, [drafts])

  const commands: PaletteCommand[] = [
    {
      id: "new-draft",
      label: "new draft",
      run: () => window.location.assign("/edit/"),
    },
    {
      id: "sign-out",
      label: "sign out",
      run: async () => {
        await editShell.logout()
        window.location.reload()
      },
    },
  ]

  return (
    <Chrome account={account} hasChanges={false}>
      <div class="lineage-strip lineage-strip-drafts">
        <span>edit</span>
        <span class="lineage-sep">·</span>
        <span>your drafts</span>
        <span class="lineage-sep">·</span>
        <span>
          {drafts === null
            ? "loading…"
            : `${drafts.length} draft${drafts.length === 1 ? "" : "s"}`}
        </span>
      </div>

      <main class="drafts-host">
        <h1>your drafts</h1>
        <p class="drafts-dek">
          A draft is a working set — one or more pages you're editing together.
          Submission can include all of them or a subset.
        </p>

        <div class="drafts-toolbar">
          <a href="/edit/" class="drafts-new">
            + new draft
          </a>
        </div>

        {drafts === null && <p class="drafts-loading">loading drafts…</p>}

        {drafts && drafts.length === 0 && (
          <div class="drafts-empty">
            <p>no drafts yet.</p>
            <p>
              start one by visiting any wiki page and clicking{" "}
              <strong>edit ↗</strong>, or by typing a page name on the{" "}
              <a href="/edit/">edit landing</a>.
            </p>
          </div>
        )}

        {sorted.map((d) => {
          // deriveSlug returns null on regex miss; falling back to d.slug
          // avoids producing /edit/ (which would silently link to the
          // landing page itself).
          const resumeSlug =
            (d.files[0]?.path && deriveSlug(d.files[0].path)) || d.slug
          return (
            <article key={d.branch} class="draft-card">
              <header class="dc-head">
                <div class="dc-title">
                  <div class="dc-name">
                    {d.slug}
                    <span class="file-count">
                      {d.files.length} file{d.files.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div class="dc-meta">edited {formatAgo(d.updated_at)}</div>
                </div>
                <div class="dc-totals">
                  <span class="added">+{d.added}</span>
                  {d.removed > 0 && <span class="removed">−{d.removed}</span>}
                </div>
                <div class="dc-actions">
                  <a href={`/edit/${resumeSlug}`} class="primary">
                    resume
                  </a>
                </div>
              </header>
              <ul class="dc-files">
                {d.files.map((f) => {
                  const fileSlug = deriveSlug(f.path) ?? d.slug
                  return (
                    <li key={f.path} class="dc-file">
                      <a class="dc-fname" href={`/edit/${fileSlug}`}>
                        {shortName(f.path)}
                      </a>
                      <span class="dc-fdiff">
                        <span class="added">+{f.added}</span>
                        {f.removed > 0 && (
                          <span class="removed">−{f.removed}</span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </article>
          )
        })}
      </main>

      <ToastContainer />
      <Palette commands={commands} />
    </Chrome>
  )
}
