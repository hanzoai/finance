/**
 * Registers the Gui config with the type system so @hanzo/gui + @hanzo/ui shorthand
 * style props (bg/px/py/items/justify/rounded/gap/$colorN …) are typed. Mirrors the
 * console's gui.d.ts. `GuiCustomConfig` is declared in @hanzogui/web and flows through
 * @hanzogui/core / @hanzo/gui.
 */
import type { Conf } from './gui.config'

declare module '@hanzogui/web' {
  interface GuiCustomConfig extends Conf {}
}

declare module '@hanzogui/core' {
  interface GuiCustomConfig extends Conf {}
}
