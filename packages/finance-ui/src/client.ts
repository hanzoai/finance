/**
 * The ONE finance data-layer boundary. Both surfaces render the SAME components over
 * a `FinanceClient`; only the client differs:
 *
 *   - `stubFinanceClient()` — deterministic in-memory data (landing preview, local dev,
 *     tests). No network, no backend.
 *   - `httpFinanceClient(transport)` — the real `/v1/finance/*` reads. The HOST injects
 *     `transport` (a `(path, query) => Promise<unknown>`), so auth/proxy stays in the
 *     host (console mints a user bearer via its `/cloud` proxy; finance.hanzo.ai forwards
 *     through its own BFF). The components never know which one they got — swapping stub
 *     → http is a one-line change in the host with ZERO UI change.
 *
 * Every http response is run through an optional-safe normalizer (the same defensive
 * style as console's billing client): a renamed/absent field degrades a cell to "—",
 * an unconfigured backend yields honest zeros/empty, and a masked card can never leak a
 * PAN. Money is USD cents throughout.
 */
import type {
  Balance,
  Credit,
  Invoice,
  LedgerEntry,
  PaymentMethod,
  Range,
  TreasurySummary,
  Usage,
  UsageLine,
  UsagePoint,
} from './types.js'

/** The per-org finance reads. Every method is a plain read; writes stay in the billing portal. */
export interface FinanceClient {
  balance(): Promise<Balance>
  credits(): Promise<Credit[]>
  usage(range: Range): Promise<Usage>
  invoices(): Promise<Invoice[]>
  paymentMethods(): Promise<PaymentMethod[]>
  ledger(range: Range): Promise<LedgerEntry[]>
  /** The treasury/reserve summary — surfaced by the finance.hanzo.ai product owner view. */
  treasury(): Promise<TreasurySummary>
}

/** The host-injected transport: resolve a `/v1/finance/<path>` read to its raw JSON payload. */
export type FinanceTransport = (path: string, query?: Record<string, string | number | undefined>) => Promise<unknown>

// ── optional-safe primitives ────────────────────────────────────────────────
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined)
const bool = (v: unknown): boolean => v === true
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

/** Cents from a record that reports `cents`, or a dollar `amount`/`cost`/`total`. */
const centsOf = (r: Record<string, unknown>): number => {
  const c = num(r.cents) ?? num(r.amountCents) ?? num(r.costCents)
  if (c !== undefined) return Math.round(c)
  const dollars = num(r.amount) ?? num(r.cost) ?? num(r.total)
  return dollars !== undefined ? Math.round(dollars * 100) : 0
}

/** The first array found under any of the common envelope keys (or a bare array). */
const arrayUnder = (payload: unknown, keys: string[]): Record<string, unknown>[] => {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[]
  const root = obj(payload)
  for (const k of keys) {
    if (Array.isArray(root[k])) return root[k] as Record<string, unknown>[]
  }
  return []
}

/** Defense-in-depth: keep at most the last four digits, whatever the wire sent. */
const last4Of = (v: unknown): string | undefined => {
  const digits = (str(v) ?? '').replace(/\D/g, '')
  return digits ? digits.slice(-4) : undefined
}

const cur = (v: unknown): string => (str(v) ?? 'usd').toLowerCase()

// ── normalizers (exported for unit tests) ───────────────────────────────────
export function normalizeBalance(payload: unknown): Balance {
  const r = obj(payload)
  return {
    currency: cur(r.currency),
    availableCents: Math.round(num(r.availableCents) ?? num(r.available) ?? num(r.balanceCents) ?? num(r.balance) ?? 0),
    pendingCents: Math.round(num(r.pendingCents) ?? num(r.pending) ?? 0),
    dueCents: Math.round(num(r.dueCents) ?? num(r.due) ?? num(r.outstandingCents) ?? 0),
    asOf: str(r.asOf) ?? str(r.generatedAt) ?? str(r.updatedAt),
  }
}

