import { useMemo, useState } from "preact/hooks"
import { Chrome } from "../Chrome"
import { ToastContainer } from "../components/Toast"
import { KindPicker, looksFunctionShaped } from "../components/KindPicker"
import { accountFromLogin } from "../lib/account"
import type { EditIndexKind } from "@cartularium/contracts"

interface Props {
  slug: string
  userLogin: string
}

export function MissingSlugRoute({ slug, userLogin }: Props) {
  const [kind, setKind] = useState<EditIndexKind>("concept")
  const account = useMemo(() => accountFromLogin(userLogin), [userLogin])
  const closedKind = looksFunctionShaped(slug)

  const onCreate = () => {
    const newSlug = `${kind}/${slug}`
    window.location.assign(`/edit/${newSlug}`)
  }

  const onCancel = () => window.location.assign("/edit/")

  return (
    <Chrome account={account} hasChanges={false}>
      <div class="lineage-strip lineage-strip-missing">
        <span>edit</span>
        <span class="lineage-sep">·</span>
        <span>no match — pick a kind to create</span>
      </div>

      <main class="missing-host">
        <div class="missing-card">
          <div class="missing-eyebrow">no match · 2,665 indexed</div>
          <h1>No page named <code>{slug}</code>.</h1>
          <p class="missing-dek">Pick a kind to create one — or cancel and search for the page you meant.</p>
          <KindPicker selected={kind} onSelect={setKind} closedKindEscape={closedKind} />
          <div class="missing-foot">
            <button type="button" class="missing-cancel" onClick={onCancel}>cancel</button>
            <button type="button" class="missing-create" onClick={onCreate}>
              {`create as ${kind} ↵`}
            </button>
          </div>
        </div>
      </main>

      <ToastContainer />
    </Chrome>
  )
}
