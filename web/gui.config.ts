/**
 * finance.hanzo.ai @hanzo/gui config — the canonical Hanzo v5 face (dark-first,
 * monochrome shorthands + tokens), the SAME base the console uses. Consumed at
 * runtime by `GuiRoot`'s `GuiProvider` and by the type system (see `gui.d.ts`) so
 * the shared @hanzo/finance-ui board renders identically here and in the console.
 */
import { defaultConfig } from '@hanzogui/config/v5'
import { createGui } from '@hanzo/gui'

export const config = createGui(defaultConfig)

export default config

export type Conf = typeof config
