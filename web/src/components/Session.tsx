'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { fetchAccount, startSignin, signOut as doSignOut, type Account } from '~/lib/auth/iam'

type SessionState = { account: Account | null | undefined; signOut: () => Promise<void>; reload: () => void }

const Ctx = createContext<SessionState>({ account: undefined, signOut: async () => {}, reload: () => {} })

/** Load the account once; provide it (and sign-out) to the shell. `undefined` = loading. */
export function SessionProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [account, setAccount] = useState<Account | null | undefined>(undefined)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let live = true
    fetchAccount().then((a) => {
      if (live) setAccount(a)
    })
    return () => {
      live = false
    }
  }, [tick])
  return (
    <Ctx.Provider value={{ account, signOut: doSignOut, reload: () => setTick((t) => t + 1) }}>{children}</Ctx.Provider>
  )
}

export const useSession = (): SessionState => useContext(Ctx)

function CenteredSpinner({ label }: { label: string }): React.JSX.Element {
  return (
    <div className="fin-center">
      <div className="fin-spinner" />
      <div className="fin-muted">{label}</div>
    </div>
  )
}

/**
 * Gate authenticated routes. While the account loads → a spinner; signed out → kick off
 * IAM sign-in (returning to the current path); signed in → render the shell.
 */
export function AuthGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { account } = useSession()
  useEffect(() => {
    if (account === null) {
      const here = typeof window !== 'undefined' ? window.location.pathname : undefined
      void startSignin(here)
    }
  }, [account])
  if (account === undefined) return <CenteredSpinner label="Loading…" />
  if (account === null) return <CenteredSpinner label="Redirecting to sign in…" />
  return <>{children}</>
}
