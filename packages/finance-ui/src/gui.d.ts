/**
 * Registers THE canonical Hanzo Gui config with the type system so shorthand style
 * props (tokens, themes, bg/px/py/items/justify/rounded/gap etc.) are typed correctly
 * across this package AND the @hanzo/ui components it consumes.
 *
 * The config is `@hanzo/ui/gui-config` — the one scale, shipped WITH the components.
 * A local `createGui(defaultConfig)` here would be a second scale that drifts from the
 * console's, so there isn't one. `GuiCustomConfig` is declared in @hanzogui/web and
 * flows through @hanzogui/core / @hanzo/gui. Typecheck-only (not published).
 */
import type { Conf } from '@hanzo/ui/gui-config'

declare module '@hanzogui/web' {
  interface GuiCustomConfig extends Conf {}
}

declare module '@hanzogui/core' {
  interface GuiCustomConfig extends Conf {}
}
