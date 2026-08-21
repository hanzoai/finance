'use client'

/**
 * finance-ui primitives — rebuilt on the canonical Hanzo stack: @hanzo/gui (Tamagui
 * primitives: Card / Text / XStack / YStack / Button / Theme) and @hanzo/ui (the
 * product/dashboard layer: Sparkline, tokens). NO hand-rolled CSS — every surface
 * themes off the shared @hanzo/gui token system, so a finance card reads identically
 * to every other Hanzo console module (monochrome zinc-on-black, theme-aware). The
 * HOST supplies the `GuiProvider` (console + finance.hanzo.ai both do); `standalone`
 * only pins the light/dark `Theme` scope + a page background.
 */
import type { ReactNode } from 'react'
import { Button, Card, Text, Theme, XStack, YStack } from '@hanzo/gui'
import { Sparkline as UiSparkline } from '@hanzo/ui/product'
import { deltaPct, formatMoney, formatPct } from '../format'
import { RANGES, rangeLabel, type Range } from '../types'

/** Semantic sign colors — the same green/red the canonical @hanzo/ui MetricCard uses
 *  (monochrome-first surfaces, a single accent hue only to signal +/-). */
const POS = '#7ee787'
const NEG = '#e5534b'

/**
 * The finance surface root — scopes the light/dark `Theme` and paints the page
 * background. Wrap a finance-ui composition in this when the host does NOT already
 * pin a theme (finance.hanzo.ai). Inside the console (its own `Theme`/`GuiProvider`
 * already mounted) the board renders with `standalone={false}` and skips this.
 */
export function FinanceRoot({
  theme,
  children,
}: {
  theme?: 'light' | 'dark'
  children: ReactNode
}): React.JSX.Element {
  const body = (
    <YStack gap="$4" width="100%" bg="$background">
      {children}
    </YStack>
  )
  return theme ? <Theme name={theme}>{body}</Theme> : <>{body}</>
}

/** Signed money as a token-native `Text`. `colored` tints owed/spent red, credited green. */
export function Money({
  cents,
  currency = 'usd',
  colored = false,
  size,
}: {
  cents: number | null | undefined
  currency?: string
  colored?: boolean
  /** A @hanzo/gui font-size token (e.g. `$8`) to render a headline figure. */
  size?: string
}): React.JSX.Element {
  const signed = typeof cents === 'number' && cents !== 0
  const color = colored && signed ? (cents < 0 ? NEG : POS) : '$color12'
  return (
    <Text fontSize={(size ?? '$3') as never} fontWeight={size ? '800' : undefined} color={color as never} numberOfLines={1}>
      {formatMoney(cents, currency)}
    </Text>
  )
}

/** A dependency-free monochrome sparkline (the canonical @hanzo/ui one). <2 real points → nothing. */
export function Sparkline({
  values,
  width = 132,
  height = 34,
  color,
}: {
  values: number[]
  width?: number
  height?: number
  color?: string
}): React.JSX.Element | null {
  return <UiSparkline values={values} width={width} height={height} color={color} />
}

/** A trend chip vs a prior total. `null` prior ⇒ nothing (honest — never a fabricated ∞). */
export function DeltaChip({ current, prior }: { current?: number; prior?: number }): React.JSX.Element | null {
  const d = deltaPct(current, prior)
  if (d === null) return null
  const dir = d > 0.05 ? 'up' : d < -0.05 ? 'down' : 'flat'
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '→'
  const color = dir === 'up' ? POS : dir === 'down' ? NEG : '$color10'
  return (
    <Text fontSize="$1" fontWeight="600" color={color as never}>
      {arrow} {formatPct(Math.abs(d))}
    </Text>
  )
}

/** A KPI tile — label, headline value, optional sub, delta chip, sparkline. Mirrors the
 *  canonical @hanzo/ui `MetricCard` while accepting a loading `value` (a `<Skeleton/>`). */
