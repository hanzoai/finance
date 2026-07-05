import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { resolveConfig } from '~/config'
import { refreshGrant, sessionFromTokens } from '~/lib/auth/iam-server'
import { readSession, writeSession, accountOf } from '~/lib/auth/session'

export const runtime = 'nodejs'

/**
 * Silent token refresh (rotation-aware). On success it rotates the sealed session; on
 * failure it NEVER clears the cookie (a multi-tab rotation race must not nuke the
 * winner's fresh session) — only an explicit sign-out clears.
 */
export async function POST(req: Request): Promise<Response> {
  const store = await cookies()
  const current = readSession(store)
  if (!current?.refresh) return NextResponse.json({ account: null }, { status: 401 })

  const cfg = resolveConfig(req.headers.get('host'))
  try {
    const tokens = await refreshGrant({ refresh: current.refresh, clientId: cfg.iamClientId })
    const session = sessionFromTokens(tokens, cfg.iamOrg)
    if (!session) return NextResponse.json({ account: null }, { status: 401 })
    // Keep the prior refresh token if the grant didn't rotate one.
    if (!session.refresh) session.refresh = current.refresh
    const res = NextResponse.json({ account: accountOf(session) })
    writeSession(res, session)
    return res
  } catch {
    return NextResponse.json({ account: null }, { status: 401 })
  }
}
