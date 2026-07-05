import 'server-only'
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'
import type { NextResponse } from 'next/server'

/**
 * The finance.hanzo.ai session — sealed, httpOnly, server-only. After the PKCE code
 * exchange we hold the projected identity claims + the IAM access/refresh tokens; the
 * browser never sees a token. Sealed with AES-256-GCM (key = HKDF over
 * `FINANCE_SESSION_SECRET`); on a missing secret a per-process random key is used, so a
 * secret is NEVER a hardcoded constant. Casdoor JWTs are large, so the sealed blob is
 * chunked across `hz_fin0..N` cookies (each < the ~4 KB per-cookie browser cap).
 */
export type Session = {
  /** IAM subject id (owner/name or the `sub` claim). */
  sub: string
  /** Display name. */
  name: string
  email?: string
  /** IAM organization (tenant) — scopes /v1/finance/*. */
  org: string
  avatar?: string
  /** Access-token expiry (epoch seconds). */
  accessExp: number
  /** The IAM access token (aud=<brand>-finance) — used server-side by the finance BFF. */
  access: string
  /** The rotating refresh token, when the grant returned one (offline_access). */
  refresh?: string
}

const COOKIE = 'hz_fin'
const MAX_CHUNK = 3500

let processKey: Buffer | null = null
function key(): Buffer {
  const secret = process.env.FINANCE_SESSION_SECRET
  if (secret) return Buffer.from(hkdfSync('sha256', Buffer.from(secret), Buffer.alloc(0), Buffer.from('hz-finance-session'), 32))
  if (!processKey) processKey = randomBytes(32)
  return processKey
}

function seal(obj: unknown): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, data]).toString('base64url')
}

function open<T>(sealed: string): T | null {
  try {
    const buf = Buffer.from(sealed, 'base64url')
    if (buf.length < 28) return null
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const data = buf.subarray(28)
    const decipher = createDecipheriv('aes-256-gcm', key(), iv)
    decipher.setAuthTag(tag)
    const out = Buffer.concat([decipher.update(data), decipher.final()])
    return JSON.parse(out.toString('utf8')) as T
  } catch {
    return null
  }
}

/** A cookie store shaped like `next/headers` `cookies()` — read chunk values. */
type CookieReader = { get(name: string): { value: string } | undefined }

/** Reassemble + open the sealed session from `hz_fin0..N`. Returns null when absent/expired/tampered. */
export function readSession(store: CookieReader): Session | null {
  let sealed = ''
  for (let i = 0; ; i++) {
    const c = store.get(`${COOKIE}${i}`)
    if (!c) break
    sealed += c.value
  }
  if (!sealed) return null
  const s = open<Session>(sealed)
  if (!s) return null
  if (typeof s.accessExp === 'number' && s.accessExp > 0 && Date.now() / 1000 > s.accessExp + 60) {
    // Expired beyond a small skew — treat as no session (the client re-auths / refreshes).
    return null
  }
  return s
}

/** Seal + chunk the session into httpOnly cookies on the response (clears stale extra chunks). */
export function writeSession(res: NextResponse, session: Session): void {
  const sealed = seal(session)
  const chunks: string[] = []
  for (let i = 0; i < sealed.length; i += MAX_CHUNK) chunks.push(sealed.slice(i, i + MAX_CHUNK))
  chunks.forEach((value, i) => {
    res.cookies.set(`${COOKIE}${i}`, value, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  })
  // Clear any leftover chunks from a previously-larger session.
  for (let i = chunks.length; i < chunks.length + 4; i++) {
    res.cookies.set(`${COOKIE}${i}`, '', { path: '/', maxAge: 0 })
  }
}

/** Clear the whole session (sign out). */
export function clearSession(res: NextResponse): void {
  for (let i = 0; i < 8; i++) res.cookies.set(`${COOKIE}${i}`, '', { path: '/', maxAge: 0 })
}

/** The small, browser-safe account view derived from a session (no tokens). */
export type Account = { sub: string; name: string; email?: string; org: string; avatar?: string }
export const accountOf = (s: Session): Account => ({ sub: s.sub, name: s.name, email: s.email, org: s.org, avatar: s.avatar })
