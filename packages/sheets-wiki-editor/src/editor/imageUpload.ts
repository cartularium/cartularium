import { EditorView } from "@codemirror/view"

export interface ImageInsertChange {
  changes: { from: number; insert: string }
}

// Pure helper: given an insertion offset and a URL, return a CodeMirror change
// spec that inserts the markdown image syntax. Kept separate from the upload
// extension factory so it's unit-testable without DOM events.
export function insertImageMarkdown(at: number, url: string): ImageInsertChange {
  return { changes: { from: at, insert: `![](${url})` } }
}

export type ImageUploader = (file: File) => Promise<{ url: string }>
export type ImageUploadErrorHandler = (message: string, file: File) => void

interface Options {
  uploader: ImageUploader
  onError: ImageUploadErrorHandler
}

const IMAGE_MIME_PREFIX = "image/"

function getImageFiles(items: DataTransferItemList | undefined): File[] {
  if (!items) return []
  const out: File[] = []
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!
    if (item.kind === "file" && item.type.startsWith(IMAGE_MIME_PREFIX)) {
      const f = item.getAsFile()
      if (f) out.push(f)
    }
  }
  return out
}

async function uploadAndInsert(
  view: EditorView,
  at: number,
  file: File,
  opts: Options,
): Promise<void> {
  try {
    const { url } = await opts.uploader(file)
    view.dispatch(insertImageMarkdown(at, url))
  } catch (err) {
    opts.onError(
      err instanceof Error ? err.message : "image upload failed",
      file,
    )
  }
}

export function imageUploadExtension(opts: Options) {
  return EditorView.domEventHandlers({
    drop(event, view) {
      const dataTransfer = event.dataTransfer
      const files = dataTransfer?.files
      if (!files || files.length === 0) return false
      const images: File[] = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i]!
        if (f.type.startsWith(IMAGE_MIME_PREFIX)) images.push(f)
      }
      if (images.length === 0) return false
      event.preventDefault()
      // For drops, insert at the cursor's projected drop position. CodeMirror
      // resolves the drop to a doc offset via posAtCoords.
      const at =
        view.posAtCoords({ x: event.clientX, y: event.clientY }, false) ??
        view.state.selection.main.head
      // Phase C ships single-image; if multiple are dropped, take the first.
      // Multi-image batch is P2.
      void uploadAndInsert(view, at, images[0]!, opts)
      return true
    },
    paste(event, view) {
      const items = event.clipboardData?.items
      const images = getImageFiles(items)
      if (images.length === 0) return false
      event.preventDefault()
      const at = view.state.selection.main.head
      void uploadAndInsert(view, at, images[0]!, opts)
      return true
    },
  })
}
