import { useEffect, useMemo, useState } from "preact/hooks"
import { Chrome } from "../Chrome"
import { ToastContainer } from "../components/Toast"
import { Palette, type PaletteCommand } from "../components/Palette"
import { KindPicker } from "../components/KindPicker"
import { editShell, type DraftSummary } from "../lib/edit-shell"
import { loadEditIndex } from "../lib/edit-index"
import { kebab } from "../lib/path"
import { shortName, deriveSlug, formatAgo } from "../lib/draft-display"
import { accountFromLogin } from "../lib/account"
import {
  CLOSED_KINDS,
  type EditIndexEntry,
  type EditIndexKind,
} from "@cartularium/contracts"

interface Props {
  userLogin: string
}

export function LandingRoute({ userLogin }: Props) {
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null)
  const [entries, setEntries] = useState<readonly EditIndexEntry[] | null>(null)
  const [query, setQuery] = useState("")
  const [createKind, setCreateKind] = useState<EditIndexKind>("concept")

  useEffect(() => {
    let cancelled = false
    void Promise.all([editShell.listDrafts(), loadEditIndex()]).then(
      ([d, i]) => {
        if (cancelled) return
        setDrafts(d.drafts)
        // loadEditIndex returns LoadedEditIndex (`.entries`); the test mock
        // returns the raw EditIndex shape (also `.entries`), so reading
        // `.entries` works for both.
        setEntries(i.entries)
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !entries) return [] as EditIndexEntry[]
    const hits = entries.filter((e) => {
      const fields = [e.title, e.slug, ...(e.aliases ?? [])]
      return fields.some((f) => f.toLowerCase().includes(q))
    })
    return hits.slice(0, 8)
  }, [query, entries])

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !entries) return null
    return (
      entries.find(
        (e) => e.title.toLowerCase() === q || e.slug.toLowerCase() === q,
      ) ?? null
    )
  }, [query, entries])

  const handleEnter = () => {
    if (exactMatch) {
      window.location.assign(`/edit/${exactMatch.slug}`)
      return
    }
    if (query.trim().length === 0) return
    if (CLOSED_KINDS.has(createKind)) return // safety; UI already disallows it
    const newSlug = `${createKind}/${kebab(query)}`
    window.location.assign(`/edit/${newSlug}`)
  }

  const account = useMemo(() => accountFromLogin(userLogin), [userLogin])
  const commands: PaletteCommand[] = [
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
  ]

  const isFirstTime = drafts !== null && drafts.length === 0
  const isReturning = drafts !== null && drafts.length > 0

  return (
    <Chrome account={account} hasChanges={false}>
      <div class="lineage-strip lineage-strip-landing">
        <span>edit</span>
        <span class="lineage-sep">·</span>
        <span>
          {isFirstTime
            ? "no draft active — your first edit will start one"
            : "no draft selected — pick or start one below"}
        </span>
      </div>

      <main class="landing-host">
        <div class="landing-head">
          <h1>
            {isFirstTime ? (
              <>
                edit sheets.wiki — <em>find a page, or start one.</em>
              </>
            ) : (
              <>
                find a page to edit, <em>or pick up where you left off.</em>
              </>
            )}
          </h1>
          <p class="landing-dek">
            Type a page name to open or create one. Edits move from{" "}
            <strong>draft</strong> to <strong>submitted</strong> to{" "}
            <strong>published</strong>; a maintainer reviews each submission.
          </p>
        </div>

        {isFirstTime && (
          <div class="landing-firsttime-advisory">
            <span class="eye">first time here</span>
            <p>
              Submissions are stored as commits on a draft branch in github and
              reviewed there. You can use the editor without knowing git, but
              you'll need a github account to submit.
            </p>
          </div>
        )}

        {isReturning && drafts && (
          <section class="landing-drafts-ledger" aria-label="active drafts">
            <header class="ledger-head">
              <span>
                active drafts{" "}
                <span class="ct">— {drafts.length} in flight</span>
              </span>
              <a href="/edit/drafts">all drafts ↗</a>
            </header>
            {drafts.slice(0, 5).map((d, i) => {
              // deriveSlug returns null on regex miss; falling back to d.slug
              // avoids producing /edit/ (which would silently link to the
              // landing page itself).
              const slug =
                (d.files[0]?.path && deriveSlug(d.files[0].path)) || d.slug
              return (
              <a
                key={d.branch}
                class={`row${i === 0 ? " most-recent" : ""}`}
                href={`/edit/${slug}`}
              >
                <span class="name">
                  <span class="title">{d.slug}</span>
                  <span class="files">
                    {d.files.slice(0, 3).map((f) => (
                      <span key={f.path} class="f">
                        {shortName(f.path)}
                      </span>
                    ))}
                    {d.files.length > 3 && (
                      <span class="more">+{d.files.length - 3}</span>
                    )}
                  </span>
                </span>
                <span class="ago">{formatAgo(d.updated_at)}</span>
                <span class="resume">resume ↵</span>
              </a>
              )
            })}
          </section>
        )}

        <section class="landing-search" aria-label="find or create a page">
          <div class="landing-slip">
            <span class="stamp">find or create</span>
            <input
              type="text"
              autoFocus
              placeholder="page name, e.g. SUMIF, Volatile functions, your bio"
              aria-label="search pages"
              value={query}
              onInput={(e) =>
                setQuery((e.target as HTMLInputElement).value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEnter()
              }}
            />
            <span class="kbdhint">
              enter <span class="k">↵</span>
            </span>
          </div>

          {query.trim() && entries && (
            <div class="landing-results" role="listbox">
              {matches.map((m) => (
                <a
                  key={m.slug}
                  class={`landing-result kind-${m.kind}`}
                  href={`/edit/${m.slug}`}
                  role="option"
                >
                  <span class="kind">{m.kind.slice(0, 2)}</span>
                  <span class="title">{m.title}</span>
                  <span class="slug">/{m.slug}</span>
                </a>
              ))}
              {!exactMatch && (
                <div class="landing-create">
                  <KindPicker selected={createKind} onSelect={setCreateKind} />
                  <button
                    type="button"
                    class="landing-create-btn"
                    onClick={handleEnter}
                  >
                    create a new page named "<em>{query.trim()}</em>" as{" "}
                    <strong>{createKind}</strong>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <ToastContainer />
      <Palette commands={commands} />
    </Chrome>
  )
}
