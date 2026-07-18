import { Compartment, type Extension } from "@codemirror/state"
import { vim } from "@replit/codemirror-vim"

// Namespaced under cartularium so the wiki/assay/etc. don't collide if they
// ever stash editor-related preferences in the same localStorage origin.
export const VIM_STORAGE_KEY = "cartularium:editor:vim"

export function readVimPreference(): boolean {
  return localStorage.getItem(VIM_STORAGE_KEY) === "on"
}

export function writeVimPreference(on: boolean): void {
  if (on) {
    localStorage.setItem(VIM_STORAGE_KEY, "on")
  } else {
    localStorage.removeItem(VIM_STORAGE_KEY)
  }
}

// Compartment so callers can swap the vim extension in/out at runtime via
// the returned reconfigure function. Returns the extension to include in
// EditorState plus the compartment itself for later transactions.
export interface VimController {
  extension: Extension
  compartment: Compartment
  reconfigure(on: boolean): ReturnType<Compartment["reconfigure"]>
}

export function vimController(initialOn: boolean): VimController {
  const compartment = new Compartment()
  return {
    extension: compartment.of(initialOn ? vim() : []),
    compartment,
    reconfigure(on: boolean) {
      return compartment.reconfigure(on ? vim() : [])
    },
  }
}
