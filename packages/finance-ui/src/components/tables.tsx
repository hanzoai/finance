import * as React from 'react'
import { Money, StatusPill, FinanceEmpty } from './primitives.js'
import { formatDate, formatCount, cardLabel } from '../format.js'
import type { Invoice, LedgerEntry, PaymentMethod, UsageLine } from '../types.js'

/** Metered spend by product/model/agent — horizontal monochrome bars, largest first. */
export function UsageBreakdown({ lines, currency = 'usd' }: { lines: UsageLine[]; currency?: string }): React.JSX.Element {
  const sorted = [...lines].filter((l) => Number.isFinite(l.cents)).sort((a, b) => b.cents - a.cents)
  if (sorted.length === 0) return <FinanceEmpty title="No usage yet" body="Metered spend appears here as your organization uses the platform." />
  const max = Math.max(...sorted.map((l) => l.cents), 1)
  return (
    <div>
      {sorted.map((l, i) => (
        <div className="hz-fin-bar-row" key={`${l.label}-${i}`}>
          <div className="hz-fin-bar-label" title={l.label}>
            {l.label}
          </div>
          <div className="hz-fin-bar-track">
            <div className="hz-fin-bar-fill" style={{ width: `${Math.max(2, (l.cents / max) * 100)}%` }} />
          </div>
          <div className="hz-fin-bar-value">
            <Money cents={l.cents} currency={currency} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** The org's invoice history. Read-only; a hosted receipt opens in a new tab when present. */
export function InvoiceTable({ invoices }: { invoices: Invoice[] }): React.JSX.Element {
  if (invoices.length === 0) return <FinanceEmpty title="No invoices yet" body="Issued invoices and receipts will appear here." />
  return (
    <div className="hz-fin-scroll-x">
      <table className="hz-fin-table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Date</th>
            <th>Status</th>
            <th className="hz-fin-num">Amount</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td className="hz-fin-mono">{inv.number ?? inv.id}</td>
              <td>{formatDate(inv.date)}</td>
              <td>
                <StatusPill status={inv.status} />
              </td>
              <td className="hz-fin-num">
                <Money cents={inv.cents} currency={inv.currency} />
              </td>
              <td className="hz-fin-num">
                {inv.url ? (
                  <a href={inv.url} target="_blank" rel="noreferrer">
                    View
                  </a>
                ) : (
                  <span className="hz-fin-faint">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Saved payment methods — masked brand + last4 only. */
export function PaymentMethodList({ methods }: { methods: PaymentMethod[] }): React.JSX.Element {
  if (methods.length === 0) return <FinanceEmpty title="No payment methods" body="Add a card in the billing portal to enable auto-pay." />
  return (
    <div className="hz-fin-scroll-x">
      <table className="hz-fin-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>Expires</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {methods.map((pm) => (
            <tr key={pm.id}>
              <td>{cardLabel(pm)}</td>
              <td className="hz-fin-mono">
                {pm.expMonth && pm.expYear ? `${String(pm.expMonth).padStart(2, '0')}/${pm.expYear}` : '—'}
              </td>
              <td className="hz-fin-num">{pm.isDefault ? <span className="hz-fin-pill">Default</span> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The double-entry ledger — one row per posting with signed delta + running balance. */
export function LedgerTable({ entries }: { entries: LedgerEntry[] }): React.JSX.Element {
  if (entries.length === 0)
    return <FinanceEmpty title="No ledger activity" body="Every money movement posts here — usage, top-ups, credits, and payouts." />
  return (
    <div className="hz-fin-scroll-x">
      <table className="hz-fin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Account</th>
            <th className="hz-fin-num">Amount</th>
            <th className="hz-fin-num">Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td>{formatDate(e.date, true)}</td>
              <td>{e.description ?? '—'}</td>
              <td className="hz-fin-mono hz-fin-muted">{e.account ?? '—'}</td>
              <td className="hz-fin-num">
                <Money cents={e.cents} currency={e.currency} colored />
              </td>
              <td className="hz-fin-num hz-fin-muted">
                {e.balanceCents !== undefined ? <Money cents={e.balanceCents} currency={e.currency} /> : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { formatDate, formatCount }
