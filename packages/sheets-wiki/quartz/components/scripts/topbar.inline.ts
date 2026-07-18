// loaded as beforeDOMLoaded so chrome.js applies the theme attr before paint

// @ts-ignore IIFE side-effect
import "@cartularium/chrome/scripts/chrome.js"
// sidenotes pairs blog/guide footnote anchors with their margin notes; IIFE
// no-ops on pages without [data-fn]
// @ts-ignore IIFE side-effect
import "@cartularium/chrome/scripts/sidenotes.js"

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement | null
  const trigger = target?.closest?.("[data-search-trigger], [data-search-input]")
  if (!trigger) return
  e.preventDefault()
  const drawer = document.querySelector("[data-cartularium-drawer]") as HTMLElement | null
  if (drawer && !drawer.hidden) {
    drawer.querySelector<HTMLElement>("[data-drawer-close]")?.click()
  }
  document.querySelector<HTMLButtonElement>(".search > .search-button")?.click()
})
