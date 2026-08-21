'use client'

/**
 * The Hanzo Finance board — the ONE composed surface every finance scope renders:
 * finance.hanzo.ai (tenant), the console per-org Finance module, and the console
 * global-admin finance view. Given a `FinanceClient`, it shows balance, metered spend
 * (line chart + breakdown + trend), credits, invoices, payment methods, and the
 * double-entry ledger — with an optional treasury/reserve section for the owner/admin.
 *
 * Rebuilt on the canonical @hanzo/gui (stacks/text) + @hanzo/ui (LineChart, DataTable)
 * stack — no hand-rolled CSS. SCOPE (which org, or all-orgs) comes from the injected
 * `client`/transport + identity, NOT from a different UI: same board, every scope.
 */
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { DataTable, LineChart, type Column, type ChartPoint } from '@hanzo/ui/product'
import { FinanceRoot, StatCard, SectionCard, RangeSelector, Skeleton, FinanceErrorCard, PreviewBanner, Money, formatMoney } from './primitives'
import { UsageBreakdown, InvoiceTable, PaymentMethodList, LedgerTable } from './tables'
import { TreasuryOverview } from './cards'
import { useAsync, type AsyncState } from '../hooks'
import { deltaPct, formatDate } from '../format'
import type { FinanceClient } from '../client'
import type { Credit, Range } from '../types'

export type FinanceDashboardProps = {
  /** The data source. `stubFinanceClient()` for preview/dev, `httpFinanceClient(...)` for live. */
  client: FinanceClient
  /** Show the treasury/reserve section (owner / global-admin view). Hidden for a plain customer. */
  showTreasury?: boolean
  /** `preview` labels the board as illustrative (landing / no backend yet); `live` is real data. */
  mode?: 'live' | 'preview'
  /** Pin light/dark; else follow the host `Theme`. Used only when `standalone`. */
  theme?: 'light' | 'dark'
  /** Wrap in the finance `Theme` scope + page background. Set false when the host already
   *  mounts a `GuiProvider`/`Theme` (the console does). */
  standalone?: boolean
  /** Error renderer override — the console passes its `BackendStateCard` so a 403/404 reads
   *  as the console's honest state. Default is the built-in `FinanceErrorCard`. */
  renderError?: (error: unknown, retry: () => void) => ReactNode
}

/** Split a series into two halves for a within-window trend (honest null when flat/short). */
function seriesTrend(series: { cents: number }[]): { current: number; prior: number } | undefined {
  if (series.length < 4) return undefined
  const mid = Math.floor(series.length / 2)
  const prior = series.slice(0, mid).reduce((a, p) => a + p.cents, 0)
  const current = series.slice(mid).reduce((a, p) => a + p.cents, 0)
  return deltaPct(current, prior) === null ? undefined : { current, prior }
}

/** A KPI value, degrading to a skeleton while loading and an honest em-dash on error. */
function kpi<T>(q: AsyncState<T>, render: (d: T) => ReactNode): ReactNode {
  if (q.data !== undefined) return render(q.data)
  if (q.loading) return <Skeleton height={26} width={110} />
  return <Text fontSize="$8" fontWeight="900" color="$color10">—</Text>
}

/** A section body that resolves loading/error/data with the host-provided error renderer. */
function AsyncSection<T>({
  q,
  renderError,
  children,
}: {
  q: AsyncState<T>
  renderError: (error: unknown, retry: () => void) => ReactNode
  children: (d: T) => ReactNode
}): React.JSX.Element {
  if (q.error && q.data === undefined) return <>{renderError(q.error, q.reload)}</>
  if (q.data === undefined && q.loading)
    return (
      <YStack gap="$2" py="$1">
        <Skeleton height={14} width="60%" />
        <Skeleton height={14} width="80%" />
        <Skeleton height={14} width="45%" />
      </YStack>
    )
  return <>{q.data !== undefined ? children(q.data) : null}</>
}

