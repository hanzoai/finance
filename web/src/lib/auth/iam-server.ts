import 'server-only'
import { serverIamUrl } from '~/config'
import type { Session } from './session'

/**
 * Server-side IAM (Hanzo IAM, NOT Casdoor) OAuth token operations for the public
 * `hanzo-finance` client. The BFF redeems the PKCE code and refreshes without a client
 * secret (RFC 7636 public-client path — the same secretless exchange the console admin
 * login uses). Canonical routes are `/v1/iam/oauth/*` (no `/api/` prefix).
 */

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  id_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

/** A fetch bounded by a timeout so a silent IAM never wedges the route. */
async function boundedFetch(url: string, init: RequestInit, ms = 10_000): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

/** Decode a JWT payload without verifying (transport is TLS; the resource server verifies). */
function decodeJwt(token: string): Record<string, unknown> {
  try {
    const part = token.split('.')[1]
    if (!part) return {}
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return {}
  }
}

const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined)
const numv = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)

/** Project an IAM token's claims into the small session identity. */
export function sessionFromTokens(tokens: TokenResponse, fallbackOrg: string): Session | null {
  const access = tokens.access_token
  if (!access) return null
  const claims = { ...decodeJwt(access), ...(tokens.id_token ? decodeJwt(tokens.id_token) : {}) }
  const owner = str(claims.owner)
  const name = str(claims.name) ?? str(claims.preferred_username) ?? str(claims.sub) ?? 'user'
  const sub = owner && name ? `${owner}/${name}` : (str(claims.sub) ?? name)
  const exp = numv(claims.exp) ?? Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 3600)
  return {
    sub,
    name: str(claims.displayName) ?? name,
    email: str(claims.email),
    org: owner ?? fallbackOrg,
    avatar: str(claims.avatar) ?? str(claims.picture),
    accessExp: exp,
    access,
    refresh: tokens.refresh_token,
  }
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await boundedFetch(`${serverIamUrl()}/v1/iam/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(body).toString(),
  })
  const json = (await res.json().catch(() => ({}))) as TokenResponse
  if (!res.ok || json.error || !json.access_token) {
    throw new Error(json.error_description || json.error || `IAM token exchange failed (HTTP ${res.status})`)
  }
  return json
}

/**
 * Optional confidential secret. `hanzo-finance` is a PUBLIC PKCE client — IAM admits the
 * empty-secret + S256-verifier exchange (RFC 7636 public-client path, proven live for the
 * console's admin-console). If ops provisions `IAM_CLIENT_SECRET` via KMS (confidential
 * upgrade), we send it too; otherwise the secretless PKCE path is used. NEVER hardcoded.
 */
const clientSecret = (): Record<string, string> => {
  const s = process.env.IAM_CLIENT_SECRET
  return s ? { client_secret: s } : {}
}

/** Redeem an authorization code with its PKCE verifier (secretless public client by default). */
export function pkceCodeGrant(input: { code: string; verifier: string; clientId: string; redirectUri: string }): Promise<TokenResponse> {
  return tokenRequest({
    grant_type: 'authorization_code',
    client_id: input.clientId,
    code: input.code,
    code_verifier: input.verifier,
    redirect_uri: input.redirectUri,
    ...clientSecret(),
  })
}

/** Refresh an access token with a rotating refresh token (secretless public client by default). */
export function refreshGrant(input: { refresh: string; clientId: string }): Promise<TokenResponse> {
  return tokenRequest({
    grant_type: 'refresh_token',
    client_id: input.clientId,
    refresh_token: input.refresh,
    scope: 'openid profile email offline_access',
    ...clientSecret(),
  })
}
