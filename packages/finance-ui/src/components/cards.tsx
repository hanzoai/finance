import * as React from 'react'
import { StatCard, SectionCard, Money } from './primitives.js'
import { formatDate } from '../format.js'
import type { TreasurySummary } from '../types.js'

/**
 * The treasury / reserve summary — the product-owner view finance.hanzo.ai surfaces
 * (not shown to a plain customer). Reserve held, committed to payouts, free, plus the
 * on-chain anchor (Hanzo L1, chain 36963) when the reserve is anchored.
 */
export function TreasuryOverview({ treasury }: { treasury: TreasurySummary }): React.JSX.Element {
  const pctCommitted =
    treasury.reserveCents > 0 ? Math.min(100, (treasury.committedCents / treasury.reserveCents) * 100) : 0
  const anchor = treasury.anchor
  return (
    <SectionCard
      title="Treasury"
      sub="The backed reserve behind credits and payouts."
      action={
        anchor?.chainId ? (
          <span className="hz-fin-pill hz-fin-pill--ok" title={anchor.address}>
            Anchored · chain {anchor.chainId}
          </span>
        ) : (
          <span className="hz-fin-pill">Off-chain</span>
        )
      }
    >
      <div className="hz-fin-row">
        <StatCard label="Reserve" value={<Money cents={treasury.reserveCents} currency={treasury.currency} />} sub="Total backed value" />
        <StatCard
          label="Committed"
          value={<Money cents={treasury.committedCents} currency={treasury.currency} />}
          sub={`${pctCommitted.toFixed(1)}% of reserve · pending payouts`}
        />
        <StatCard label="Available" value={<Money cents={treasury.availableCents} currency={treasury.currency} />} sub="Free reserve" />
      </div>
      {anchor?.chainId ? (
        <div className="hz-fin-banner" style={{ marginTop: 14 }}>
          <span>
            On-chain anchor · block {anchor.block?.toLocaleString('en-US') ?? '—'} · last anchored {formatDate(anchor.anchoredAt, true)}
          </span>
        </div>
      ) : null}
    </SectionCard>
  )
}
