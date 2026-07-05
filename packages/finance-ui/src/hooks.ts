import { useCallback, useEffect, useRef, useState } from 'react'

/** The lifecycle of one async read — enough to render loading/error/data honestly. */
export type AsyncState<T> = {
  data: T | undefined
  loading: boolean
  error: unknown
  /** Re-run the loader (e.g. a Retry button or a range change). */
  reload: () => void
}

/**
 * Load an async value, re-running when `deps` change. A stale in-flight result never
 * overwrites a newer one (a race guard by request id), and a background reload keeps
 * the last good `data` on screen until the new value lands — so a range switch never
 * blanks a populated card.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(undefined)
  const reqRef = useRef(0)
  const [tick, setTick] = useState(0)

  const run = useCallback(() => {
    const id = ++reqRef.current
    setLoading(true)
    setError(undefined)
    loader()
      .then((v) => {
        if (id === reqRef.current) {
          setData(v)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (id === reqRef.current) {
          setError(e)
          setLoading(false)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
    return () => {
      // Invalidate any in-flight request when deps change / on unmount.
      reqRef.current++
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}
