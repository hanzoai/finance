import { describe, it, expect } from 'vitest'
import { formatMoney, formatMoneyCompact, formatCount, formatPct, formatDate, deltaPct, cardLabel } from './format'

describe('formatMoney', () => {
  it('formats cents as currency', () => {
    expect(formatMoney(123456)).toBe('$1,234.56')
    expect(formatMoney(-500)).toBe('-$5.00')
    expect(formatMoney(0)).toBe('$0.00')
  })
  it('renders an em-dash for non-finite', () => {
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney(undefined)).toBe('—')
    expect(formatMoney(NaN)).toBe('—')
  })
})

describe('formatMoneyCompact', () => {
  it('compacts large amounts', () => {
    expect(formatMoneyCompact(1_234_500)).toBe('$12.3K')
    expect(formatMoneyCompact(250_000_000)).toBe('$2.5M')
  })
  it('falls back to full money under $10k', () => {
    expect(formatMoneyCompact(500_00)).toBe('$500.00')
  })
})

describe('formatCount / formatPct', () => {
  it('formats counts and percentages, honest em-dash on non-finite', () => {
    expect(formatCount(184204)).toBe('184,204')
    expect(formatCount(NaN)).toBe('—')
    expect(formatPct(12.345)).toBe('12.3%')
    expect(formatPct(undefined)).toBe('—')
  })
})

describe('formatDate', () => {
  it('parses ISO, epoch seconds and ms', () => {
    expect(formatDate('2026-07-05T00:00:00Z')).toMatch(/2026/)
    expect(formatDate(1_700_000_000)).toMatch(/2023/) // seconds
    expect(formatDate(1_700_000_000_000)).toMatch(/2023/) // ms
  })
  it('em-dashes absent/unparseable', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('not-a-date')).toBe('—')
  })
})

describe('deltaPct', () => {
  it('computes a signed percentage change', () => {
    expect(deltaPct(150, 100)).toBe(50)
    expect(deltaPct(50, 100)).toBe(-50)
  })
  it('returns null (honest no-trend) when the prior is 0/absent', () => {
    expect(deltaPct(10, 0)).toBeNull()
    expect(deltaPct(10, undefined)).toBeNull()
  })
})

describe('cardLabel', () => {
  it('renders a masked, capitalized label', () => {
    expect(cardLabel({ brand: 'visa', last4: '4242' })).toBe('Visa •••• 4242')
    expect(cardLabel({ type: 'bank_account' })).toBe('bank_account')
  })
})
