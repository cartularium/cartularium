import { useEffect, useMemo } from "preact/hooks"
import type { EditorHandle, InnerEditorHandle } from "../components/Editor"

export interface EditorHandleRouteData {
  filePath: string
  draftBranch: string | null
  hasChanges: boolean
  openSubmit: () => void
}

// compose the inner editor handle with route-level fields and propagate to App
// via onEditorReady. memoize the composed handle so identity only flips when
// inputs actually change.
export function useEditorHandle(
  innerHandle: InnerEditorHandle | null,
  data: EditorHandleRouteData,
  onEditorReady: ((h: EditorHandle | null) => void) | undefined,
): EditorHandle | null {
  const composed = useMemo<EditorHandle | null>(() => {
    if (!innerHandle) return null
    return {
      setVimMode: innerHandle.setVimMode.bind(innerHandle),
      focus: innerHandle.focus.bind(innerHandle),
      dispatch: innerHandle.dispatch.bind(innerHandle),
      get docLength() {
        return innerHandle.docLength
      },
      openSubmit: data.openSubmit,
      draftBranch: data.draftBranch,
      filePath: data.filePath,
      hasChanges: data.hasChanges,
    }
  }, [innerHandle, data.openSubmit, data.draftBranch, data.filePath, data.hasChanges])

  useEffect(() => {
    onEditorReady?.(composed)
    return () => onEditorReady?.(null)
  }, [composed, onEditorReady])

  return composed
}
