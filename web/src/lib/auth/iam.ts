'use client'

import { config } from '~/config'
import { createPkce, stashPkce, takePkce } from './pkce'

/** The small account view the client renders (no tokens; server-derived). */
export type Account = { sub: string; name: string; email?: string; org: string; avatar?: string }

/** OAuth `state` — the app name satisfies every IAM path check (matches the console wire). */
const state = () => config.iamClientId

/**
 * Begin sign-in: mint PKCE, stash the verifier, and redirect to IAM's authorize
 * endpoint for the public `hanzo-finance` client. IAM presents its hosted login (or
 * reuses a live SSO session) and returns to `/auth/callback` with `?code&state`.
 */
export async function startSignin(returnTo?: string): Promise<void> {
  const pkce = await createPkce()
  const st = state()
  stashPkce(pkce, st)
  if (returnTo) {
    try {
      sessionStorage.setItem('hz_fin_return', returnTo)
    } catch {
      /* ignore */
    }
  }
  const u = new URL(`${config.iamUrl}/v1/iam/oauth/authorize`)
  u.searchParams.set('client_id', config.iamClientId)
  u.searchParams.set('organization', config.iamOrg)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('redirect_uri', `${window.location.origin}${config.callbackPath}`)
  u.searchParams.set('scope', 'openid profile email offline_access')
  u.searchParams.set('state', st)
  u.searchParams.set('code_challenge', pkce.challenge)
  u.searchParams.set('code_challenge_method', 'S256')
  window.location.assign(u.toString())
}

/** Redeem the code via the BFF (`/auth/signin`, secretless PKCE) → establishes the session cookie. */
export async function completeSignin(code: string): Promise<Account> {
  const { verifier } = takePkce()
  if (!verifier) throw new Error('Missing PKCE verifier — please sign in again.')
  const res = await fetch('/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, verifier, redirectUri: `${window.location.origin}${config.callbackPath}` }),
  })
  const json = (await res.json().catch(() => ({}))) as { account?: Account; error?: string }
  if (!res.ok || !json.account) throw new Error(json.error || 'Sign-in failed.')
  return json.account
}

/** Path to return to after sign-in (defaults to the app shell). */
export function takeReturnTo(): string {
  try {
    const r = sessionStorage.getItem('hz_fin_return')
    sessionStorage.removeItem('hz_fin_return')
    if (r && r.startsWith('/') && !r.startsWith('//')) return r
  } catch {
    /* ignore */
  }
  return config.appPath
}

/** Current account, or null when signed out. */
export async function fetchAccount(): Promise<Account | null> {
  const res = await fetch('/auth/session', { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const json = (await res.json().catch(() => ({}))) as { account?: Account }
  return json.account ?? null
}

/** Sign out (clears the session cookie) and return to the landing page. */
export async function signOut(): Promise<void> {
  await fetch('/auth/session', { method: 'DELETE' }).catch(() => undefined)
  window.location.assign('/')
}
