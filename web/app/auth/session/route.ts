import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { readSession, clearSession, accountOf } from '~/lib/auth/session'

export const runtime = 'nodejs'

/** The signed-in account (from the sealed session), or 401 when signed out. */
export async function GET(): Promise<Response> {
  const store = await cookies()
  const session = readSession(store)
  if (!session) return NextResponse.json({ account: null }, { status: 401 })
  return NextResponse.json({ account: accountOf(session) })
}

/** Sign out — clear the session cookies. */
export async function DELETE(): Promise<Response> {
  const res = NextResponse.json({ ok: true })
  clearSession(res)
  return res
}
