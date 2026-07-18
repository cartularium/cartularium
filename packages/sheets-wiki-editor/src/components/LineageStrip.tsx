interface LineageStripProps {
  filename: string
  modified: boolean
}

export function LineageStrip({ filename, modified }: LineageStripProps) {
  return (
    <div class="lineage-strip">
      <a class="lineage-back" href="/edit/drafts" title="back to drafts">← drafts</a>
      <span class="lineage-sep">·</span>
      <span class="lineage-file">{filename}</span>
      {modified && <span class="lineage-mod">(modified)</span>}
    </div>
  )
}
