// quartz/plugins/transformers/syntax.ts
import { QuartzTransformerPlugin } from "../types"
import rehypePrettyCode, {
  Options as PrettyCodeOptions,
  Theme as CodeTheme,
} from "rehype-pretty-code"
import { getHighlighter, type Highlighter, type Grammar, type LanguageRegistration } from "shiki"
import sheetsGrammar from "../../static/gse-syntax/syntaxes/gse.tmLanguage.json" assert { type: "json" }

interface Theme extends Record<string, CodeTheme> {
  light: CodeTheme
  dark: CodeTheme
}

interface UserOptions {
  theme?: Theme
  keepBackground?: boolean
}

const defaultUserOpts: UserOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
}

let _highlighter: Highlighter | undefined

async function getCustomHighlighter(): Promise<Highlighter> {
  if (_highlighter) return _highlighter

  _highlighter = await getHighlighter({
    themes: [defaultUserOpts.theme!.light, defaultUserOpts.theme!.dark],
    langs: [
      {
        ...sheetsGrammar,
        name: "gse",
        aliases: ["gs", "sheets", "formula"],
      },
    ],
  })

  const originalGetLanguage = _highlighter.getLanguage.bind(_highlighter)

  _highlighter.getLanguage = ((name: string | LanguageRegistration): Grammar | undefined => {
    if (typeof name === "string") {
      const aliasMap: Record<string, string> = {
        gs: "gse",
        sheets: "gse",
        formula: "gse",
      }
      const normalized = aliasMap[name.toLowerCase()] || name
      return originalGetLanguage(normalized)
    }
    return originalGetLanguage(name)
  }) as Highlighter["getLanguage"]

  console.log(
    "%c[Quartz] Shiki languages loaded:",
    "color:#0a8;background:#fff;padding:2px 6px;border-radius:3px",
    _highlighter.getLoadedLanguages().filter((l) => l.includes("gse")),
  )

  return _highlighter
}

export const SyntaxHighlighting: QuartzTransformerPlugin<Partial<UserOptions>> = (userOpts) => {
  const opts = { ...defaultUserOpts, ...userOpts }

  const prettyCodeOpts: PrettyCodeOptions = {
    theme: opts.theme,
    keepBackground: opts.keepBackground,
    getHighlighter: getCustomHighlighter,
  }

  return {
    name: "SyntaxHighlighting",

    markdownPlugins() {
      return []
    },

    htmlPlugins() {
      return [[rehypePrettyCode, prettyCodeOpts]]
    },
  }
}
