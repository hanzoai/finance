import './globals.css'
import type { Metadata, Viewport } from 'next'
import { resolveConfig } from '~/config'
import { GuiRoot } from '~/components/GuiRoot'

const cfg = resolveConfig()

export const metadata: Metadata = {
  title: `${cfg.productName} — one ledger for your money operations`,
  description:
    'A native double-entry ledger, payment connectors, and a treasury dashboard — run your organization’s financial operations on Hanzo.',
  applicationName: cfg.productName,
}

export const viewport: Viewport = {
  themeColor: '#08080a',
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <GuiRoot>{children}</GuiRoot>
      </body>
    </html>
  )
}
