'use client'

/**
 * The @hanzo/gui runtime provider for finance.hanzo.ai. Mounts one `GuiProvider` at the
 * app root, on `@hanzo/ui/gui-config` — THE canonical Hanzo scale, shipped with the
 * components rather than copied per app — so the shared @hanzo/finance-ui board renders
 * with exactly the tokens, type ladder and radii the console renders it with.
 * `GuiProvider` injects its CSS at runtime (no build-time compiler needed; the Gui
 * packages are transpiled by Next — see next.config.mjs).
 */
import type { ReactNode } from 'react'
import { GuiProvider } from '@hanzo/gui'
import config from '@hanzo/ui/gui-config'

export function GuiRoot({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <GuiProvider config={config} defaultTheme="dark">
      {children}
    </GuiProvider>
  )
}
