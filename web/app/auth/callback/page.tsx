'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { completeSignin, takeReturnTo } from '~/lib/auth/iam'
import { HanzoMark } from '~/components/Logo'

/**
 * IAM OAuth callback. IAM returns `?code&state`; we redeem the code via the BFF (secretless
 * PKCE) to establish the session cookie, then land the user back where they started.
 */
function Callback(): React.JSX.Element {
  const params = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = params?.get('code')
    const err = params?.get('error')
    if (err) {
      setError(err === 'access_denied' ? 'Sign-in was cancelled.' : err)
      return
    }
    if (!code) {
      setError('Missing authorization code.')
      return
    }
    completeSignin(code)
      .then(() => router.replace(takeReturnTo()))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Sign-in failed.'))
  }, [params, router])

  if (error) {
    return (
      <div className="fin-center">
        <HanzoMark size={30} />
        <div style={{ fontWeight: 600 }}>{error}</div>
        <button className="fin-btn" onClick={() => router.replace('/signin')}>
          Back to sign in
        </button>
      </div>
    )
  }
  return (
    <div className="fin-center">
      <div className="fin-spinner" />
      <div className="fin-muted">Completing sign-in…</div>
    </div>
  )
}

export default function CallbackPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="fin-center"><div className="fin-spinner" /></div>}>
      <Callback />
    </Suspense>
  )
}
