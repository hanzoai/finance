import * as React from 'react'
import { useState } from 'react'
import { FinanceRoot, StatCard, SectionCard, RangeSelector, Money, Sparkline, Skeleton, FinanceErrorCard, PreviewBanner } from './primitives.js'
import { UsageBreakdown, InvoiceTable, PaymentMethodList, LedgerTable } from './tables.js'
import { TreasuryOverview } from './cards.js'
import { useAsync, type AsyncState } from '../hooks.js'
import { deltaPct } from '../format.js'
import type { FinanceClient } from '../client.js'
import type { Range } from '../types.js'

export type FinanceDashboardProps = {
  /** The data source. `stubFinanceClient()` for preview/dev, `httpFinanceClient(...)` for live. */
  client: FinanceClient
  /** Show the treasury/reserve section (finance.hanzo.ai owner view). Hidden for a plain customer. */
  showTreasury?: boolean
  /**
   * `preview` labels the board as illustrative (landing / no backend yet); `live` is
   * real per-org data with honest states. Default `live`.
   */
  mode?: 'live' | 'preview'
  /** Pin light/dark; else follow the viewer's system theme. Ignored when `standalone` is false. */
  theme?: 'light' | 'dark'
  /** Wrap in the `.hz-fin` root + stylesheet. Set false when the host already renders `<FinanceRoot>`. */
  standalone?: boolean
  /**
   * Error renderer override — the console passes its `BackendStateCard` here so a 403/404
   * reads as the console's honest state. Default is the built-in `FinanceErrorCard`.
   */
  renderError?: (error: unknown, retry: () => void) => React.ReactNode
}

/** Split a series into two halves and return a within-window trend delta (honest null when flat/short). */
function seriesTrend(series: { cents: number }[]): { current: number; prior: number } | undefined {
  if (series.length < 4) return undefined
  const mid = Math.floor(series.length / 2)
  const prior = series.slice(0, mid).reduce((a, p) => a + p.cents, 0)
  const current = series.slice(mid).reduce((a, p) => a + p.cents, 0)
  return deltaPct(current, prior) === null ? undefined : { current, prior }
}

/** Render a KPI value, degrading to a skeleton while loading and an honest em-dash on error. */
function kpi<T>(q: AsyncState<T>, render: (d: T) => React.ReactNode): React.ReactNode {
  if (q.data !== undefined) return render(q.data)
  if (q.loading) return <Skeleton height={28} width={110} />
  return <span className="hz-fin-faint">—</span>
}

/** A section body that resolves loading/error/data with the host-provided error renderer. */
function AsyncSection<T>({
  q,
  renderError,
  children,
}: {
  q: AsyncState<T>
  renderError: (error: unknown, retry: () => void) => React.ReactNode
  children: (d: T) => React.ReactNode
}): React.JSX.Element {
  if (q.error && q.data === undefined) return <>{renderError(q.error, q.reload)}</>
  if (q.data === undefined && q.loading)
    return (
      <div className="hz-fin-stack" style={{ padding: '6px 0' }}>
        <Skeleton height={14} width="60%" />
        <Skeleton height={14} width="80%" />
        <Skeleton height={14} width="45%" />
      </div>
    )
  return <>{q.data !== undefined ? children(q.data) : null}</>
}

/**
 * The Hanzo Finance board — the ONE composed surface both finance.hanzo.ai and the
 * console Finance module render. Given a `FinanceClient`, it shows the org's balance,
 * metered spend (+ breakdown + trend), credits, invoices, payment methods, and the
 * double-entry ledger — with an optional treasury section for the product owner. Every
 * region resolves loading/error/data honestly; nothing is fabricated on a live client.
 */
