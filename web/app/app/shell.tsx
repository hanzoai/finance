'use client'

import { FinanceDashboard } from '@hanzo/finance-ui'
import { config, type Mode } from '~/config'
import { useSession } from '~/components/Session'
import { financeClient } from '~/lib/finance-transport'
import { BrandLockup } from '~/components/Logo'

/**
 * The app shell — hosts the finance control board (hanzo-fi/control), tenant-scoped to
 * the signed-in org. It renders the SHARED `@hanzo/finance-ui` board (the SAME components
 * the console Finance module uses) over the org's `/v1/finance/*` data, so this surface
 * and console never diverge. `mode` comes from the server (see `page.tsx`).
 */
export function Shell({ mode }: { mode: Mode }): React.JSX.Element {
  const { account, signOut } = useSession()
  const client = financeClient(mode)
  return (
    <div className="fin-shell">
      <div className="fin-shell-top">
        <div className="fin-container fin-shell-top-inner">
          <BrandLockup brand={config.brandName} />
          <div className="fin-shell-user">
            {account ? (
              <span>
                {account.name} · <span className="fin-muted">{account.org}</span>
              </span>
            ) : null}
            <button className="fin-btn fin-btn--ghost" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="fin-shell-body">
        <div className="fin-container">
          <div className="fin-shell-heading">
            <h2>Treasury &amp; payments</h2>
            <p>
              Your organization’s ledger, spend, credits, invoices, and reserve — {account?.org ? `scoped to ${account.org}` : 'scoped to your org'}.
            </p>
          </div>
          <FinanceDashboard client={client} mode={mode} theme="dark" showTreasury standalone />
        </div>
      </div>
    </div>
  )
}