export function StatCard({
  label,
  value,
  sub,
  icon,
  delta,
  spark,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  delta?: { current?: number; prior?: number }
  spark?: number[]
}): React.JSX.Element {
  const d = delta ? deltaPct(delta.current, delta.prior) : null
  const up = d !== null && d >= 0
  const valueNode =
    typeof value === 'string' || typeof value === 'number' ? (
      <Text fontSize="$8" fontWeight="900" color="$color12" numberOfLines={1}>
        {value}
      </Text>
    ) : (
      value
    )
  return (
    <Card p="$3.5" gap="$2" borderWidth={1} borderColor="$borderColor" flex={1} minW={200}>
      <XStack items="center" justify="space-between" gap="$2">
        <XStack items="center" gap="$2" flex={1}>
          {icon}
          <Text fontSize="$2" color="$color11" fontWeight="600" numberOfLines={1}>
            {label}
          </Text>
        </XStack>
        {d !== null ? (
          <Text fontSize="$1" fontWeight="600" color={up ? POS : NEG}>
            {up ? '▲' : '▼'} {formatPct(Math.abs(d))}
          </Text>
        ) : null}
      </XStack>
      <XStack items="flex-end" justify="space-between" gap="$2">
        {valueNode}
        {spark && spark.length >= 2 ? <Sparkline values={spark} width={104} height={30} /> : null}
      </XStack>
      {sub ? (
        <Text fontSize="$1" color="$color10" numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </Card>
  )
}

/**
 * A titled section. `flush` = the child draws its own frame (a @hanzo/ui `DataTable`),
 * so no outer card border/padding; otherwise a bordered card (chart / treasury panels).
 */
export function SectionCard({
  title,
  sub,
  action,
  flush,
  children,
}: {
  title: string
  sub?: ReactNode
  action?: ReactNode
  flush?: boolean
  children: ReactNode
}): React.JSX.Element {
  const header = (
    <XStack items="center" justify="space-between" gap="$2">
      <YStack gap="$1" flex={1}>
        <Text fontSize="$4" fontWeight="800" color="$color12">
          {title}
        </Text>
        {sub ? (
          <Text fontSize="$2" color="$color11">
            {sub}
          </Text>
        ) : null}
      </YStack>
      {action}
    </XStack>
  )
  if (flush) {
    return (
      <YStack gap="$3" width="100%">
        {header}
        {children}
      </YStack>
    )
  }
  return (
    <Card p="$4" gap="$3" borderWidth={1} borderColor="$borderColor" width="100%">
      {header}
      {children}
    </Card>
  )
}

/** A capitalized status pill — monochrome surface, a single accent hue for ok/warn. */
export function StatusPill({ status }: { status?: string }): React.JSX.Element {
  const s = (status ?? '').toLowerCase()
  const ok = ['paid', 'active', 'settled', 'complete', 'succeeded', 'anchored'].includes(s)
  const warn = ['open', 'past_due', 'overdue', 'unpaid', 'uncollectible', 'failed', 'void'].includes(s)
  const color = ok ? POS : warn ? NEG : '$color11'
  return (
    <Text fontSize="$1" fontWeight="600" px="$2" py="$1" rounded="$3" bg="$color3" color={color as never} textTransform="capitalize">
      {status || '—'}
    </Text>
  )
}

/** The shared range selector (24h / 7d / 30d / 90d) — a monochrome segmented control. */
export function RangeSelector({ value, onChange }: { value: Range; onChange: (r: Range) => void }): React.JSX.Element {
  return (
    <XStack borderWidth={1} borderColor="$borderColor" rounded={999} p="$0.5" gap="$0.5" bg="$color2">
      {RANGES.map((r) => {
        const active = r === value
        return (
          <Button
            key={r}
            size="$2"
            theme={active ? 'light' : undefined}
            chromeless={!active}
            rounded={999}
            onPress={() => onChange(r)}
            aria-label={rangeLabel(r)}
          >
            {r}
          </Button>
        )
      })}
    </XStack>
  )
}

/** Honest empty state. */
export function FinanceEmpty({ title, body }: { title: string; body?: string }): React.JSX.Element {
  return (
    <YStack p="$6" items="center" justify="center" gap="$2">
      <Text fontSize="$4" fontWeight="700" color="$color12">
        {title}
      </Text>
      {body ? (
        <Text fontSize="$2" color="$color11" text="center" maxW={380}>
          {body}
        </Text>
      ) : null}
    </YStack>
  )
}

/** Honest error state with an optional Retry. Never fabricates data behind an error. */
export function FinanceErrorCard({ error, onRetry }: { error: unknown; onRetry?: () => void }): React.JSX.Element {
  const msg = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Could not load finance data.'
  return (
    <YStack p="$6" items="center" gap="$3" borderWidth={1} borderColor="$borderColor" rounded="$4">
      <Text fontSize="$4" fontWeight="700" color="$color12">
        Could not load
      </Text>
      <Text fontSize="$2" color="$color11" text="center" maxW={420}>
        {msg}
      </Text>
      {onRetry ? (
        <Button size="$2" onPress={onRetry}>
          Retry
        </Button>
      ) : null}
    </YStack>
  )
}

/** A skeleton block for a loading region. */
export function Skeleton({ height = 16, width }: { height?: number; width?: number | string }): React.JSX.Element {
  return <YStack height={height} width={(width ?? '100%') as never} bg="$color3" rounded="$2" opacity={0.6} />
}

/** A dashed banner — used to label preview (non-live) data honestly. */
export function PreviewBanner({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <XStack items="center" gap="$2" borderWidth={1} borderColor="$borderColor" borderStyle="dashed" rounded="$3" px="$3" py="$2" bg="$color2">
      <Text fontSize="$2" color="$color11">
        {children}
      </Text>
    </XStack>
  )
}

export { formatMoney, formatPct, rangeLabel }
