'use client'

/**
 * TreasuryOverview — the product-owner / global-admin view finance.hanzo.ai + admin
 * surface. Reserve held, committed to payouts, free, plus the on-chain anchor (Hanzo
 * L1) when present. Rebuilt on the finance-ui `SectionCard` + `StatCard` (which are
 * themselves on @hanzo/gui + @hanzo/ui) — one component set across every finance scope.
 */
import { Text, XStack } from '@hanzo/gui'
import { asColor } from '@hanzo/ui/product'
import { POS, SectionCard, StatCard, PreviewBanner, formatMoney } from './primitives.js'
import { formatDate } from '../format.js'
import type { TreasurySummary } from '../types.js'

export function TreasuryOverview({ treasury }: { treasury: TreasurySummary }): React.JSX.Element {
  const pctCommitted =
    treasury.reserveCents > 0 ? Math.min(100, (treasury.committedCents / treasury.reserveCents) * 100) : 0
  const anchor = treasury.anchor
  const action = (
    <Text fontSize="$1" fontWeight="600" px="$2" py="$1" rounded="$3" bg="$color3" color={asColor(anchor?.chainId ? POS : '$color11')}>
      {anchor?.chainId ? `Anchored · chain ${anchor.chainId}` : 'Off-chain'}
    </Text>
  )
  return (
    <SectionCard title="Treasury" sub="The backed reserve behind credits and payouts." action={action}>
      <XStack gap="$3" flexWrap="wrap">
        <StatCard label="Reserve" value={formatMoney(treasury.reserveCents, treasury.currency)} sub="Total backed value" />
        <StatCard
          label="Committed"
          value={formatMoney(treasury.committedCents, treasury.currency)}
          sub={`${pctCommitted.toFixed(1)}% of reserve · pending payouts`}
        />
        <StatCard label="Available" value={formatMoney(treasury.availableCents, treasury.currency)} sub="Free reserve" />
      </XStack>
      {anchor?.chainId ? (
        <PreviewBanner>
          On-chain anchor · block {anchor.block?.toLocaleString('en-US') ?? '—'} · last anchored {formatDate(anchor.anchoredAt, true)}
        </PreviewBanner>
      ) : null}
    </SectionCard>
  )
}
