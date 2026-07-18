import { test } from "node:test"
import { strict as assert } from "node:assert"
import { FOOTER_TEMPLATE, TOPBAR_TEMPLATE, render } from "../index.js"

test("footer omits Edit↗ link when editUrl absent", () => {
  const html = render(FOOTER_TEMPLATE, {
    imprint: { href: "https://cartularium.org", label: "part of cartularium ↗" },
    links: [],
  })
  assert.ok(!/edit-link/i.test(html), "should not render edit-link class")
  assert.ok(!/Edit ↗/.test(html), "should not render 'Edit ↗' text")
})

test("footer renders Edit↗ link when editUrl provided", () => {
  const html = render(FOOTER_TEMPLATE, {
    imprint: { href: "https://cartularium.org", label: "part of cartularium ↗" },
    links: [],
    editUrl: "/edit/function/SUMIF",
  })
  assert.ok(/href="\/edit\/function\/SUMIF"/.test(html), "edit link href present")
  assert.ok(/Edit ↗/.test(html), "'Edit ↗' label present")
})

test("topbar omits editor controls when editor data absent", () => {
  const html = render(TOPBAR_TEMPLATE, {
    wordmark: { href: "/", label: "sheets.wiki" },
    nav: { items: [] },
    search: { label: "search", key: "⌘K" },
    theme: { icon: "☾" },
  })
  assert.ok(!/account-chip/.test(html), "should not render account chip")
  assert.ok(!/editor-submit-btn/.test(html), "should not render submit button")
})

test("topbar renders account + submit when editor data is present", () => {
  const html = render(TOPBAR_TEMPLATE, {
    wordmark: { href: "/", label: "sheets.wiki" },
    nav: { items: [] },
    search: { label: "search", key: "⌘K" },
    theme: { icon: "☾" },
    editor: {
      account: { handle: "maeve.henley", initials: "MH" },
      submit: { enabled: false },
    },
  })
  assert.ok(/account-chip/.test(html), "account chip rendered")
  assert.ok(/maeve\.henley/.test(html), "account handle visible")
  assert.ok(/editor-submit-btn/.test(html), "submit button rendered")
  assert.ok(/disabled/.test(html), "submit button disabled when enabled=false")
})

test("topbar submit button is enabled when editor.submit.enabled = true", () => {
  const html = render(TOPBAR_TEMPLATE, {
    wordmark: { href: "/", label: "sheets.wiki" },
    nav: { items: [] },
    search: { label: "search", key: "⌘K" },
    theme: { icon: "☾" },
    editor: {
      account: { handle: "maeve.henley", initials: "MH" },
      submit: { enabled: true },
    },
  })
  assert.ok(/editor-submit-btn/.test(html), "submit button rendered")
  assert.ok(!/<button[^>]*editor-submit-btn[^>]*\sdisabled/.test(html), "submit button NOT disabled when enabled=true")
})
