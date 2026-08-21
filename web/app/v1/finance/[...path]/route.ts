import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { cloudApiUrl } from '~/config'
import { readSession } from '~/lib/auth/session'

export const runtime = 'nodejs'

/**
 * The finance BFF — forwards a signed-in read of `/v1/finance/*` to the gated cloud API
 * with the session's user bearer, so the browser holds no token and the org is resolved
 * server-side from the bearer owner. Read-only, allow-listed to the documented finance
 * heads (never a general tunnel). Writes stay in the billing portal.
 *
 * NOTE (audience): the `hanzo-finance` access token carries `aud=<brand>-finance`. The
 * cloud finance surface must trust that audience (the finance backend adds it to its
 * accepted auds), OR this BFF re-mints a `<brand>-cloud`-audience bearer via a
 * confidential mint client — the console pattern.
 */
const ALLOWED = new Set(['balance', 'credits', 'usage', 'invoices', 'payment-methods', 'ledger', 'treasury'])

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await ctx.params
  const head = path?.[0] ?? ''
  if (!ALLOWED.has(head)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const store = await cookies()
  const session = readSession(store)
  if (!session) return NextResponse.json({ error: 'Sign in to view finance.' }, { status: 401 })

  const url = new URL(`${cloudApiUrl()}/v1/finance/${path.join('/')}`)
  const incoming = new URL(req.url)
  incoming.searchParams.forEach((v, k) => url.searchParams.set(k, v))

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10_000)
  try {
    const upstream = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${session.access}`, Accept: 'application/json', 'X-Org-Id': session.org },
      signal: ctrl.signal,
    })
    const text = await upstream.text()
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' },
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upstream error' }, { status: 502 })
  } finally {
    clearTimeout(timer)
  }
}
