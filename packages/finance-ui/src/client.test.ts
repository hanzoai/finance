import { describe, it, expect } from 'vitest'
import {
  normalizeBalance,
  normalizeCredits,
  normalizeUsage,
  normalizeInvoices,
  normalizePaymentMethods,
  normalizeLedger,
  normalizeTreasury,
  httpFinanceClient,
  stubFinanceClient,
} from './client'

describe('normalizeBalance', () => {
  it('maps a real payload field-for-field', () => {
    const b = normalizeBalance({ currency: 'USD', availableCents: 423500, pendingCents: 12840, dueCents: 0, asOf: '2026-07-05T00:00:00Z' })
    expect(b).toEqual({ currency: 'usd', availableCents: 423500, pendingCents: 12840, dueCents: 0, asOf: '2026-07-05T00:00:00Z' })
  })
  it('reads alternate keys and defaults honestly', () => {
    expect(normalizeBalance({ balance: 100 }).availableCents).toBe(100)
    expect(normalizeBalance({ available: 5, outstandingCents: 300 }).dueCents).toBe(300)
    expect(normalizeBalance(null)).toEqual({ currency: 'usd', availableCents: 0, pendingCents: 0, dueCents: 0, asOf: undefined })
  })
})

describe('normalizeCredits', () => {
  it('reads bare arrays and enveloped lists', () => {
    expect(normalizeCredits([{ id: 'a', label: 'Grant', cents: 500 }])).toHaveLength(1)
    expect(normalizeCredits({ credits: [{ cents: 100 }] })[0]?.label).toBe('Credit')
  })
  it('never throws on garbage', () => {
    expect(() => normalizeCredits(null)).not.toThrow()
    expect(normalizeCredits('nope')).toEqual([])
  })
})

describe('normalizeUsage', () => {
  it('sums lines when no root total and keeps the series', () => {
    const u = normalizeUsage({
      currency: 'usd',
      series: [{ date: 'd1', cents: 100 }, { date: 'd2', cents: 200 }],
      lines: [{ label: 'Inference', cents: 250 }, { label: 'Embeddings', cents: 50 }],
    })
    expect(u.totalCents).toBe(300)
    expect(u.series).toHaveLength(2)
    expect(u.lines[0]).toEqual({ label: 'Inference', units: undefined, tokens: undefined, cents: 250 })
  })
  it('honors a root total and converts dollar totals to cents', () => {
    expect(normalizeUsage({ totalCents: 999, lines: [] }).totalCents).toBe(999)
    expect(normalizeUsage({ total: 12.5, lines: [] }).totalCents).toBe(1250)
  })
  it('degrades an empty payload to zero + empty', () => {
    const u = normalizeUsage({})
    expect(u.totalCents).toBe(0)
    expect(u.series).toEqual([])
    expect(u.lines).toEqual([])
  })
})

describe('normalizeInvoices', () => {
  it('reads amount from cents or dollars and picks a receipt url', () => {
    const [inv] = normalizeInvoices([{ id: 'in1', amount: 12.84, status: 'paid', hostedInvoiceUrl: 'https://x' }])
    expect(inv?.cents).toBe(1284)
    expect(inv?.url).toBe('https://x')
    expect(inv?.status).toBe('paid')
  })
})

describe('normalizePaymentMethods — PAN masking (security)', () => {
  it('never exposes more than the last four digits, even if a full PAN leaks upstream', () => {
    const [pm] = normalizePaymentMethods([{ id: 'pm1', card: { brand: 'visa', last4: '4111111111111111', exp_month: 8, exp_year: 2029 } }])
    expect(pm?.last4).toBe('1111')
    expect(pm?.brand).toBe('visa')
    expect(pm?.expMonth).toBe(8)
    expect(pm?.expYear).toBe(2029)
  })
  it('drops non-digits and reads default/network aliases', () => {
    const [pm] = normalizePaymentMethods({ payment_methods: [{ id: 'p', data: { network: 'amex', last_four: '0005' }, is_default: true }] })
    expect(pm?.last4).toBe('0005')
    expect(pm?.brand).toBe('amex')
    expect(pm?.isDefault).toBe(true)
  })
})

describe('normalizeLedger', () => {
  it('reads signed deltas + running balance across key aliases', () => {
    const [e] = normalizeLedger({ postings: [{ txid: 't1', amount: -12.5, memo: 'usage', account: 'credits:org', balance: 100 }] })
    expect(e?.cents).toBe(-1250)
    expect(e?.balanceCents).toBe(10000)
    expect(e?.description).toBe('usage')
  })
})

describe('normalizeTreasury', () => {
  it('derives available and reads the on-chain anchor', () => {
    const t = normalizeTreasury({ currency: 'usd', reserveCents: 1000, committedCents: 300, anchor: { chainId: 36963, address: '0xabc', block: 42 } })
    expect(t.availableCents).toBe(700)
    expect(t.anchor?.chainId).toBe(36963)
  })
  it('omits the anchor when absent (off-chain)', () => {
    expect(normalizeTreasury({ reserveCents: 5 }).anchor).toBeUndefined()
  })
})

describe('httpFinanceClient', () => {
  it('calls the injected transport with the right paths + query and normalizes the result', async () => {
    const calls: Array<[string, unknown]> = []
    const transport = async (path: string, query?: unknown) => {
      calls.push([path, query])
      if (path === 'balance') return { availableCents: 500 }
      if (path === 'usage') return { totalCents: 10, series: [], lines: [] }
      return []
    }
    const c = httpFinanceClient(transport)
    expect((await c.balance()).availableCents).toBe(500)
    expect((await c.usage('7d')).totalCents).toBe(10)
    await c.invoices()
    expect(calls).toContainEqual(['balance', undefined])
    expect(calls).toContainEqual(['usage', { range: '7d' }])
    expect(calls).toContainEqual(['invoices', undefined])
  })
  it('propagates a rejection (never fabricates) so the host renders its honest state', async () => {
    const c = httpFinanceClient(async () => {
      throw new Error('403')
    })
    await expect(c.balance()).rejects.toThrow('403')
  })
})

describe('stubFinanceClient', () => {
  it('is deterministic for a given seed', async () => {
    const a = await stubFinanceClient(1).usage('30d')
    const b = await stubFinanceClient(1).usage('30d')
    // Values are seed-deterministic; timestamps are `now`-relative by design.
    expect(a.totalCents).toBe(b.totalCents)
    expect(a.series.map((p) => p.cents)).toEqual(b.series.map((p) => p.cents))
    expect(a.lines.map((l) => l.cents)).toEqual(b.lines.map((l) => l.cents))
  })
  it('returns a fully-shaped, non-negative board', async () => {
    const c = stubFinanceClient(3)
    const [bal, usage, credits, invoices, methods, ledger, treasury] = await Promise.all([
      c.balance(), c.usage('7d'), c.credits(), c.invoices(), c.paymentMethods(), c.ledger('7d'), c.treasury(),
    ])
    expect(bal.availableCents).toBeGreaterThan(0)
    expect(usage.series.length).toBeGreaterThan(1)
    expect(usage.lines.length).toBeGreaterThan(0)
    expect(credits.length).toBeGreaterThan(0)
    expect(invoices.every((i) => i.cents > 0)).toBe(true)
    expect(methods.every((m) => (m.last4 ?? '').length <= 4)).toBe(true)
    expect(ledger.length).toBeGreaterThan(0)
    expect(treasury.anchor?.chainId).toBe(36963)
  })
})
