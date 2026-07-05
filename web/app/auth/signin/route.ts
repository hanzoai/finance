import { NextResponse } from 'next/server'
import { resolveConfig } from '~/config'
import { pkceCodeGrant, sessionFromTokens } from '~/lib/auth/iam-server'
import { writeSession, accountOf } from '~/lib/auth/session'

export const runtime = 'nodejs'

/**
 * Redeem the OAuth code (PKCE, no secret) for the `hanzo-finance` public client and
 * establish the sealed session cookie. The browser posts `{ code, verifier, redirectUri }`;
 * only the code + verifier + the app's own redirect_uri travel — never a client secret.
 */
export async function POST(req: Request): Promise<Response> {
  let body: { code?: string; verifier?: string; redirectUri?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }
  const { code, verifier, redirectUri } = body
  if (!code || !verifier || !redirectUri) return NextResponse.json({ error: 'Missing code or verifier.' }, { status: 400 })

  const cfg = resolveConfig(req.headers.get('host'))
  try {
    const tokens = await pkceCodeGrant({ code, verifier, clientId: cfg.iamClientId, redirectUri })
    const session = sessionFromTokens(tokens, cfg.iamOrg)
    if (!session) return NextResponse.json({ error: 'No access token returned.' }, { status: 502 })
    const res = NextResponse.json({ account: accountOf(session) })
    writeSession(res, session)
    return res
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sign-in failed.' }, { status: 401 })
  }
}
