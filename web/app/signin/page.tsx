'use client'

import { useEffect } from 'react'
import { config } from '~/config'
import { startSignin } from '~/lib/auth/iam'
import { HanzoMark } from '~/components/Logo'

/** Sign-in — kicks off Hanzo IAM OAuth (hanzo-finance) and offers a manual retry. */
export default function SignInPage(): React.JSX.Element {
  useEffect(() => {
    void startSignin(config.appPath)
  }, [])
  return (
    <div className="fin-center">
      <HanzoMark size={34} />
      <div style={{ fontWeight: 600, fontSize: 18 }}>Sign in to {config.productName}</div>
      <div className="fin-muted" style={{ maxWidth: 360 }}>
        Redirecting to Hanzo IAM for single sign-on…
      </div>
      <button className="fin-btn fin-btn--primary" onClick={() => startSignin(config.appPath)}>
        Continue with Hanzo
      </button>
    </div>
  )
}
