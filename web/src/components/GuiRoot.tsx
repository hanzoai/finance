'use client'

/**
 * The @hanzo/gui runtime provider for finance.hanzo.ai. Mounts one `GuiProvider`
 * (dark, the canonical Hanzo config) at the app root so the shared @hanzo/finance-ui
 * board — Tamagui components under the hood — renders with the same tokens/themes as
 * the console. `GuiProvider` injects its CSS at runtime (no build-time compiler needed;
 * the Gui packages are transpiled by Next — see next.config.mjs).
 */
import type { ReactNode } from 'react'
import { GuiProvider } from '@hanzo/gui'
import config from '../../gui.config'

export function GuiRoot({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <GuiProvider config={config} defaultTheme="dark">
      {children}
    </GuiProvider>
  )
}
