// @ts-ignore
import darkmodeScript from "./scripts/darkmode.inline"
import styles from "./styles/darkmode.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"

const Darkmode: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
  const label = i18n(cfg.locale).components.themeToggle.lightMode
  return (
    <button
      type="button"
      class={classNames(displayClass, "darkmode")}
      aria-label={label}
      title={label}
    >
      <span class="sun" aria-hidden="true">
        ☼
      </span>
      <span class="moon" aria-hidden="true">
        ☾
      </span>
    </button>
  )
}

Darkmode.beforeDOMLoaded = darkmodeScript
Darkmode.css = styles

export default (() => Darkmode) satisfies QuartzComponentConstructor
