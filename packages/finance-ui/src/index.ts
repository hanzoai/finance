/**
 * @hanzo/finance-ui — the shared finance data-layer + UI for Hanzo Finance surfaces.
 *
 * ONE source of truth for both finance.hanzo.ai (the product shell) and the console
 * Finance module, so a spend/usage/credits card looks and behaves identically in each.
 *
 *   import { FinanceDashboard, stubFinanceClient, httpFinanceClient } from '@hanzo/finance-ui'
 *
 * Data: swap `stubFinanceClient()` (preview/dev) ⇄ `httpFinanceClient(transport)` (live
 * `/v1/finance/*`) with ZERO UI change — the host owns auth/proxy via the injected transport.
 */
export * from './types.js'
export * from './format.js'
export * from './client.js'
export { useAsync, type AsyncState } from './hooks.js'
export { FINANCE_CSS } from './styles.js'

export {
  FinanceStyles,
  FinanceRoot,
  Money,
  Sparkline,
  DeltaChip,
  StatCard,
  SectionCard,
  StatusPill,
  RangeSelector,
  FinanceEmpty,
  FinanceErrorCard,
  Skeleton,
  PreviewBanner,
} from './components/primitives.js'
export { UsageBreakdown, InvoiceTable, PaymentMethodList, LedgerTable } from './components/tables.js'
export { TreasuryOverview } from './components/cards.js'
export { FinanceDashboard, type FinanceDashboardProps } from './components/FinanceDashboard.js'
