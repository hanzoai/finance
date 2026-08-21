'use client'

import { httpFinanceClient, stubFinanceClient, type FinanceClient } from '@hanzo/finance-ui'
import type { Mode } from '~/config'

/**
 * The browser transport for the live `/v1/finance/*` reads. It calls the app's OWN
 * origin `/v1/finance/<path>` (no `/api/` prefix — canonical `/v1/`), which the BFF
 * route handler (`app/v1/finance/[...path]`) forwards to the gated cloud API with the
 * session's user bearer. So the browser holds no token and the org is resolved
 * server-side from the bearer owner.
 */
async function transport(path: string, query?: Record<string, string | number | undefined>): Promise<unknown> {
  const u = new URL(`/v1/finance/${path}`, window.location.origin)
  if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined) u.searchParams.set(k, String(v))
  const res = await fetch(u.toString(), { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
  if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? 'Your session isn’t authorized for finance yet.' : `Finance API error (HTTP ${res.status})`)
  const body = (await res.json().catch(() => null)) as unknown
  // Unwrap a casibase `{ status, msg, data }` envelope; pass a bare payload through.
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>) && 'status' in (body as Record<string, unknown>)) {
    return (body as Record<string, unknown>).data
  }
  return body
}

/**
 * The finance client for the app shell. `live` reads real per-org `/v1/finance/*`;
 * `preview` renders deterministic illustrative data. The host resolves the mode on the
 * server (`financeMode`) and passes it in — ZERO UI change either way.
 */
export function financeClient(mode: Mode): FinanceClient {
  return mode === 'live' ? httpFinanceClient(transport) : stubFinanceClient()
}
