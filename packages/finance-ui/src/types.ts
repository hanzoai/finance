/**
 * The per-org `/v1/finance/*` data contract — shared verbatim by BOTH finance
 * surfaces (finance.hanzo.ai app shell + the console Finance module), so a "spend"
 * or "credits" card is the same value shape in each. Money is USD **cents**, integer,
 * end to end (never a float dollar) — matching the native ledger (hanzoai/finance,
 * one double-entry ledger on Base). Every field is optional-safe on the wire: a
 * not-yet-live backend degrades to honest zero/empty/`null`, never a fabricated figure.
 */

/** A currency amount. `cents` is a signed integer in the minor unit; `currency` is ISO-4217 lowercase. */
export type Money = {
  /** Signed integer amount in the currency's minor unit (USD cents). */
  cents: number
  /** ISO-4217 currency, lowercase (e.g. `usd`). */
  currency: string
}

/** The org's current standing with Hanzo — what's available to spend and what's owed. */
export type Balance = {
  currency: string
  /** Prepaid credit available to spend right now (cents). */
  availableCents: number
  /** Authorized-but-not-yet-settled holds (cents). */
  pendingCents: number
  /** Outstanding amount owed on open invoices (cents). */
  dueCents: number
  /** RFC3339 time the balance was computed. */
  asOf?: string
}

/** One credit grant / consumption on the org's credit account. */
export type Credit = {
  id: string
  /** Human label — "Signup grant", "Promo", "Top-up", … */
  label: string
  /** Signed cents: a grant is positive, consumption negative. */
  cents: number
  /** RFC3339 grant time. */
  grantedAt?: string
  /** RFC3339 expiry, when the grant expires; absent = non-expiring. */
  expiresAt?: string
  /** Remaining unspent portion of a grant (cents), when the ledger tracks it. */
  remainingCents?: number
}

/** One point on a metered-spend series (a day/hour bucket). */
export type UsagePoint = {
  /** RFC3339 bucket start. */
  date: string
  /** Spend in the bucket (cents). */
  cents: number
}

/** One metered line — spend attributed to a product/model/agent over the window. */
export type UsageLine = {
  /** What the spend is attributed to (product, model, or agent). */
  label: string
  /** Requests/units in the window, if metered. */
  units?: number
  /** Tokens consumed, if metered. */
  tokens?: number
  /** Cost in cents. */
  cents: number
}

/** Metered usage over a window — total, a time series, and a per-line breakdown. */
export type Usage = {
  /** Total metered spend in the window (cents). */
  totalCents: number
  currency: string
  /** RFC3339 window start/end, if reported. */
  start?: string
  end?: string
  /** Daily/hourly spend series (empty ⇒ honest flat/no-trend, never a fabricated curve). */
  series: UsagePoint[]
  /** Per-product/model/agent breakdown (empty ⇒ total only). */
  lines: UsageLine[]
}

/** One invoice in the org's billing history. */
export type Invoice = {
  id: string
  /** Invoice number, when distinct from the id. */
  number?: string
  /** RFC3339 issue date. */
  date?: string
  /** RFC3339 due date. */
  dueDate?: string
  /** Invoice total (cents). */
  cents: number
  currency: string
  /** Ledger/commerce status — paid, open, void, uncollectible, … */
  status?: string
  /** Hosted invoice / receipt URL, when the ledger provides one. */
  url?: string
}

/**
 * One saved payment method. Carries ONLY the masked, non-sensitive descriptor —
 * brand + last4 + expiry. A full PAN / CVV / gateway token is never present in this
 * shape and must never be surfaced.
 */
export type PaymentMethod = {
  id: string
  /** Kind — card, bank_account, sepa_debit, … */
  type?: string
  /** Card network / brand (visa, mastercard, amex), when a card. */
  brand?: string
  /** Last four digits — the only card-number fragment ever exposed. */
  last4?: string
  /** Expiry month (1–12), if a card. */
  expMonth?: number
  /** Expiry year (4-digit), if a card. */
  expYear?: number
  /** The org's default method. */
  isDefault?: boolean
}

/**
 * One posting in the double-entry ledger (`/v1/finance/ledger`). Each transaction
 * moves value between two accounts; a row shows the account, the signed delta, and
 * the running balance the ledger reports for that account.
 */
export type LedgerEntry = {
  id: string
  /** RFC3339 posting time. */
  date?: string
  /** Ledger account the posting hit (e.g. `credits:maxpower`, `revenue:usage`). */
  account?: string
  /** Human description of the transaction. */
  description?: string
  /** Signed cents moved (debit negative, credit positive by convention). */
  cents: number
  currency: string
  /** Running account balance after the posting (cents), when the ledger reports it. */
  balanceCents?: number
}

/**
 * The treasury / reserve summary (`/v1/finance/treasury`) — the product-owner view
 * finance.hanzo.ai surfaces: the backed reserve, funds committed to payouts, and the
 * on-chain anchor (Hanzo L1). All cents. Absent fields degrade to honest zero/—.
 */
export type TreasurySummary = {
  currency: string
  /** Total value held in the reserve fund (cents). */
  reserveCents: number
  /** Portion of the reserve committed to pending payouts (cents). */
  committedCents: number
  /** Free reserve = reserve − committed (cents). */
  availableCents: number
  /** On-chain anchor state, when the reserve is anchored on the Hanzo L1. */
  anchor?: {
    /** EVM chain id the reserve is anchored on (Hanzo L1 = 36963). */
    chainId?: number
    /** Anchor contract address. */
    address?: string
    /** Last anchored block height. */
    block?: number
    /** RFC3339 time of the last anchor. */
    anchoredAt?: string
  }
}

/** The window a usage/ledger read spans. Kept small + explicit — one grammar for both surfaces. */
export type Range = '24h' | '7d' | '30d' | '90d'

/** All ranges, in display order. */
export const RANGES: Range[] = ['24h', '7d', '30d', '90d']

/** Human label for a range. */
export const rangeLabel = (r: Range): string =>
  ({ '24h': '24 hours', '7d': '7 days', '30d': '30 days', '90d': '90 days' })[r]
