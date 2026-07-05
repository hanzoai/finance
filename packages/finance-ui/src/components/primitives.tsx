import * as React from 'react'
import { FINANCE_CSS } from '../styles.js'
import { formatMoney, formatPct, deltaPct } from '../format.js'
import { RANGES, rangeLabel, type Range } from '../types.js'

/**
 * Inject the finance-ui stylesheet once per document. Render it near the root of the
 * finance surface (inside the `.hz-fin` wrapper). Idempotent — a data-attribute guard
 * means many `<FinanceStyles/>` mounts still emit a single `<style>`.
 */
export function FinanceStyles(): React.JSX.Element {
  return <style data-hz-finance-ui="" dangerouslySetInnerHTML={{ __html: FINANCE_CSS }} />
}

/**
 * The finance surface root — scopes the design tokens (`.hz-fin`) and injects the
 * stylesheet. Wrap any finance-ui composition in this once. `theme` pins light/dark
 * (else it follows the viewer's `prefers-color-scheme`).
 */
export function FinanceRoot({
  theme,
  className,
  children,
}: {
  theme?: 'light' | 'dark'
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className={`hz-fin${className ? ` ${className}` : ''}`} data-theme={theme}>
      <FinanceStyles />
      {children}
    </div>
  )
}

/** Signed money, colored by sign (monochrome-friendly: red for owed/spent, green for credited). */
export function Money({
  cents,
  currency = 'usd',
  colored = false,
}: {
  cents: number | null | undefined
  currency?: string
  colored?: boolean
}): React.JSX.Element {
  const cls =
    colored && typeof cents === 'number' && cents !== 0 ? (cents < 0 ? ' hz-fin-money--neg' : ' hz-fin-money--pos') : ''
  return <span className={`hz-fin-money${cls}`}>{formatMoney(cents, currency)}</span>
}

/** A minimal, dependency-free monochrome sparkline. <2 points renders nothing (honest — no trend). */
export function Sparkline({
  values,
  width = 132,
  height = 34,
  strokeWidth = 1.5,
}: {
  values: number[]
  width?: number
  height?: number
  strokeWidth?: number
}): React.JSX.Element | null {
  const pts = values.filter((v) => Number.isFinite(v))
  if (pts.length < 2) return null
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const span = max - min || 1
  const step = width / (pts.length - 1)
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4)
  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${d} L${width},${height} L0,${height} Z`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block' }}>
      <path d={area} fill="var(--fin-accent)" opacity={0.07} />
      <path d={d} fill="none" stroke="var(--fin-accent)" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/** A trend chip vs a prior total. `null` prior ⇒ honest "no change" (never a fabricated ∞). */
export function DeltaChip({ current, prior }: { current?: number; prior?: number }): React.JSX.Element | null {
  const d = deltaPct(current, prior)
  if (d === null) return null
  const dir = d > 0.05 ? 'up' : d < -0.05 ? 'down' : 'flat'
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '→'
  return (
    <span className={`hz-fin-delta hz-fin-delta--${dir}`}>
      {arrow} {formatPct(Math.abs(d))}
    </span>
  )
}

/** A KPI tile — label, big value, optional sub, delta chip, and sparkline. */
export function StatCard({
  label,
  value,
  sub,
  icon,
  delta,
  spark,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon?: React.ReactNode
  delta?: { current?: number; prior?: number }
  spark?: number[]
}): React.JSX.Element {
  return (
    <div className="hz-fin-card hz-fin-stat">
      <div className="hz-fin-stat-label">
        {icon}
        {label}
      </div>
      <div className="hz-fin-stat-value">{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {sub ? <span className="hz-fin-stat-sub">{sub}</span> : null}
        {delta ? <DeltaChip current={delta.current} prior={delta.prior} /> : null}
      </div>
      {spark && spark.length >= 2 ? (
        <div className="hz-fin-stat-spark">
          <Sparkline values={spark} />
        </div>
      ) : null}
    </div>
  )
}

/** A titled card container with an optional right-aligned action slot. */
export function SectionCard({
  title,
  sub,
  action,
  flush,
  children,
}: {
  title: string
  sub?: React.ReactNode
  action?: React.ReactNode
  /** Remove padding (for a table that draws its own edges). */
  flush?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className={`hz-fin-card${flush ? ' hz-fin-card--flush' : ''}`}>
      <div className="hz-fin-card-head" style={flush ? { padding: '16px 20px 0' } : undefined}>
        <div>
          <div className="hz-fin-card-title">{title}</div>
          {sub ? <div className="hz-fin-card-sub">{sub}</div> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/** A capitalized status pill; `ok`/`warn` tint it while staying monochrome-first. */
export function StatusPill({ status }: { status?: string }): React.JSX.Element {
  const s = (status ?? '').toLowerCase()
  const ok = ['paid', 'active', 'settled', 'complete', 'succeeded'].includes(s)
  const warn = ['open', 'past_due', 'overdue', 'unpaid', 'uncollectible', 'failed', 'void'].includes(s)
  const cls = ok ? ' hz-fin-pill--ok' : warn ? ' hz-fin-pill--warn' : ''
  return <span className={`hz-fin-pill${cls}`}>{status || '—'}</span>
}

/** The shared range selector (24h / 7d / 30d / 90d). */
export function RangeSelector({ value, onChange }: { value: Range; onChange: (r: Range) => void }): React.JSX.Element {
  return (
    <div className="hz-fin-seg" role="group" aria-label="Time range">
      {RANGES.map((r) => (
        <button key={r} type="button" aria-pressed={r === value} onClick={() => onChange(r)}>
          {r}
        </button>
      ))}
    </div>
  )
}

/** Honest empty state. */
export function FinanceEmpty({ title, body }: { title: string; body?: string }): React.JSX.Element {
  return (
    <div className="hz-fin-state">
      <div className="hz-fin-state-title">{title}</div>
      {body ? <div className="hz-fin-state-body">{body}</div> : null}
    </div>
  )
}

/** Honest error state with an optional Retry. Never fabricates data behind an error. */
export function FinanceErrorCard({ error, onRetry }: { error: unknown; onRetry?: () => void }): React.JSX.Element {
  const msg = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Could not load finance data.'
  return (
    <div className="hz-fin-state">
      <div className="hz-fin-state-title">Could not load</div>
      <div className="hz-fin-state-body">{msg}</div>
      {onRetry ? (
        <button type="button" className="hz-fin-btn" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  )
}

/** A skeleton block for a loading region. */
export function Skeleton({ height = 16, width }: { height?: number; width?: number | string }): React.JSX.Element {
  return <div className="hz-fin-skel" style={{ height, width: width ?? '100%' }} />
}

/** A dashed banner — used to label preview (non-live) data honestly. */
export function PreviewBanner({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="hz-fin-banner">{children}</div>
}

export { formatMoney, formatPct, rangeLabel }
