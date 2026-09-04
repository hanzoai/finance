/**
 * @hanzo/finance-ui — the shared finance data-layer + UI for Hanzo Finance surfaces.
 *
 * ONE source of truth for finance.hanzo.ai (the tenant shell), the console per-org
 * Finance module, AND the console global-admin finance view — so a spend/usage/credits
 * card looks and behaves identically in each, at every scope.
 *
 *   import { FinanceDashboard, stubFinanceClient, httpFinanceClient } from '@hanzo/finance-ui'
 *
 * The UI is rebuilt on the canonical Hanzo stack: @hanzo/ui (dashboard layer) on
 * @hanzo/gui (Tamagui primitives). The HOST provides the `GuiProvider`; the board is a
 * pure presentation over an injected `FinanceClient`.
 *
 * Data: swap `stubFinanceClient()` (preview/dev) ⇄ `httpFinanceClient(transport)` (live
 * `/v1/finance/*`) with ZERO UI change — the host owns auth/proxy/scope via the injected
 * transport. Scope (which org, or all-orgs) is a property of the transport + identity,
 * never a different component.
 */
export * from './data.js'
export { useAsync, type AsyncState } from './hooks.js'

export {
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
