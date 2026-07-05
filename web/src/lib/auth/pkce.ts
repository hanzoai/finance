'use client'

/**
 * PKCE (RFC 7636) for the public `hanzo-finance` OAuth client — the SAME wire the
 * console admin login uses. A secretless authorization-code flow: the browser mints a
 * high-entropy verifier, sends only its S256 challenge to IAM's authorize endpoint, and
 * the BFF later redeems the code by presenting the verifier (no client secret in the
 * browser, none needed).
 */
export type Pkce = { verifier: string; challenge: string }

const b64url = (bytes: ArrayBuffer): string => {
  const b = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function createPkce(): Promise<Pkce> {
  const random = new Uint8Array(32)
  crypto.getRandomValues(random)
  const verifier = b64url(random.buffer)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return { verifier, challenge: b64url(digest) }
}

const KEY = 'hz_fin_pkce'
const STATE_KEY = 'hz_fin_state'

/** Stash the verifier + state across the authorize redirect (consumed once by the callback). */
export function stashPkce(p: Pkce, state: string): void {
  try {
    sessionStorage.setItem(KEY, p.verifier)
    sessionStorage.setItem(STATE_KEY, state)
  } catch {
    /* private mode — the callback then surfaces an honest error rather than a wrong redeem */
  }
}

/** One-shot read of the stashed verifier + state (cleared on read). */
export function takePkce(): { verifier?: string; state?: string } {
  try {
    const verifier = sessionStorage.getItem(KEY) || undefined
    const state = sessionStorage.getItem(STATE_KEY) || undefined
    sessionStorage.removeItem(KEY)
    sessionStorage.removeItem(STATE_KEY)
    return { verifier, state }
  } catch {
    return {}
  }
}
