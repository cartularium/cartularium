import { useEffect, useRef } from "preact/hooks"
import { EditorState, Prec } from "@codemirror/state"
import { EditorView, keymap } from "@codemirror/view"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search"
import { markdown } from "@codemirror/lang-markdown"
import { basicSetup } from "codemirror"
import { vimController, readVimPreference, writeVimPreference } from "../editor/vim"
import {
  imageUploadExtension,
  type ImageUploader,
  type ImageUploadErrorHandler,
} from "../editor/imageUpload"
import { wikilinkAutocomplete, type LookupEntry } from "../editor/wikilinks"
import { diffGutterExtension } from "../editor/diffGutter"
import { brandSyntaxTheme } from "../editor/syntaxTheme"

export interface InnerEditorHandle {
  setVimMode(on: boolean): void
  focus(): void
  dispatch(spec: Parameters<EditorView["dispatch"]>[0]): void
  readonly docLength: number
}

// EditorRoute composes route-level fields onto InnerEditorHandle.
export interface EditorHandle extends InnerEditorHandle {
  openSubmit(): void
  readonly draftBranch: string | null
  readonly filePath: string
  readonly hasChanges: boolean
}

interface EditorProps {
  initialContent: string
  baseContent: string
  wikilinkEntries: LookupEntry[]
  imageUploader: ImageUploader
  onImageError: ImageUploadErrorHandler
  onChange: (content: string) => void
  onReady: (handle: InnerEditorHandle) => void
}

export function Editor({
  initialContent,
  baseContent,
  wikilinkEntries,
  imageUploader,
  onImageError,
  onChange,
  onReady,
}: EditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!hostRef.current) return

    const initialVim = readVimPreference()
    const vim = vimController(initialVim)

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        // vim must claim Escape before defaultKeymap's simplifySelection.
        Prec.highest(vim.extension),
        // ⌘↵ → submit, bridged via CustomEvent so EditorRoute owns the gate.
        Prec.highest(
          keymap.of([
            {
              key: "Mod-Enter",
              run: () => {
                document.dispatchEvent(new CustomEvent("cartularium-submit-shortcut"))
                return true
              },
            },
          ]),
        ),
        basicSetup,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        highlightSelectionMatches(),
        markdown(),
        brandSyntaxTheme(),
        // pass initialContent so re-opens after a draft save still show diff marks at mount.
        diffGutterExtension(baseContent, initialContent),
        wikilinkAutocomplete(() => wikilinkEntries),
        imageUploadExtension({ uploader: imageUploader, onError: onImageError }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) {
            onChange(u.state.doc.toString())
          }
        }),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "0.95rem",
          },
          ".cm-scroller": {
            fontFamily: "var(--font-mono)",
          },
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: hostRef.current,
    })
    viewRef.current = view

    const handle: InnerEditorHandle = {
      setVimMode(on) {
        view.dispatch({ effects: vim.reconfigure(on) })
        writeVimPreference(on)
      },
      focus() {
        view.focus()
      },
      dispatch(spec) {
        view.dispatch(spec)
      },
      get docLength() {
        return view.state.doc.length
      },
    }
    // testing backdoor; canonical handle is onReady.
    if (typeof window !== "undefined") {
      ;(window as unknown as { __lastEditorView?: EditorView }).__lastEditorView = view
    }
    onReady(handle)

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // mount once; callers re-key on slug change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={hostRef} class="editor-host-cm" />
}
