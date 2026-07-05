'use client'

import { SessionProvider, AuthGate } from '~/components/Session'

/** The app shell is gated: only a signed-in Hanzo account reaches the finance board. */
export default function AppLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <SessionProvider>
      <AuthGate>{children}</AuthGate>
    </SessionProvider>
  )
}
