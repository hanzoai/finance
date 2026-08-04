/**
 * Registers THE canonical Hanzo Gui config (`@hanzo/ui/gui-config`) with the type
 * system so @hanzo/gui + @hanzo/ui shorthand style props (bg/px/py/items/justify/
 * rounded/gap/$colorN …) are typed. Same config object `GuiRoot` mounts at runtime,
 * and the same one the console mounts — so the shared finance board renders identically
 * on both. `GuiCustomConfig` is declared in @hanzogui/web and flows through
 * @hanzogui/core / @hanzo/gui.
 */
import type { Conf } from '@hanzo/ui/gui-config'

declare module '@hanzogui/web' {
  interface GuiCustomConfig extends Conf {}
}

declare module '@hanzogui/core' {
  interface GuiCustomConfig extends Conf {}
}
