'use client'

/**
 * finance-ui tables — rebuilt on the canonical @hanzo/ui `DataTable<T>` (typed columns,
 * built-in loading/empty on @hanzo/gui stacks), so invoices / ledger / payment methods /
 * usage read identically to every other console list. Money stays sign-colored via the
 * finance `Money` primitive; the metered-spend breakdown is token-native bars.
 */
import type { ReactNode } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'
import { DataTable, type Column } from '@hanzo/ui'
import { FinanceEmpty, Money, StatusPill } from './primitives'
import { cardLabel, formatCount, formatDate } from '../format'
import type { Invoice, LedgerEntry, PaymentMethod, UsageLine } from '../types'

/** Open a hosted receipt / invoice in a new tab (client-only, SSR-guarded). */
function openHref(href: string): void {
  if (typeof window !== 'undefined') window.open(href, '_blank', 'noopener')
}

/** Metered spend by product/model/agent — horizontal monochrome bars, largest first. */
export function UsageBreakdown({ lines, currency = 'usd' }: { lines: UsageLine[]; currency?: string }): React.JSX.Element {
  const sorted = [...lines].filter((l) => Number.isFinite(l.cents)).sort((a, b) => b.cents - a.cents)
  if (sorted.length === 0)
    return <FinanceEmpty title="No usage yet" body="Metered spend appears here as your organization uses the platform." />
  const max = Math.max(...sorted.map((l) => l.cents), 1)
  return (
    <YStack gap="$2.5">
      {sorted.map((l, i) => (
        <XStack key={`${l.label}-${i}`} gap="$3" items="center">
          <Text width={140} fontSize="$2" color="$color11" numberOfLines={1}>
            {l.label}
          </Text>
          <YStack flex={1} height={8} bg="$color3" rounded={999} overflow="hidden">
            <YStack height={8} width={`${Math.max(2, (l.cents / max) * 100)}%` as never} bg="$color9" rounded={999} />
          </YStack>
          <YStack width={92} items="flex-end">
            <Money cents={l.cents} currency={currency} />
          </YStack>
        </XStack>
      ))}
    </YStack>
  )
}

/** A right-aligned numeric cell (tabular money / counts) for a @hanzo/ui DataTable column. */
function NumCell({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <XStack flex={1} justify="flex-end">
      {children}
    </XStack>
  )
}

/** The org's invoice history. Read-only; a hosted receipt opens in a new tab when present. */
export function InvoiceTable({ invoices }: { invoices: Invoice[] }): React.JSX.Element {
  const columns: Column<Invoice>[] = [
    {
      key: 'number',
      header: 'Invoice',
      render: (r) => (
        <Text fontSize="$3" color="$color12" numberOfLines={1}>
          {r.number ?? r.id}
        </Text>
      ),
    },
    { key: 'date', header: 'Date', render: (r) => <Text fontSize="$3" color="$color11">{formatDate(r.date)}</Text> },
    { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'amount', header: 'Amount', render: (r) => <NumCell><Money cents={r.cents} currency={r.currency} /></NumCell> },
    {
      key: 'url',
      header: '',
      width: 64,
      render: (r) =>
        r.url ? (
          <Text fontSize="$3" color="$color12" textDecorationLine="underline" cursor="pointer" onPress={() => openHref(r.url as string)}>
            View
          </Text>
        ) : (
          <Text fontSize="$3" color="$color10">—</Text>
        ),
    },
  ]
  return <DataTable columns={columns} rows={invoices} rowKey={(r) => r.id} empty="No invoices yet — issued invoices and receipts appear here." />
}

/** Saved payment methods — masked brand + last4 only. */
export function PaymentMethodList({ methods }: { methods: PaymentMethod[] }): React.JSX.Element {
  const columns: Column<PaymentMethod>[] = [
    { key: 'method', header: 'Method', render: (r) => <Text fontSize="$3" color="$color12">{cardLabel(r)}</Text> },
    {
      key: 'expires',
      header: 'Expires',
      render: (r) => (
        <Text fontSize="$3" color="$color11">
          {r.expMonth && r.expYear ? `${String(r.expMonth).padStart(2, '0')}/${r.expYear}` : '—'}
        </Text>
      ),
    },
    {
      key: 'default',
      header: '',
      width: 88,
      render: (r) =>
        r.isDefault ? (
          <XStack flex={1} justify="flex-end">
            <Text fontSize="$1" fontWeight="600" px="$2" py="$1" rounded="$3" bg="$color3" color="$color11">
              Default
            </Text>
          </XStack>
        ) : null,
    },
  ]
  return <DataTable columns={columns} rows={methods} rowKey={(r) => r.id} empty="No payment methods — add a card in the billing portal to enable auto-pay." />
}

/** The double-entry ledger — one row per posting with signed delta + running balance. */
export function LedgerTable({ entries }: { entries: LedgerEntry[] }): React.JSX.Element {
  const columns: Column<LedgerEntry>[] = [
    { key: 'date', header: 'Date', render: (r) => <Text fontSize="$3" color="$color11">{formatDate(r.date, true)}</Text> },
    { key: 'description', header: 'Description', render: (r) => <Text fontSize="$3" color="$color12" numberOfLines={1}>{r.description ?? '—'}</Text> },
    { key: 'account', header: 'Account', render: (r) => <Text fontSize="$2" color="$color10" numberOfLines={1}>{r.account ?? '—'}</Text> },
    { key: 'amount', header: 'Amount', render: (r) => <NumCell><Money cents={r.cents} currency={r.currency} colored /></NumCell> },
    {
      key: 'balance',
      header: 'Balance',
      render: (r) => <NumCell>{r.balanceCents !== undefined ? <Money cents={r.balanceCents} currency={r.currency} /> : <Text fontSize="$3" color="$color10">—</Text>}</NumCell>,
    },
  ]
  return (
    <DataTable
      columns={columns}
      rows={entries}
      rowKey={(r) => r.id}
      empty="No ledger activity — every money movement posts here: usage, top-ups, credits, and payouts."
    />
  )
}

export { formatDate, formatCount }
