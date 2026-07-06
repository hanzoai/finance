/**
 * @hanzo/finance-ui/data — the PURE data seam (types + normalizers + formatters), with
 * ZERO React / @hanzo/gui / @hanzo/ui. A host that only needs the transport (a Next BFF
 * route, a node/vitest transport test, an edge worker) imports the `FinanceClient` from
 * HERE and never pulls the Tamagui component graph. The UI barrel (`@hanzo/finance-ui`)
 * re-exports everything below plus the components.
 *
 *   import { httpFinanceClient, type FinanceClient } from '@hanzo/finance-ui/data'
 */
export * from './types'
export * from './format'
export * from './client'
