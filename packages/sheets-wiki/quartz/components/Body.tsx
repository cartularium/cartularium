// @ts-ignore
import clipboardScript from "./scripts/clipboard.inline"
import clipboardStyle from "./styles/clipboard.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { pageKind } from "../util/pageKind"

const Body: QuartzComponent = ({ fileData, children }: QuartzComponentProps) => {
  const kind = pageKind(fileData)
  return (
    <div id="quartz-body" data-page-kind={kind}>
      {children}
    </div>
  )
}

Body.afterDOMLoaded = clipboardScript
Body.css = clipboardStyle

export default (() => Body) satisfies QuartzComponentConstructor