export function normalizeCredits(payload: unknown): Credit[] {
  return arrayUnder(payload, ['credits', 'grants', 'data', 'items', 'rows']).map((r, i) => ({
    id: str(r.id) ?? str(r.grantId) ?? `credit-${i}`,
    label: str(r.label) ?? str(r.name) ?? str(r.description) ?? str(r.reason) ?? 'Credit',
    cents: centsOf(r),
    grantedAt: str(r.grantedAt) ?? str(r.createdAt) ?? str(r.date),
    expiresAt: str(r.expiresAt) ?? str(r.expiry),
    remainingCents: num(r.remainingCents) !== undefined ? Math.round(num(r.remainingCents) as number) : undefined,
  }))
}

function normalizeSeries(v: unknown): UsagePoint[] {
  return (Array.isArray(v) ? v : []).map((p) => {
    const r = obj(p)
    return { date: str(r.date) ?? str(r.ts) ?? str(r.bucket) ?? '', cents: centsOf(r) }
  })
}

function normalizeLines(v: unknown): UsageLine[] {
  return (Array.isArray(v) ? v : []).map((p) => {
    const r = obj(p)
    return {
      label: str(r.label) ?? str(r.product) ?? str(r.model) ?? str(r.agent) ?? str(r.name) ?? 'Usage',
      units: num(r.units) ?? num(r.count) ?? num(r.requests),
      tokens: num(r.tokens) ?? num(r.totalTokens),
      cents: centsOf(r),
    }
  })
}

export function normalizeUsage(payload: unknown): Usage {
  const r = obj(payload)
  const series = normalizeSeries(r.series ?? r.points ?? r.history)
  const lines = normalizeLines(r.lines ?? r.breakdown ?? r.byProduct ?? r.items)
  const totalFromRoot = num(r.totalCents) ?? (num(r.total) !== undefined ? Math.round((num(r.total) as number) * 100) : undefined)
  const linesSum = lines.reduce((a, l) => a + l.cents, 0)
  const seriesSum = series.reduce((a, p) => a + p.cents, 0)
  const totalCents = totalFromRoot ?? (linesSum || seriesSum)
  return { totalCents, currency: cur(r.currency), start: str(r.start), end: str(r.end), series, lines }
}

export function normalizeInvoices(payload: unknown): Invoice[] {
  return arrayUnder(payload, ['invoices', 'data', 'items', 'rows']).map((r, i) => ({
    id: str(r.id) ?? str(r.invoiceId) ?? str(r.number) ?? `invoice-${i}`,
    number: str(r.number) ?? str(r.invoiceNumber),
    date: str(r.date) ?? str(r.issuedAt) ?? str(r.createdAt) ?? str(r.created),
    dueDate: str(r.dueDate) ?? str(r.due),
    cents: centsOf(r),
    currency: cur(r.currency),
    status: str(r.status) ?? str(r.state),
    url: str(r.url) ?? str(r.hostedInvoiceUrl) ?? str(r.pdf) ?? str(r.invoiceUrl),
  }))
}

export function normalizePaymentMethods(payload: unknown): PaymentMethod[] {
  return arrayUnder(payload, ['paymentMethods', 'payment_methods', 'methods', 'data', 'rows']).map((r, i) => {
    const card = { ...obj(r.card), ...obj(r.data) }
    const last4 = last4Of(r.last4) ?? last4Of(card.last4) ?? last4Of(card.last_four)
    return {
      id: str(r.id) ?? str(r.paymentMethodId) ?? `pm-${i}`,
      type: str(r.type) ?? (last4 ? 'card' : undefined),
      brand: str(r.brand) ?? str(card.brand) ?? str(card.network),
      last4,
      expMonth: num(r.expMonth) ?? num(card.expMonth) ?? num(card.exp_month),
      expYear: num(r.expYear) ?? num(card.expYear) ?? num(card.exp_year),
      isDefault: r.isDefault === true || r.default === true || r.is_default === true,
    }
  })
}

