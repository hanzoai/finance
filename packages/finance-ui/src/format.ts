/**
 * Pure formatting helpers — shared by both surfaces so money/dates/percentages read
 * identically in the console Finance module and the finance.hanzo.ai shell. Every
 * helper degrades an absent/non-finite value to an honest em-dash, never a fabricated
 * "0" that could read as a real figure.
 */

const EMDASH = '—'

/** True for a real, finite number. */
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/**
 * Format signed USD cents as a currency string, e.g. 123456 → "$1,234.56",
 * -500 → "-$5.00". A non-finite value renders the em-dash. `currency` is ISO-4217.
 */
export function formatMoney(cents: number | null | undefined, currency = 'usd'): string {
  if (!isNum(cents)) return EMDASH
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100)
  } catch {
    // Unknown currency code → fall back to a plain USD-style render.
    const sign = cents < 0 ? '-' : ''
    return `${sign}$${Math.abs(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}

/**
 * Compact money for KPI tiles — 1_234_500 cents → "$12.3K", 250_000_000 → "$2.5M".
 * Under $10k it falls back to the full `formatMoney`. Non-finite → em-dash.
 */
export function formatMoneyCompact(cents: number | null | undefined, currency = 'usd'): string {
  if (!isNum(cents)) return EMDASH
  const dollars = cents / 100
  const abs = Math.abs(dollars)
  if (abs < 10_000) return formatMoney(cents, currency)
  const sign = dollars < 0 ? '-' : ''
  const sym = currency.toLowerCase() === 'usd' ? '$' : ''
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  return `${sign}${sym}${(abs / 1000).toFixed(abs >= 100_000 ? 0 : 1)}K`
}

/** Integer with thousands separators; non-finite → em-dash. */
export function formatCount(n: number | null | undefined): string {
  return isNum(n) ? Math.round(n).toLocaleString('en-US') : EMDASH
}

/** A percentage from a 0–100 value (NOT a 0–1 ratio); non-finite → em-dash. */
export function formatPct(pct: number | null | undefined, digits = 1): string {
  return isNum(pct) ? `${pct.toFixed(digits)}%` : EMDASH
}

/**
 * A short date from an RFC3339 string OR a Unix epoch (seconds or ms). Absent /
 * unparseable → em-dash. `withTime` adds HH:MM for ledger rows.
 */
export function formatDate(v: string | number | null | undefined, withTime = false): string {
  if (v === null || v === undefined || v === '') return EMDASH
  let ms: number
  if (typeof v === 'number' && Number.isFinite(v)) {
    ms = v < 1e12 ? v * 1000 : v // < 1e12 ⇒ seconds
  } else if (typeof v === 'string') {
    ms = Date.parse(v)
  } else {
    return EMDASH
  }
  if (Number.isNaN(ms)) return EMDASH
  const d = new Date(ms)
  const date = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  if (!withTime) return date
  return `${date}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
}

/**
 * A signed delta between two totals as a percentage change, for trend chips.
 * Returns `null` (honest "no trend") when the prior value is 0/absent — never a
 * fabricated ∞ or 100%.
 */
export function deltaPct(current: number | null | undefined, prior: number | null | undefined): number | null {
  if (!isNum(current) || !isNum(prior) || prior === 0) return null
  return ((current - prior) / Math.abs(prior)) * 100
}

/** Masked card label, e.g. "Visa •••• 4242"; degrades each fragment to nothing. */
export function cardLabel(pm: { brand?: string; last4?: string; type?: string }): string {
  const brand = pm.brand ? pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1) : (pm.type ?? 'Card')
  return pm.last4 ? `${brand} •••• ${pm.last4}` : brand
}
