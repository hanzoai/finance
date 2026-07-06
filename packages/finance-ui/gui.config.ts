/**
 * Typecheck-only @hanzo/gui config — registers the canonical v5 shorthands + tokens
 * with the type system so shorthand style props (bg / px / py / items / justify /
 * rounded / gap / $colorN …) are typed on every @hanzo/gui + @hanzo/ui component this
 * package consumes. NOT part of the published tarball (`files: [src, README]`) and never
 * imported at runtime — the HOST app (console / finance.hanzo.ai) owns the real
 * `GuiProvider` config. This only feeds `gui.d.ts`'s `GuiCustomConfig` augmentation.
 */
import { defaultConfig } from '@hanzogui/config/v5'
import { createGui } from '@hanzo/gui'

export const config = createGui(defaultConfig)

export default config

export type Conf = typeof config