const shortDate = (iso: string): string =>
  formatDate(iso).replace(/, \d{4}$/, '') // "Jul 5" — drop the year for a dense axis

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

  const creditColumns: Column<Credit>[] = [
    { key: 'label', header: 'Grant', render: (c) => <Text fontSize="$3" color="$color12" numberOfLines={1}>{c.label}</Text> },
    { key: 'granted', header: 'Granted', render: (c) => <Text fontSize="$3" color="$color11">{c.grantedAt ? formatDate(c.grantedAt) : '—'}</Text> },
    { key: 'expires', header: 'Expires', render: (c) => <Text fontSize="$3" color="$color10">{c.expiresAt ? formatDate(c.expiresAt) : 'Never'}</Text> },
    { key: 'amount', header: 'Amount', render: (c) => <XStack flex={1} justify="flex-end"><Money cents={c.cents} /></XStack> },
    {
      key: 'remaining',
      header: 'Remaining',
      render: (c) => (
        <XStack flex={1} justify="flex-end">
          {c.remainingCents !== undefined ? <Money cents={c.remainingCents} /> : <Text fontSize="$3" color="$color10">—</Text>}
        </XStack>
      ),
    },
  ]

  const body = (
    <YStack gap="$4" width="100%">
      {mode === 'preview' ? (
        <PreviewBanner>Preview data — connect your account to see your organization&rsquo;s real finances.</PreviewBanner>
      ) : null}

      {/* KPI row */}
      <XStack gap="$3" flexWrap="wrap">
        <StatCard
          label="Available credits"
          value={kpi(balance, (b) => formatMoney(b.availableCents, b.currency))}
          sub={kpi(balance, (b) => (b.pendingCents ? `${formatMoney(b.pendingCents, b.currency)} pending` : 'Ready to spend'))}
        />
        <StatCard
          label={`Spend · ${range}`}
          value={kpi(usage, (u) => formatMoney(u.totalCents, u.currency))}
          delta={usage.data ? seriesTrend(usage.data.series) : undefined}
          spark={usage.data?.series.map((p) => p.cents)}
        />
        <StatCard
          label="Credits granted"
          value={kpi(credits, (cs) => formatMoney(cs.reduce((a, c) => a + Math.max(0, c.cents), 0)))}
          sub={kpi(credits, (cs) => `${cs.length} grant${cs.length === 1 ? '' : 's'}`)}
        />
        <StatCard
          label="Amount due"
          value={kpi(balance, (b) => formatMoney(b.dueCents, b.currency))}
          sub={kpi(balance, (b) => (b.dueCents > 0 ? 'On next invoice' : 'Nothing owed'))}
        />
      </XStack>

      {/* Metered spend */}
      <SectionCard
        title="Metered spend"
        sub="What your organization is consuming, by product."
        action={<RangeSelector value={range} onChange={setRange} />}
      >
        <AsyncSection q={usage} renderError={err}>
          {(u) => (
            <YStack gap="$4">
              {u.series.length >= 2 ? (
                <LineChart
                  data={u.series.map((p): ChartPoint => ({ label: shortDate(p.date), value: p.cents }))}
                  height={200}
                  formatValue={(v) => formatMoney(v, u.currency)}
                />
              ) : null}
              <UsageBreakdown lines={u.lines} currency={u.currency} />
            </YStack>
          )}
        </AsyncSection>
      </SectionCard>

      {/* Invoices + payment methods */}
      <XStack gap="$4" flexWrap="wrap">
        <YStack flex={2} minW={320} gap="$3">
          <SectionCard title="Invoices" flush>
            <AsyncSection q={invoices} renderError={err}>{(rows) => <InvoiceTable invoices={rows} />}</AsyncSection>
          </SectionCard>
        </YStack>
        <YStack flex={1} minW={260} gap="$3">
          <SectionCard title="Payment methods" flush>
            <AsyncSection q={methods} renderError={err}>{(rows) => <PaymentMethodList methods={rows} />}</AsyncSection>
          </SectionCard>
        </YStack>
      </XStack>

      {/* Credits */}
      <SectionCard title="Credits" flush>
        <AsyncSection q={credits} renderError={err}>
          {(cs) => <DataTable columns={creditColumns} rows={cs} rowKey={(c) => c.id} empty="No credits yet — grants, promos, and top-ups appear here." />}
        </AsyncSection>
      </SectionCard>

      {/* Ledger */}
      <SectionCard title="Ledger" sub="Every money movement, double-entry and reconciled." flush>
        <AsyncSection q={ledger} renderError={err}>{(rows) => <LedgerTable entries={rows} />}</AsyncSection>
      </SectionCard>

      {/* Treasury (owner / admin view) */}
      {showTreasury ? <AsyncSection q={treasury} renderError={err}>{(t) => <TreasuryOverview treasury={t} />}</AsyncSection> : null}
    </YStack>
  )

  return standalone ? <FinanceRoot theme={theme}>{body}</FinanceRoot> : body
}

export default FinanceDashboard
