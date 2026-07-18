import { useEffect, useMemo, useRef, useState } from "preact/hooks"

export interface PaletteCommand {
  // Stable identifier (used as key)
  id: string
  // Visible label (also the text we filter against)
  label: string
  // Called when the user picks this command. The palette closes after run.
  run(): void | Promise<void>
}

interface PaletteProps {
  commands: PaletteCommand[]
}

export function Palette({ commands }: PaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q))
  }, [commands, query])

  // Open on ⌘⇧P / Ctrl+Shift+P, close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const trigger =
        (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "P" || e.key === "p")
      if (trigger) {
        e.preventDefault()
        setOpen((o) => !o)
        setQuery("")
      } else if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  // Focus input when palette opens
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const runFirst = () => {
    const first = filtered[0]
    if (!first) return
    void first.run()
    setOpen(false)
  }

  if (!open) return null

  return (
    <div class="palette-scrim" onClick={() => setOpen(false)}>
      <div class="palette-modal" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          class="palette-input"
          type="text"
          placeholder="command…"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              runFirst()
            }
          }}
        />
        <ul class="palette-list" role="listbox">
          {filtered.length === 0 && (
            <li class="palette-empty">no matching commands</li>
          )}
          {filtered.map((c) => (
            <li
              key={c.id}
              class="palette-item"
              role="option"
              onClick={() => {
                void c.run()
                setOpen(false)
              }}
            >
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