export function normalizeLedger(payload: unknown): LedgerEntry[] {
  return arrayUnder(payload, ['entries', 'postings', 'ledger', 'transactions', 'data', 'rows']).map((r, i) => ({
    id: str(r.id) ?? str(r.txid) ?? str(r.transactionId) ?? `entry-${i}`,
    date: str(r.date) ?? str(r.postedAt) ?? str(r.timestamp) ?? str(r.createdAt),
    account: str(r.account) ?? str(r.dest) ?? str(r.source),
    description: str(r.description) ?? str(r.memo) ?? str(r.reference),
    cents: centsOf(r),
    currency: cur(r.currency ?? r.asset),
    // `balanceCents` is cents; a bare `balance` is dollars (consistent with `centsOf`).
    balanceCents:
      num(r.balanceCents) !== undefined
        ? Math.round(num(r.balanceCents) as number)
        : num(r.balance) !== undefined
          ? Math.round((num(r.balance) as number) * 100)
          : undefined,
  }))
}

export function normalizeTreasury(payload: unknown): TreasurySummary {
  const r = obj(payload)
  const anchor = obj(r.anchor)
  const reserve = Math.round(num(r.reserveCents) ?? num(r.reserve) ?? 0)
  const committed = Math.round(num(r.committedCents) ?? num(r.committed) ?? 0)
  const available = num(r.availableCents) !== undefined ? Math.round(num(r.availableCents) as number) : reserve - committed
  const hasAnchor = Object.keys(anchor).length > 0
  return {
    currency: cur(r.currency),
    reserveCents: reserve,
    committedCents: committed,
    availableCents: available,
    anchor: hasAnchor
      ? {
          chainId: num(anchor.chainId) ?? num(anchor.chain_id),
          address: str(anchor.address),
          block: num(anchor.block) ?? num(anchor.height),
          anchoredAt: str(anchor.anchoredAt) ?? str(anchor.anchored_at),
        }
      : undefined,
  }
}

/**
 * The real `/v1/finance/*` client. The host injects the transport (bearer-scoped fetch);
 * this owns ONLY the paths + the optional-safe normalize. A read that rejects (403/404/
 * network) propagates so the host renders its honest state — the client never fabricates.
 */
export function httpFinanceClient(transport: FinanceTransport): FinanceClient {
  return {
    balance: () => transport('balance').then(normalizeBalance),
    credits: () => transport('credits').then(normalizeCredits),
    usage: (range) => transport('usage', { range }).then(normalizeUsage),
    invoices: () => transport('invoices').then(normalizeInvoices),
    paymentMethods: () => transport('payment-methods').then(normalizePaymentMethods),
    ledger: (range) => transport('ledger', { range }).then(normalizeLedger),
    treasury: () => transport('treasury').then(normalizeTreasury),
  }
}

// ── deterministic stub ──────────────────────────────────────────────────────
// Illustrative-but-plausible data for the landing preview, local dev, and tests.
// Fully deterministic (a fixed seed) so a preview render is stable and a snapshot
// test is reproducible. This is the ONLY place synthetic finance numbers exist —
// production surfaces use `httpFinanceClient` with honest states.

const DAY = 86_400_000

/** A small deterministic PRNG (mulberry32) so the stub series is stable across renders. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rangeDays = (r: Range): number => ({ '24h': 1, '7d': 7, '30d': 30, '90d': 90 })[r]

function stubSeries(range: Range, seed: number): UsagePoint[] {
  const days = rangeDays(range)
  const rnd = mulberry32(seed + days)
  const now = Date.now()
  const buckets = range === '24h' ? 24 : days
  const step = range === '24h' ? DAY / 24 : DAY
  return Array.from({ length: buckets }, (_, i) => ({
    date: new Date(now - (buckets - 1 - i) * step).toISOString(),
    cents: Math.round(1800 + rnd() * 2600 + i * 24),
  }))
}

/**
 * A deterministic in-memory client. `seed` varies the numbers (e.g. per-org) while
 * staying stable for a given seed. Marketing/preview only — never charged, never live.
 */