export function FinanceDashboard(props: FinanceDashboardProps): React.JSX.Element {
  const { client, showTreasury = false, mode = 'live', theme, standalone = true, renderError } = props
  const [range, setRange] = useState<Range>('30d')
  const err = renderError ?? ((e: unknown, retry: () => void) => <FinanceErrorCard error={e} onRetry={retry} />)

  const balance = useAsync(() => client.balance(), [])
  const usage = useAsync(() => client.usage(range), [range])
  const credits = useAsync(() => client.credits(), [])
  const invoices = useAsync(() => client.invoices(), [])
  const methods = useAsync(() => client.paymentMethods(), [])
  const ledger = useAsync(() => client.ledger(range), [range])
  const treasury = useAsync(() => client.treasury(), [])

  const body = (
    <div className="hz-fin-stack">
      {mode === 'preview' ? (
        <PreviewBanner>Preview data — connect your account to see your organization's real finances.</PreviewBanner>
      ) : null}

      {/* KPI row */}
      <div className="hz-fin-row">
        <StatCard
          label="Available credits"
          value={kpi(balance, (b) => <Money cents={b.availableCents} currency={b.currency} />)}
          sub={kpi(balance, (b) => (b.pendingCents ? <><Money cents={b.pendingCents} currency={b.currency} /> pending</> : 'Ready to spend'))}
        />
        <StatCard
          label={`Spend · ${range}`}
          value={kpi(usage, (u) => <Money cents={u.totalCents} currency={u.currency} />)}
          delta={usage.data ? seriesTrend(usage.data.series) : undefined}
          spark={usage.data?.series.map((p) => p.cents)}
        />
        <StatCard
          label="Credits granted"
          value={kpi(credits, (cs) => <Money cents={cs.reduce((a, c) => a + Math.max(0, c.cents), 0)} />)}
          sub={kpi(credits, (cs) => `${cs.length} grant${cs.length === 1 ? '' : 's'}`)}
        />
        <StatCard
          label="Amount due"
          value={kpi(balance, (b) => <Money cents={b.dueCents} currency={b.currency} />)}
          sub={kpi(balance, (b) => (b.dueCents > 0 ? 'On next invoice' : 'Nothing owed'))}
        />
      </div>

      {/* Usage / metered spend */}
      <SectionCard
        title="Metered spend"
        sub="What your organization is consuming, by product."
        action={<RangeSelector value={range} onChange={setRange} />}
      >
        <AsyncSection q={usage} renderError={err}>
          {(u) => (
            <div className="hz-fin-stack">
              {u.series.length >= 2 ? (
                <Sparkline values={u.series.map((p) => p.cents)} width={640} height={72} />
              ) : null}
              <UsageBreakdown lines={u.lines} currency={u.currency} />
            </div>
          )}
        </AsyncSection>
      </SectionCard>

      {/* Invoices + payment methods */}
      <div className="hz-fin-row">
        <div style={{ flex: '2 1 380px', minWidth: 300 }}>
          <SectionCard title="Invoices" flush>
            <AsyncSection q={invoices} renderError={err}>{(rows) => <InvoiceTable invoices={rows} />}</AsyncSection>
          </SectionCard>
        </div>
        <div style={{ flex: '1 1 260px', minWidth: 240 }}>
          <SectionCard title="Payment methods" flush>
            <AsyncSection q={methods} renderError={err}>{(rows) => <PaymentMethodList methods={rows} />}</AsyncSection>
          </SectionCard>
        </div>
      </div>

      {/* Credits detail */}
      <SectionCard title="Credits" flush>
        <AsyncSection q={credits} renderError={err}>
          {(cs) =>
            cs.length === 0 ? (
              <div className="hz-fin-state">
                <div className="hz-fin-state-title">No credits yet</div>
                <div className="hz-fin-state-body">Grants, promos, and top-ups appear here.</div>
              </div>
            ) : (
              <div className="hz-fin-scroll-x">
                <table className="hz-fin-table">
                  <thead>
                    <tr>
                      <th>Grant</th>
                      <th>Granted</th>
                      <th>Expires</th>
                      <th className="hz-fin-num">Amount</th>
                      <th className="hz-fin-num">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cs.map((c) => (
                      <tr key={c.id}>
                        <td>{c.label}</td>
                        <td>{c.grantedAt ? new Date(c.grantedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                        <td className="hz-fin-muted">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}</td>
                        <td className="hz-fin-num"><Money cents={c.cents} /></td>
                        <td className="hz-fin-num hz-fin-muted">{c.remainingCents !== undefined ? <Money cents={c.remainingCents} /> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </AsyncSection>
      </SectionCard>

      {/* Ledger */}
      <SectionCard title="Ledger" sub="Every money movement, double-entry and reconciled." flush action={<span />}>
        <AsyncSection q={ledger} renderError={err}>{(rows) => <LedgerTable entries={rows} />}</AsyncSection>
      </SectionCard>

      {/* Treasury (owner view) */}
      {showTreasury ? (
        <AsyncSection q={treasury} renderError={err}>{(t) => <TreasuryOverview treasury={t} />}</AsyncSection>
      ) : null}
    </div>
  )

  return standalone ? (
    <FinanceRoot theme={theme}>{body}</FinanceRoot>
  ) : (
    body
  )
}

export default FinanceDashboard
