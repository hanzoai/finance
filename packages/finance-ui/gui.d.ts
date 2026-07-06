/**
 * Registers the Gui config with the type system so shorthand style props (tokens,
 * themes, bg/px/py/items/justify/rounded/gap etc.) are typed correctly across this
 * package AND the @hanzo/ui source it consumes. `GuiCustomConfig` is declared in
 * @hanzogui/web and flows through @hanzogui/core / @hanzo/gui. Typecheck-only (not
 * published); mirrors the console's own gui.d.ts.
 */
import type { Conf } from './gui.config'

declare module '@hanzogui/web' {
  interface GuiCustomConfig extends Conf {}
}

declare module '@hanzogui/core' {
  interface GuiCustomConfig extends Conf {}
}
