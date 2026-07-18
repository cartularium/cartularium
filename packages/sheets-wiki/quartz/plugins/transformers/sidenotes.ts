import { QuartzTransformerPlugin } from "../types"
import { visit, EXIT } from "unist-util-visit"
import { Element, ElementContent, Root } from "hast"
import { toString } from "hast-util-to-string"
import { pageKind } from "../../util/pageKind"

// rehype-gfm footnote ref href is `#user-content-fn-<id>`; the matching <li>
// id is `user-content-fn-<id>`. the rendered anchor + body re-id to `fn-<id>`
// so chrome's sidenotes.js (`[data-fn]` pairing) and chrome.scss (`#fn-N`
// :target reveal) can address them on a stable, public-facing key.
const FN_PREFIX = "user-content-fn-"
const HREF_PATTERN = /^#user-content-fn-(.+)$/

export const Sidenotes: QuartzTransformerPlugin = () => ({
  name: "Sidenotes",
  htmlPlugins() {
    return [
      () => {
        return (tree: Root, file) => {
          const kind = pageKind(file.data as { slug?: string; relativePath?: string })
          if (kind !== "blog" && kind !== "guide") return

          const notes = new Map<string, ElementContent[]>()
          visit(tree, "element", (node, index, parent) => {
            if (node.tagName !== "section") return
            if (node.properties?.["data-footnotes"] === undefined) return
            for (const child of node.children) {
              if (child.type !== "element" || child.tagName !== "ol") continue
              for (const li of child.children) {
                if (li.type !== "element" || li.tagName !== "li") continue
                const id = li.properties?.id
                if (typeof id !== "string" || !id.startsWith(FN_PREFIX)) continue
                notes.set(id.slice(FN_PREFIX.length), stripBackref(li.children))
              }
            }
            if (parent && typeof index === "number") {
              parent.children.splice(index, 1)
            }
            return EXIT
          })

          if (notes.size === 0) return

          // emit each .sidenote body on first reference only; subsequent
          // citations of the same footnote get just an anchor sharing the
          // data-fn id, so hover-pair highlights both
          const emitted = new Set<string>()
          visit(tree, "element", (node) => {
            if (node.tagName !== "sup") return
            const ref = node.children.find(
              (c) =>
                c.type === "element" &&
                c.tagName === "a" &&
                c.properties?.["data-footnote-ref"] !== undefined,
            ) as Element | undefined
            if (!ref) return
            const href = typeof ref.properties?.href === "string" ? ref.properties.href : ""
            const m = href.match(HREF_PATTERN)
            if (!m) return
            const num = m[1]
            const body = notes.get(num)
            if (!body) return

            const label = toString(ref) || num
            const children: ElementContent[] = [
              {
                type: "element",
                tagName: "a",
                properties: {
                  className: ["sidenote-anchor"],
                  href: `#fn-${num}`,
                  "data-fn": num,
                  "data-no-popover": "true",
                  role: "doc-noteref",
                },
                children: [{ type: "text", value: label }],
              },
            ]

            if (!emitted.has(num)) {
              emitted.add(num)
              children.push({
                type: "element",
                tagName: "span",
                properties: {
                  className: ["sidenote"],
                  id: `fn-${num}`,
                  "data-fn": num,
                  role: "doc-footnote",
                },
                children: [
                  {
                    type: "element",
                    tagName: "span",
                    properties: { className: ["num"] },
                    children: [{ type: "text", value: `${label}.` }],
                  },
                  { type: "text", value: " " },
                  ...inlineChildren(body),
                ],
              })
            }

            node.tagName = "span"
            node.properties = { className: ["sidenote-pair"] }
            node.children = children
          })
        }
      },
    ]
  },
})

function stripBackref(children: ElementContent[]): ElementContent[] {
  return children.map((c) => {
    if (c.type !== "element" || c.tagName !== "p") return c
    return {
      ...c,
      children: c.children.filter(
        (g) =>
          !(
            g.type === "element" &&
            g.tagName === "a" &&
            g.properties?.["data-footnote-backref"] !== undefined
          ),
      ),
    }
  })
}

// .sidenote is a <span> (phrasing) so it cannot host block content;
// unwrap <p> wrappers from the footnote body to keep the markup valid
function inlineChildren(children: ElementContent[]): ElementContent[] {
  const out: ElementContent[] = []
  for (const c of children) {
    if (c.type === "element" && c.tagName === "p") {
      if (out.length > 0) out.push({ type: "text", value: " " })
      out.push(...c.children)
    } else if (c.type === "text" && c.value.trim() === "") {
      continue
    } else {
      out.push(c)
    }
  }
  return out
}