export function stubFinanceClient(seed = 1): FinanceClient {
  const sum = (pts: UsagePoint[]) => pts.reduce((a, p) => a + p.cents, 0)
  return {
    balance: async () => ({
      currency: 'usd',
      availableCents: 4_235_00 + seed * 137,
      pendingCents: 128_40,
      dueCents: 0,
      asOf: new Date().toISOString(),
    }),
    credits: async () => [
      { id: 'c1', label: 'Startup grant', cents: 5_000_00, grantedAt: new Date(Date.now() - 60 * DAY).toISOString(), remainingCents: 4_235_00 },
      { id: 'c2', label: 'Q3 promo', cents: 500_00, grantedAt: new Date(Date.now() - 12 * DAY).toISOString(), expiresAt: new Date(Date.now() + 78 * DAY).toISOString(), remainingCents: 500_00 },
      { id: 'c3', label: 'Referral bonus', cents: 100_00, grantedAt: new Date(Date.now() - 4 * DAY).toISOString(), remainingCents: 100_00 },
    ],
    usage: async (range) => {
      const series = stubSeries(range, seed)
      return {
        totalCents: sum(series),
        currency: 'usd',
        start: series[0]?.date,
        end: series[series.length - 1]?.date,
        series,
        lines: [
          { label: 'Inference (Zen)', units: 184_204, tokens: 92_400_000, cents: Math.round(sum(series) * 0.52) },
          { label: 'Embeddings', units: 41_022, tokens: 21_800_000, cents: Math.round(sum(series) * 0.19) },
          { label: 'GPU compute', units: 312, cents: Math.round(sum(series) * 0.18) },
          { label: 'Object storage', units: 1, cents: Math.round(sum(series) * 0.07) },
          { label: 'Vector search', units: 68_431, cents: Math.round(sum(series) * 0.04) },
        ],
      }
    },
    invoices: async () => [
      { id: 'in_2026_06', number: 'HZ-2026-06', date: new Date(Date.now() - 5 * DAY).toISOString(), cents: 12_84_00, currency: 'usd', status: 'paid', url: '#' },
      { id: 'in_2026_05', number: 'HZ-2026-05', date: new Date(Date.now() - 35 * DAY).toISOString(), cents: 9_41_00, currency: 'usd', status: 'paid', url: '#' },
      { id: 'in_2026_04', number: 'HZ-2026-04', date: new Date(Date.now() - 65 * DAY).toISOString(), cents: 7_12_00, currency: 'usd', status: 'paid', url: '#' },
    ],
    paymentMethods: async () => [
      { id: 'pm1', type: 'card', brand: 'visa', last4: '4242', expMonth: 8, expYear: 2029, isDefault: true },
      { id: 'pm2', type: 'card', brand: 'mastercard', last4: '4444', expMonth: 3, expYear: 2028 },
    ],
    ledger: async (range) => {
      const days = rangeDays(range)
      const rnd = mulberry32(seed + 7)
      const now = Date.now()
      let bal = 4_235_00
      return Array.from({ length: Math.min(days, 24) }, (_, i) => {
        const delta = -Math.round(600 + rnd() * 2400)
        bal += delta
        return {
          id: `tx-${i}`,
          date: new Date(now - i * (DAY / 2)).toISOString(),
          account: 'credits:org',
          description: ['Inference usage', 'Embeddings usage', 'GPU-hour', 'Storage', 'Vector search'][i % 5],
          cents: delta,
          currency: 'usd',
          balanceCents: bal,
        }
      })
    },
    treasury: async () => ({
      currency: 'usd',
      reserveCents: 2_480_000_00,
      committedCents: 312_400_00,
      availableCents: 2_167_600_00,
      anchor: { chainId: 36963, address: '0x00000000000000000000000000000000000Fee5e', block: 4_812_004, anchoredAt: new Date(Date.now() - 3600_000).toISOString() },
    }),
  }
}
